# website-store

## Overview
This repository contains:
1. A simple e-commerce website store with product listings and shopping cart functionality
2. **Lissajous Geometry System** - A scientific computing component for generating and validating Lissajous curves

## Project Structure
```
website-store/
├── index.html                    # Main HTML page
├── styles.css                    # CSS styling
├── app.js                        # JavaScript functionality
├── verify.py                     # Lissajous verification script
├── requirements.txt              # Python dependencies
├── LISSAJOUS_DOCUMENTATION.md    # Complete Lissajous system documentation
├── .github/workflows/verify.yml  # CI/CD workflow
├── .gitignore                    # Git ignore file
└── README.md                     # This file
```

## Website Features
- Responsive product grid
- Add to cart functionality
- Modern, clean design
- Ready for Visual Studio integration

## Lissajous Geometry System Features
- **Parametric curve generation** with customizable parameters
- **Mathematical validation** including amplitude, periodicity, and smoothness checks
- **Automated dataset generation** (Section 6) with 6 standard configurations
- **Comprehensive metrics**: arc length, bounding box, symmetry score
- **Continuous integration** via GitHub Actions
- **Complete documentation** with mathematical formulations and usage examples

## Setup Instructions

### Website Setup

#### For Visual Studio Users
1. Clone this repository
2. Open the folder in Visual Studio or Visual Studio Code
3. The `.gitignore` is already configured for Visual Studio projects
4. Make your changes and push them to the repository

#### Running Locally
1. Simply open `index.html` in a web browser
2. Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```
3. Navigate to `http://localhost:8000`

### Lissajous Geometry System Setup

#### Installation
```bash
# Clone the repository
git clone https://github.com/Colt45en/website-store.git
cd website-store

# Install Python dependencies
pip install -r requirements.txt
```

#### Running the Verification Script
```bash
# Run full verification suite
python verify.py

# This will:
# - Run 6 validation tests
# - Generate CSV datasets in the datasets/ directory
# - Create verification_results.json with test results
```

#### Expected Output
The script performs comprehensive validation:
- ✓ Basic curve generation (1000 points)
- ✓ Amplitude validation (bounds checking)
- ✓ Curve smoothness (continuity verification)
- ✓ Arc length calculation (geometric metrics)
- ✓ Bounding box calculation (spatial bounds)
- ✓ Symmetry score calculation (symmetry quantification)

Generated datasets (Section 6):
- `lissajous_circle.csv` - Perfect circle (1:1 frequency, 0° phase)
- `lissajous_diagonal.csv` - Diagonal line (1:1 frequency, 90° phase)
- `lissajous_standard_3_2.csv` - Classic 3:2 pattern
- `lissajous_standard_5_4.csv` - Complex 5:4 pattern
- `lissajous_asymmetric_3_2.csv` - Asymmetric variant
- `lissajous_inverted_2_3.csv` - Inverted frequency ratio
- `summary.csv` - Aggregate metrics for all curves

## Development

### Website Development
- Edit `index.html` to modify the page structure
- Edit `styles.css` to change the styling
- Edit `app.js` to add or modify functionality

### Lissajous System Development

#### Using the API
```python
from verify import LissajousGeometry, ValidationMetrics

# Create a Lissajous curve
lissajous = LissajousGeometry(
    amplitude_x=1.0,
    amplitude_y=1.0,
    frequency_x=3.0,
    frequency_y=2.0,
    phase_shift=np.pi/2
)

# Generate coordinates
x, y = lissajous.generate_curve()

# Calculate metrics
arc_length = lissajous.calculate_arc_length(x, y)
bbox = lissajous.calculate_bounding_box(x, y)
symmetry = lissajous.calculate_symmetry_score(x, y)

# Validate properties
validator = ValidationMetrics()
is_valid = validator.validate_amplitude_bounds(x, y, 1.0, 1.0)
```

#### Mathematical Formulation
Lissajous curves are defined by:
```
x(t) = A · sin(a·t + δ)
y(t) = B · sin(b·t)
```
See [LISSAJOUS_DOCUMENTATION.md](LISSAJOUS_DOCUMENTATION.md) for complete mathematical details.

## Push Notifications
This repository is watching for pushes from Visual Studio. Any changes you push will be automatically tracked and can be reviewed.

## Continuous Integration

The repository includes automated validation via GitHub Actions:
- Runs verification script on every push and pull request
- Validates all 6 test cases
- Generates and checks dataset files
- Archives results as downloadable artifacts

View workflow: [.github/workflows/verify.yml](.github/workflows/verify.yml)

## Documentation

For comprehensive documentation on the Lissajous Geometry System, see:
- [LISSAJOUS_DOCUMENTATION.md](LISSAJOUS_DOCUMENTATION.md) - Complete technical documentation including:
  - Mathematical formulations and derivations
  - System architecture and design
  - Validation metrics and methodologies
  - Usage instructions and examples
  - Dataset generation details (Section 6)
  - Reproducibility checklist
  - API reference

## Testing

The verification script includes 6 comprehensive tests:
1. **Basic Generation Test** - Validates correct point generation
2. **Amplitude Validation Test** - Ensures amplitude constraints
3. **Smoothness Test** - Verifies curve continuity
4. **Arc Length Test** - Validates geometric calculations
5. **Bounding Box Test** - Checks spatial bounds
6. **Symmetry Score Test** - Quantifies curve symmetry

All tests must pass for successful validation.

## Contributing
Feel free to push your changes from Visual Studio. The repository is configured to handle VS project files appropriately.

For Lissajous system contributions:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `python verify.py` to ensure all tests pass
5. Submit a pull request
