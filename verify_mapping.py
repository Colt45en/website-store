#!/usr/bin/env python3

"""
verify_mapping.py — Continuous validation of the Resonant Alphabet mapping.

Checks:
- Bijectivity / monotonicity (letters: v → f strictly increasing)
- Differentiability (all discrete df/dv > 0)
- Correlations on color dataset (v vs frequency >= 0.98; v vs Δsemitones == 1.0)

Usage:
  python verify_mapping.py
  python verify_mapping.py --data ./data
Env:
  DATA_DIR (optional): override data directory
"""
import os, sys, argparse
import pandas as pd
import numpy as np

DEFAULT_FILES = {
    "letters": "letters_audio_map_AZ_f0-440_R-12.csv",
    "colors": "color_audio_linking_map_24hues_f0-440_R-12.csv",
    "inverse": "inverse_sweep_v_audio_color_f0-440_R-12.csv",
}

def load_csvs(data_dir):
    paths = {k: os.path.join(data_dir, v) for k,v in DEFAULT_FILES.items()}
    # Fallback to /mnt/data if running locally here
    for k,p in list(paths.items()):
        if not os.path.exists(p):
            alt = os.path.join("/mnt/data", os.path.basename(p))
            if os.path.exists(alt):
                paths[k] = alt
    dfs = {k: pd.read_csv(p) for k,p in paths.items()}
    return dfs

def check_bijection_letters(df_letters):
    v = pd.to_numeric(df_letters["v"], errors="coerce").to_numpy()
    f = pd.to_numeric(df_letters["audio f (Hz)"], errors="coerce").to_numpy()
    if np.any(np.isnan(v)) or np.any(np.isnan(f)):
        raise AssertionError("NaNs in letters mapping")
    # Strictly increasing frequency over sorted v
    idx = np.argsort(v)
    v_sorted, f_sorted = v[idx], f[idx]
    if not np.all(np.diff(v_sorted) > 0):
        raise AssertionError("v is not strictly increasing")
    if not np.all(np.diff(f_sorted) > 0):
        raise AssertionError("f(v) is not strictly increasing ⇒ not bijective")
    # Discrete derivative positive
    dfdv = np.gradient(f_sorted, v_sorted)
    if not np.all(dfdv > 0):
        raise AssertionError("Derivative df/dv must be positive everywhere")
    return {
        "letters_monotone": True,
        "letters_derivative_positive": True,
        "mean_df_dv": float(np.mean(dfdv)),
        "var_df_dv": float(np.var(dfdv)),
    }

def check_color_correlations(df_colors, freq_col="audio f (Hz)"):
    v = pd.to_numeric(df_colors["v (from λ)"], errors="coerce")
    f = pd.to_numeric(df_colors[freq_col], errors="coerce")
    semi = pd.to_numeric(df_colors["Δ semitones"], errors="coerce")
    if v.isna().any() or f.isna().any() or semi.isna().any():
        raise AssertionError("NaNs in color mapping")
    corr_v_f = float(v.corr(f))
    corr_v_semi = float(v.corr(semi))
    # Thresholds
    if corr_v_f < 0.98:
        raise AssertionError(f"corr(v, frequency) too low: {corr_v_f:.4f} < 0.98")
    if abs(corr_v_semi - 1.0) > 1e-9:
        raise AssertionError(f"corr(v, Δsemitones) expected 1.0, got {corr_v_semi:.12f}")
    return {"corr_v_frequency": corr_v_f, "corr_v_semitones": corr_v_semi}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=os.environ.get("DATA_DIR", "./data"), help="Data directory with CSVs")
    args = ap.parse_args()

    dfs = load_csvs(args.data)
    results = {}
    results.update(check_bijection_letters(dfs["letters"]))
    results.update(check_color_correlations(dfs["colors"]))

    # Print JSON summary and exit 0 on success
    import json
    print(json.dumps({"ok": True, **results}, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # Print an error JSON and exit non-zero for CI
        import json, sys
        print(json.dumps({"ok": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)
