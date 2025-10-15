#!/usr/bin/env python3
"""
Unit tests for Lissajous Geometry System

These tests provide additional coverage beyond the verification script.
Run with: python test_lissajous.py
"""

import numpy as np
import sys
import os

# Import from verify.py
from verify import LissajousGeometry, ValidationMetrics


def test_circle_generation():
    """Test that a circle is correctly generated with 1:1 frequency ratio."""
    print("Running: test_circle_generation")
    lissajous = LissajousGeometry(
        amplitude_x=1.0,
        amplitude_y=1.0,
        frequency_x=1.0,
        frequency_y=1.0,
        phase_shift=np.pi/2,
        num_points=1000
    )
    x, y = lissajous.generate_curve()
    
    # Check that points form approximately a circle (x² + y² ≈ 1)
    distances = np.sqrt(x**2 + y**2)
    avg_radius = np.mean(distances)
    std_radius = np.std(distances)
    
    assert 0.95 < avg_radius < 1.05, f"Circle radius not close to 1: {avg_radius}"
    assert std_radius < 0.1, f"Circle not uniform: std={std_radius}"
    print("  ✓ PASSED")


def test_diagonal_line():
    """Test that a diagonal line is generated with phase shift 0."""
    print("Running: test_diagonal_line")
    lissajous = LissajousGeometry(
        amplitude_x=1.0,
        amplitude_y=1.0,
        frequency_x=1.0,
        frequency_y=1.0,
        phase_shift=0.0,
        num_points=1000
    )
    x, y = lissajous.generate_curve()
    
    # For phase shift 0, x and y should be approximately equal
    correlation = np.corrcoef(x, y)[0, 1]
    assert abs(correlation) > 0.99, f"Not a diagonal line: correlation={correlation}"
    print("  ✓ PASSED")


def test_amplitude_scaling():
    """Test that amplitude parameters correctly scale the curve."""
    print("Running: test_amplitude_scaling")
    
    # Test with different amplitudes
    lissajous1 = LissajousGeometry(amplitude_x=1.0, amplitude_y=1.0)
    lissajous2 = LissajousGeometry(amplitude_x=2.0, amplitude_y=3.0)
    
    x1, y1 = lissajous1.generate_curve()
    x2, y2 = lissajous2.generate_curve()
    
    # Check max values
    assert abs(np.max(np.abs(x1)) - 1.0) < 0.01, "Amplitude X not correct for curve 1"
    assert abs(np.max(np.abs(y1)) - 1.0) < 0.01, "Amplitude Y not correct for curve 1"
    assert abs(np.max(np.abs(x2)) - 2.0) < 0.01, "Amplitude X not correct for curve 2"
    assert abs(np.max(np.abs(y2)) - 3.0) < 0.01, "Amplitude Y not correct for curve 2"
    print("  ✓ PASSED")


def test_point_count():
    """Test that the correct number of points is generated."""
    print("Running: test_point_count")
    
    for num_points in [100, 500, 2000]:
        lissajous = LissajousGeometry(num_points=num_points)
        x, y = lissajous.generate_curve()
        assert len(x) == num_points, f"Expected {num_points} points, got {len(x)}"
        assert len(y) == num_points, f"Expected {num_points} points, got {len(y)}"
    
    print("  ✓ PASSED")


def test_bounding_box_symmetry():
    """Test that bounding box respects symmetry."""
    print("Running: test_bounding_box_symmetry")
    
    lissajous = LissajousGeometry(amplitude_x=1.0, amplitude_y=1.0)
    x, y = lissajous.generate_curve()
    bbox = lissajous.calculate_bounding_box(x, y)
    
    # For symmetric curves, min and max should be approximately equal in magnitude
    x_symmetric = abs(abs(bbox['x_min']) - abs(bbox['x_max'])) < 0.1
    y_symmetric = abs(abs(bbox['y_min']) - abs(bbox['y_max'])) < 0.1
    
    assert x_symmetric, "X bounds not symmetric"
    assert y_symmetric, "Y bounds not symmetric"
    print("  ✓ PASSED")


def test_arc_length_positive():
    """Test that arc length is always positive."""
    print("Running: test_arc_length_positive")
    
    configs = [
        (1.0, 1.0, 1.0, 1.0, 0.0),
        (1.0, 1.0, 3.0, 2.0, np.pi/2),
        (2.0, 1.5, 5.0, 4.0, np.pi/4),
    ]
    
    for amp_x, amp_y, freq_x, freq_y, phase in configs:
        lissajous = LissajousGeometry(amp_x, amp_y, freq_x, freq_y, phase)
        x, y = lissajous.generate_curve()
        arc_length = lissajous.calculate_arc_length(x, y)
        assert arc_length > 0, f"Arc length not positive: {arc_length}"
    
    print("  ✓ PASSED")


