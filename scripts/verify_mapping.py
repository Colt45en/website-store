#!/usr/bin/env python3
"""
Pure-Python verifier for the Resonant Alphabet mapping.

This runs without external dependencies. It performs basic checks:
 - required CSVs present
 - monotonicity of v->f mapping
 - positivity of discrete derivative
 - simple Pearson correlation checks (implemented in pure Python)

Exit codes:
 0 success
 2 missing inputs
 3 verification failure
"""
import csv
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / 'data'
FILES = {
    'letters': 'letters_audio_map_AZ_f0-440_R-12.csv',
    'colors': 'color_audio_linking_map_24hues_f0-440_R-12.csv',
    'sweep': 'inverse_sweep_v_audio_color_f0-440_R-12.csv',
}

def read_column(path, colname):
    vals = []
    with open(path, newline='') as f:
        r = csv.DictReader(f)
        if r.fieldnames is None:
            raise ValueError('Empty or invalid CSV')
        if colname not in r.fieldnames:
            raise KeyError(colname)
        for row in r:
            try:
                vals.append(float(row[colname]))
            except Exception as e:
                raise ValueError(f'Non-numeric value in column {colname}: {e}')
    return vals

missing = [n for n,f in FILES.items() if not (DATA_DIR / f).exists()]
if missing:
    print('Missing data files:', missing)
    print('Place CSVs in', DATA_DIR)
    sys.exit(2)

try:
    v = read_column(DATA_DIR / FILES['letters'], 'v')
    f = read_column(DATA_DIR / FILES['letters'], 'f')
except KeyError as e:
    print(f"Required column missing in letters CSV: {e}")
    sys.exit(3)
except Exception as e:
    print('Error reading letters CSV:', e)
    sys.exit(3)

def is_strictly_increasing(arr):
    return all((arr[i+1] > arr[i]) for i in range(len(arr)-1)) if len(arr) >= 2 else True

if not is_strictly_increasing(v):
    print('v is not strictly increasing')
    sys.exit(3)
if not is_strictly_increasing(f):
    print('f is not strictly increasing')
    sys.exit(3)

# discrete derivative check
dfdv = []
for i in range(len(v)-1):
    dv = v[i+1] - v[i]
    if dv == 0:
        print('Zero delta v between samples')
        sys.exit(3)
    d = (f[i+1] - f[i]) / dv
    dfdv.append(d)

if not all(x > 0 for x in dfdv):
    print('Some discrete derivatives are non-positive')
    sys.exit(3)

print('Letters mapping: monotonicity and derivative checks PASSED')

def pearson(x, y):
    n = len(x)
    if n < 2:
        return 0.0
    mx = sum(x)/n
    my = sum(y)/n
    num = sum((x[i]-mx)*(y[i]-my) for i in range(n))
    sx = math.sqrt(sum((x[i]-mx)**2 for i in range(n)))
    sy = math.sqrt(sum((y[i]-my)**2 for i in range(n)))
    if sx == 0 or sy == 0:
        return 0.0
    return num/(sx*sy)

semitones = [12*math.log2(fi / f[0]) for fi in f]
corr = pearson(v, semitones)
print(f'Correlation(v, semitones): {corr:.6f}')
if corr < 0.98:
    print('Correlation below threshold (0.98)')
    sys.exit(3)

print('Correlation check PASSED')

try:
    cv = read_column(DATA_DIR / FILES['colors'], 'v')
    cf = read_column(DATA_DIR / FILES['colors'], 'f')
except KeyError as e:
    print(f"Required column missing in colors CSV: {e}")
    sys.exit(3)
except Exception as e:
    print('Error reading colors CSV:', e)
    sys.exit(3)

corr2 = pearson(cv, [12*math.log2(fi / cf[0]) for fi in cf])
print(f'Color correlation(v, semitones): {corr2:.6f}')

try:
    _ = read_column(DATA_DIR / FILES['sweep'], 'v')
    _ = read_column(DATA_DIR / FILES['sweep'], 'f')
except KeyError as e:
    print(f"Required column missing in sweep CSV: {e}")
    sys.exit(3)
except Exception as e:
    print('Error reading sweep CSV:', e)
    sys.exit(3)

print('Sweep file present and contains v/f')
print('All checks passed')
sys.exit(0)
