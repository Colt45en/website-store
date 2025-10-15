# Quick Start Guide

## Installation (30 seconds)

```bash
# Clone and setup
git clone https://github.com/Colt45en/website-store.git
cd website-store
pip install -r requirements.txt
```

## Run Everything (1 minute)

```bash
# Run verification (generates datasets)
python verify.py

# Run unit tests
python test_lissajous.py

# See examples
python example_usage.py
```

## Expected Output

### Verification Script ✓
```
✓ PASSED: Generated 1000 points
✓ PASSED: Amplitude bounds validated
✓ PASSED: Curve is smooth
✓ PASSED: Arc length = 5.66
✓ PASSED: Bounding box calculated correctly
✓ PASSED: Symmetry score = 0.682

Tests Passed: 6/6
```

### Generated Files
- `datasets/` - 6 curve CSVs + 1 summary CSV
- `verification_results.json` - Test results

## Quick API Usage

```python
from verify import LissajousGeometry
import numpy as np

# Create and generate a curve
curve = LissajousGeometry(
    amplitude_x=1.0,
    amplitude_y=1.0,
    frequency_x=3.0,
    frequency_y=2.0,
    phase_shift=np.pi/2
)

x, y = curve.generate_curve()

# Calculate metrics
arc_length = curve.calculate_arc_length(x, y)
bbox = curve.calculate_bounding_box(x, y)
symmetry = curve.calculate_symmetry_score(x, y)

print(f"Arc Length: {arc_length:.2f}")
print(f"Symmetry: {symmetry:.3f}")
```

## Common Use Cases

### 1. Generate a Circle
```python
curve = LissajousGeometry(
    frequency_x=1.0, frequency_y=1.0,
    phase_shift=np.pi/2
)
x, y = curve.generate_curve()
```

### 2. Create Complex Pattern
```python
curve = LissajousGeometry(
    frequency_x=5.0, frequency_y=4.0,
    phase_shift=np.pi/2
)
x, y = curve.generate_curve()
```

### 3. Validate Properties
```python
from verify import ValidationMetrics

validator = ValidationMetrics()
is_valid = validator.validate_amplitude_bounds(x, y, 1.0, 1.0)
is_smooth = validator.validate_smoothness(x, y)
```

## File Overview

| File | Purpose |
|------|---------|
| `verify.py` | Main verification script |
| `test_lissajous.py` | Unit tests (10 tests) |
| `example_usage.py` | Usage examples |
| `LISSAJOUS_DOCUMENTATION.md` | Complete docs |
| `IMPLEMENTATION_SUMMARY.md` | Project summary |
| `.github/workflows/verify.yml` | CI/CD |

## Documentation

- **Full Documentation**: [LISSAJOUS_DOCUMENTATION.md](LISSAJOUS_DOCUMENTATION.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Project Info**: [README.md](README.md)

## Need Help?

- Check [LISSAJOUS_DOCUMENTATION.md](LISSAJOUS_DOCUMENTATION.md) for detailed information
- Run `python example_usage.py` for practical examples
- See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details

## Mathematical Background

Lissajous curves are defined by:
```
x(t) = A · sin(a·t + δ)
y(t) = B · sin(b·t)
```

Where:
- **A, B**: Amplitudes
- **a, b**: Frequency ratios
- **δ**: Phase shift
- **t**: Time (0 to 2π)

## Validation Checklist

✓ All verification tests passing (6/6)  
✓ All unit tests passing (10/10)  
✓ Datasets generated (7 CSV files)  
✓ Documentation complete  
✓ CI/CD configured  
✓ Examples working  

**You're ready to use the Lissajous Geometry System!**
