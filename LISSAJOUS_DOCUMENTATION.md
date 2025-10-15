# Lissajous Geometry System Documentation

## Overview

This documentation provides comprehensive information about the Lissajous Geometry System implementation, including mathematical formulations, validation metrics, and usage instructions.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Mathematical Formulation](#2-mathematical-formulation)
3. [System Architecture](#3-system-architecture)
4. [Validation Metrics](#4-validation-metrics)
5. [Usage Instructions](#5-usage-instructions)
6. [Dataset Generation](#6-dataset-generation)
7. [Continuous Integration](#7-continuous-integration)
8. [Reproducibility Checklist](#8-reproducibility-checklist)

---

## 1. Introduction

Lissajous curves are parametric curves that result from the combination of two perpendicular harmonic motions. Named after French physicist Jules Antoine Lissajous, these curves have applications in physics, engineering, signal processing, and computer graphics.

### Applications

- **Physics**: Visualization of oscillatory motion and harmonic relationships
- **Signal Processing**: Phase difference analysis between two signals
- **Engineering**: Vibration analysis and mechanical system characterization
- **Computer Graphics**: Procedural generation of aesthetically pleasing patterns

---

## 2. Mathematical Formulation

### 2.1 Parametric Equations

The Lissajous curve is defined by the following parametric equations:

```
x(t) = A · sin(a·t + δ)
y(t) = B · sin(b·t)
```

Where:
- **A, B**: Amplitudes in the x and y directions respectively
- **a, b**: Frequency ratios (also called angular frequencies)
- **δ** (delta): Phase shift in radians
- **t**: Time parameter, typically ranging from 0 to 2π

### 2.2 Special Cases

#### Circle (a = b, δ = π/2)
When the frequencies are equal and phase shift is π/2:
```
x(t) = A · sin(t + π/2) = A · cos(t)
y(t) = B · sin(t)
```
With A = B, this produces a circle.

#### Diagonal Line (a = b, δ = 0)
When frequencies are equal with no phase shift:
```
x(t) = A · sin(t)
y(t) = B · sin(t)
```
This produces a diagonal line.

#### Complex Patterns (a ≠ b)
When frequencies differ, complex patterns emerge. The curve's complexity depends on the ratio a/b:
- **Rational ratios** (e.g., 3/2, 5/4): Produce closed, periodic curves
- **Irrational ratios**: Produce dense, non-periodic curves that never exactly repeat

### 2.3 Curve Properties

#### Periodicity
The curve is periodic if the frequency ratio a/b is a rational number. The period T is:
```
T = 2π · LCM(a, b) / GCD(a, b)
```

#### Symmetry
Lissajous curves exhibit various symmetries depending on parameters:
- **X-axis symmetry**: When δ = 0 or δ = π
- **Y-axis symmetry**: When δ = π/2 or δ = 3π/2
- **Point symmetry**: Present in many configurations

---

## 3. System Architecture

### 3.1 Core Components

#### LissajousGeometry Class
The main class for generating and analyzing Lissajous curves.

**Attributes:**
- `A`, `B`: Amplitude parameters
- `a`, `b`: Frequency parameters
- `delta`: Phase shift
- `num_points`: Number of points in the curve
- `t`: Time parameter array

**Methods:**
- `generate_curve()`: Generates x, y coordinates
- `calculate_arc_length()`: Computes curve length
- `calculate_bounding_box()`: Determines curve bounds
- `calculate_symmetry_score()`: Quantifies curve symmetry

#### ValidationMetrics Class
Provides validation methods for curve properties.

**Methods:**
- `validate_amplitude_bounds()`: Verifies amplitude constraints
- `validate_periodicity()`: Checks curve periodicity
- `validate_smoothness()`: Ensures curve continuity

### 3.2 Design Principles

1. **Modularity**: Separate concerns (generation, validation, metrics)
2. **Extensibility**: Easy to add new curve types or metrics
3. **Type Safety**: Uses type hints throughout
4. **Documentation**: Comprehensive docstrings for all functions

---

## 4. Validation Metrics

### 4.1 Amplitude Validation

Ensures generated curves respect the specified amplitude bounds:

```python
actual_amplitude = max(|x|)
valid = |actual_amplitude - expected_amplitude| ≤ tolerance
```

**Default Tolerance**: 0.01 (1%)

### 4.2 Periodicity Validation

For curves with rational frequency ratios, validates closure:

```python
closure_distance = √[(x₀ - xₙ)² + (y₀ - yₙ)²]
normalized_distance = closure_distance / max_dimension
valid = normalized_distance ≤ tolerance
```

**Default Tolerance**: 0.1 (10%)

### 4.3 Smoothness Validation

Checks for discontinuities by examining second derivatives:

```python
d²x/dt² = Δ²x
d²y/dt² = Δ²y
valid = max(|d²x/dt²|, |d²y/dt²|) < max_curvature
```

**Default Max Curvature**: 100.0

### 4.4 Arc Length Calculation

Approximates curve length using line segments:

```python
L ≈ Σ √[(Δxᵢ)² + (Δyᵢ)²]
```

For a circle of radius r: L ≈ 2πr

### 4.5 Symmetry Score

Quantifies curve symmetry (0 to 1 scale):

```python
symmetry_deviation = mean(|x + flip(x)|) + mean(|y + flip(y)|)
symmetry_score = 1 - (symmetry_deviation / (4 · max_amplitude))
```

Score interpretation:
- **1.0**: Perfectly symmetric
- **0.7-0.9**: Highly symmetric
- **0.4-0.7**: Moderately symmetric
- **<0.4**: Low symmetry

---

## 5. Usage Instructions

### 5.1 Installation

```bash
# Clone the repository
git clone https://github.com/Colt45en/website-store.git
cd website-store

# Install dependencies
pip install -r requirements.txt
```

### 5.2 Running the Verification Script

```bash
# Run full verification suite
python verify.py

# Make script executable (optional)
chmod +x verify.py
./verify.py
```

### 5.3 Basic Usage Examples

#### Example 1: Generate a Simple Lissajous Curve

```python
from verify import LissajousGeometry

# Create a 3:2 frequency ratio curve
lissajous = LissajousGeometry(
    amplitude_x=1.0,
    amplitude_y=1.0,
    frequency_x=3.0,
    frequency_y=2.0,
    phase_shift=np.pi/2
)

# Generate coordinates
x, y = lissajous.generate_curve()
```

#### Example 2: Calculate Metrics

```python
# Calculate various properties
arc_length = lissajous.calculate_arc_length(x, y)
bbox = lissajous.calculate_bounding_box(x, y)
symmetry = lissajous.calculate_symmetry_score(x, y)

print(f"Arc Length: {arc_length:.2f}")
print(f"Bounding Box: {bbox}")
print(f"Symmetry Score: {symmetry:.3f}")
```

#### Example 3: Validate Curve Properties

```python
from verify import ValidationMetrics

validator = ValidationMetrics()

# Validate amplitude
is_valid = validator.validate_amplitude_bounds(x, y, 1.0, 1.0)
print(f"Amplitude Valid: {is_valid}")

# Validate smoothness
is_smooth = validator.validate_smoothness(x, y)
print(f"Curve Smooth: {is_smooth}")
```

---

## 6. Dataset Generation

### 6.1 Overview

The verification script generates six standard Lissajous curve datasets in CSV format. These datasets represent common and interesting curve configurations.

### 6.2 Standard Configurations

| Name | Freq Ratio | Phase | Description |
|------|------------|-------|-------------|
| circle | 1:1 | 0° | Perfect circle |
| diagonal | 1:1 | 90° | Diagonal line |
| standard_3_2 | 3:2 | 90° | Classic Lissajous pattern |
| standard_5_4 | 5:4 | 90° | Complex pattern |
| asymmetric_3_2 | 3:2 | 0° | Asymmetric variant |
| inverted_2_3 | 2:3 | 45° | Inverted frequency ratio |

### 6.3 Dataset Format

Each CSV file contains three columns:

```csv
t,x,y
0.0000,0.0000,0.0000
0.0063,0.9950,0.0628
0.0126,0.9801,0.1253
...
```

- **t**: Time parameter (0 to 2π)
- **x**: X-coordinate
- **y**: Y-coordinate

### 6.4 Summary Statistics

A `summary.csv` file provides aggregate metrics:

```csv
name,amplitude_x,amplitude_y,frequency_x,frequency_y,phase_shift,arc_length,x_min,x_max,y_min,y_max,symmetry_score
circle,1.0,1.0,1.0,1.0,0.0,6.28,-1.0,1.0,-1.0,1.0,0.995
...
```

### 6.5 Generating Custom Datasets

To generate additional datasets:

```python
from verify import LissajousGeometry
import csv

# Create custom configuration
lissajous = LissajousGeometry(
    amplitude_x=2.0,
    amplitude_y=1.5,
    frequency_x=7.0,
    frequency_y=5.0,
    phase_shift=0.0
)

x, y = lissajous.generate_curve()

# Save to CSV
with open('custom_lissajous.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['t', 'x', 'y'])
    for i, (xi, yi) in enumerate(zip(x, y)):
        writer.writerow([lissajous.t[i], xi, yi])
```

---

## 7. Continuous Integration

### 7.1 GitHub Actions Workflow

The project includes automated validation via GitHub Actions. On every push and pull request, the system:

1. Sets up Python environment
2. Installs dependencies
3. Runs verification script
4. Generates datasets
5. Archives results as artifacts

### 7.2 Workflow Configuration

See `.github/workflows/verify.yml` for the complete configuration.

### 7.3 Manual CI Execution

```bash
# Run the same checks locally
pip install -r requirements.txt
python verify.py
```

---

## 8. Reproducibility Checklist

This project follows best practices for scientific reproducibility:

- [x] **Version Control**: All code tracked in Git
- [x] **Dependency Management**: `requirements.txt` with version constraints
- [x] **Documentation**: Comprehensive inline and external documentation
- [x] **Automated Testing**: Verification suite with multiple test cases
- [x] **Continuous Integration**: GitHub Actions workflow
- [x] **Dataset Generation**: Automated, reproducible dataset creation
- [x] **Mathematical Validation**: Rigorous validation metrics
- [x] **Code Quality**: Type hints, docstrings, and clean code practices
- [x] **Parametric Consistency**: Well-defined parameter ranges and defaults
- [x] **Error Handling**: Graceful error handling throughout

### 8.1 Reproduction Steps

To reproduce all results:

```bash
# 1. Clone repository
git clone https://github.com/Colt45en/website-store.git
cd website-store

# 2. Set up environment
pip install -r requirements.txt

# 3. Run verification
python verify.py

# 4. Check outputs
ls -la datasets/
cat verification_results.json
```

### 8.2 Expected Outputs

- **6 CSV dataset files** in `datasets/` directory
- **1 summary CSV** with aggregate metrics
- **verification_results.json** with test results
- **Console output** showing all test results

### 8.3 Verification of Results

All tests should pass with output similar to:

```
============================================================
VERIFICATION COMPLETE
Tests Passed: 6
Tests Failed: 0
============================================================
```

---

## Appendix A: Mathematical References

1. Lissajous, J. A. (1857). "Mémoire sur l'étude optique des mouvements vibratoires"
2. Bowditch, N. (1815). "On the motion of a pendulum suspended from two points"
3. Weisstein, E. W. "Lissajous Curve." MathWorld--A Wolfram Web Resource

## Appendix B: API Reference

See inline docstrings in `verify.py` for complete API documentation.

## Appendix C: Troubleshooting

### Common Issues

**Issue**: "ModuleNotFoundError: No module named 'numpy'"
**Solution**: Install dependencies: `pip install -r requirements.txt`

**Issue**: "Permission denied" when running script
**Solution**: Make executable: `chmod +x verify.py`

**Issue**: Tests failing due to numerical precision
**Solution**: Adjust tolerance parameters in validation functions

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run verification suite
5. Submit a pull request

---

## License

This project is part of the website-store repository.

---

**Last Updated**: 2025-10-15
**Version**: 1.0.0