def test_symmetry_score_range():
    """Test that symmetry score is in valid range [0, 1]."""
    print("Running: test_symmetry_score_range")
    
    lissajous = LissajousGeometry()
    x, y = lissajous.generate_curve()
    symmetry = lissajous.calculate_symmetry_score(x, y)
    
    assert 0.0 <= symmetry <= 1.0, f"Symmetry score out of range: {symmetry}"
    print("  ✓ PASSED")


def test_validation_metrics_amplitude():
    """Test amplitude bounds validation."""
    print("Running: test_validation_metrics_amplitude")
    
    validator = ValidationMetrics()
    
    # Test valid amplitudes
    lissajous = LissajousGeometry(amplitude_x=1.0, amplitude_y=1.0)
    x, y = lissajous.generate_curve()
    assert validator.validate_amplitude_bounds(x, y, 1.0, 1.0), "Valid amplitudes failed"
    
    # Test invalid amplitudes (should fail)
    assert not validator.validate_amplitude_bounds(x, y, 2.0, 2.0, tolerance=0.01), \
        "Invalid amplitudes passed"
    
    print("  ✓ PASSED")


def test_validation_metrics_smoothness():
    """Test smoothness validation."""
    print("Running: test_validation_metrics_smoothness")
    
    validator = ValidationMetrics()
    
    # Smooth curve should pass
    lissajous = LissajousGeometry(num_points=1000)
    x, y = lissajous.generate_curve()
    assert validator.validate_smoothness(x, y), "Smooth curve failed validation"
    
    # Discontinuous curve should fail
    x_discontinuous = np.array([0, 1, 2, 100, 4, 5])
    y_discontinuous = np.array([0, 1, 2, 100, 4, 5])
    assert not validator.validate_smoothness(x_discontinuous, y_discontinuous, max_curvature=10), \
        "Discontinuous curve passed validation"
    
    print("  ✓ PASSED")


def test_frequency_ratio_effect():
    """Test that frequency ratio affects curve complexity."""
    print("Running: test_frequency_ratio_effect")
    
    # Simple 1:1 ratio
    lissajous1 = LissajousGeometry(frequency_x=1.0, frequency_y=1.0)
    x1, y1 = lissajous1.generate_curve()
    arc1 = lissajous1.calculate_arc_length(x1, y1)
    
    # Complex 5:4 ratio
    lissajous2 = LissajousGeometry(frequency_x=5.0, frequency_y=4.0)
    x2, y2 = lissajous2.generate_curve()
    arc2 = lissajous2.calculate_arc_length(x2, y2)
    
    # Complex curve should have longer arc length
    assert arc2 > arc1, f"Complex curve not longer: {arc2} vs {arc1}"
    print("  ✓ PASSED")


def run_all_tests():
    """Run all unit tests."""
    print("=" * 60)
    print("LISSAJOUS GEOMETRY UNIT TESTS")
    print("=" * 60)
    print()
    
    tests = [
        test_circle_generation,
        test_diagonal_line,
        test_amplitude_scaling,
        test_point_count,
        test_bounding_box_symmetry,
        test_arc_length_positive,
        test_symmetry_score_range,
        test_validation_metrics_amplitude,
        test_validation_metrics_smoothness,
        test_frequency_ratio_effect,
    ]
    
    passed = 0
    failed = 0
    errors = []
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            failed += 1
            errors.append((test.__name__, str(e)))
            print(f"  ✗ FAILED: {e}")
        except Exception as e:
            failed += 1
            errors.append((test.__name__, f"Exception: {e}"))
            print(f"  ✗ ERROR: {e}")
    
    print()
    print("=" * 60)
    print(f"TEST RESULTS")
    print(f"Passed: {passed}/{len(tests)}")
    print(f"Failed: {failed}/{len(tests)}")
    print("=" * 60)
    
    if errors:
        print("\nFailed Tests:")
        for test_name, error in errors:
            print(f"  - {test_name}: {error}")
        return 1
    else:
        print("\n✓ All tests passed!")
        return 0


if __name__ == "__main__":
    sys.exit(run_all_tests())
