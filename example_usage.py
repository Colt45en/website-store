#!/usr/bin/env python3
"""
Example Usage of Lissajous Geometry System

This script demonstrates how to use the Lissajous geometry system
for generating and analyzing curves.
"""

import numpy as np
from verify import LissajousGeometry, ValidationMetrics


def example_1_basic_generation():
    """Example 1: Generate a simple Lissajous curve"""
    print("=" * 60)
    print("Example 1: Basic Lissajous Curve Generation")
    print("=" * 60)
    
    # Create a 3:2 frequency ratio Lissajous curve
    lissajous = LissajousGeometry(
        amplitude_x=1.0,
        amplitude_y=1.0,
        frequency_x=3.0,
        frequency_y=2.0,
        phase_shift=np.pi/2,
        num_points=1000
    )
    
    # Generate the curve
    x, y = lissajous.generate_curve()
    
    print(f"Generated curve with {len(x)} points")
    print(f"X range: [{x.min():.3f}, {x.max():.3f}]")
    print(f"Y range: [{y.min():.3f}, {y.max():.3f}]")
    print()


def example_2_calculate_metrics():
    """Example 2: Calculate curve metrics"""
    print("=" * 60)
    print("Example 2: Calculate Curve Metrics")
    print("=" * 60)
    
    lissajous = LissajousGeometry(
        amplitude_x=1.5,
        amplitude_y=1.0,
        frequency_x=5.0,
        frequency_y=4.0,
        phase_shift=0.0
    )
    
    x, y = lissajous.generate_curve()
    
    # Calculate various metrics
    arc_length = lissajous.calculate_arc_length(x, y)
    bbox = lissajous.calculate_bounding_box(x, y)
    symmetry = lissajous.calculate_symmetry_score(x, y)
    
    print(f"Arc Length: {arc_length:.2f} units")
    print(f"Bounding Box:")
    print(f"  X: [{bbox['x_min']:.3f}, {bbox['x_max']:.3f}]")
    print(f"  Y: [{bbox['y_min']:.3f}, {bbox['y_max']:.3f}]")
    print(f"Symmetry Score: {symmetry:.3f} (0=asymmetric, 1=perfectly symmetric)")
    print()


def example_3_validate_properties():
    """Example 3: Validate curve properties"""
    print("=" * 60)
    print("Example 3: Validate Curve Properties")
    print("=" * 60)
    
    lissajous = LissajousGeometry(
        amplitude_x=2.0,
        amplitude_y=1.5,
        frequency_x=3.0,
        frequency_y=2.0
    )
    
    x, y = lissajous.generate_curve()
    validator = ValidationMetrics()
    
    # Validate amplitude bounds
    amp_valid = validator.validate_amplitude_bounds(x, y, 2.0, 1.5)
    print(f"Amplitude validation: {'PASSED' if amp_valid else 'FAILED'}")
    
    # Validate smoothness
    smooth_valid = validator.validate_smoothness(x, y)
    print(f"Smoothness validation: {'PASSED' if smooth_valid else 'FAILED'}")
    
    # Validate periodicity
    period_valid = validator.validate_periodicity(x, y, 3.0, 2.0)
    print(f"Periodicity validation: {'PASSED' if period_valid else 'FAILED'}")
    print()


def example_4_compare_curves():
    """Example 4: Compare different frequency ratios"""
    print("=" * 60)
    print("Example 4: Compare Different Frequency Ratios")
    print("=" * 60)
    
    configs = [
        (1.0, 1.0, "1:1 (Circle)"),
        (3.0, 2.0, "3:2 (Classic)"),
        (5.0, 4.0, "5:4 (Complex)"),
        (7.0, 5.0, "7:5 (Very Complex)"),
    ]
    
    print(f"{'Ratio':<20} {'Arc Length':<15} {'Symmetry':<10}")
    print("-" * 45)
    
    for freq_x, freq_y, name in configs:
        lissajous = LissajousGeometry(
            frequency_x=freq_x,
            frequency_y=freq_y,
            phase_shift=np.pi/2
        )
        x, y = lissajous.generate_curve()
        arc_length = lissajous.calculate_arc_length(x, y)
        symmetry = lissajous.calculate_symmetry_score(x, y)
        
        print(f"{name:<20} {arc_length:<15.2f} {symmetry:<10.3f}")
    print()


def example_5_phase_shift_effect():
    """Example 5: Demonstrate phase shift effect"""
    print("=" * 60)
    print("Example 5: Phase Shift Effect")
    print("=" * 60)
    
    phases = [0, np.pi/4, np.pi/2, 3*np.pi/4, np.pi]
    
    print(f"{'Phase (radians)':<20} {'Phase (degrees)':<20} {'Symmetry':<10}")
    print("-" * 50)
    
    for phase in phases:
        lissajous = LissajousGeometry(
            frequency_x=3.0,
            frequency_y=2.0,
            phase_shift=phase
        )
        x, y = lissajous.generate_curve()
        symmetry = lissajous.calculate_symmetry_score(x, y)
        
        phase_deg = np.degrees(phase)
        print(f"{phase:<20.3f} {phase_deg:<20.1f} {symmetry:<10.3f}")
    print()


def example_6_custom_configuration():
    """Example 6: Create a custom Lissajous configuration"""
    print("=" * 60)
    print("Example 6: Custom Configuration")
    print("=" * 60)
    
    # Create an interesting custom configuration
    lissajous = LissajousGeometry(
        amplitude_x=2.5,
        amplitude_y=1.8,
        frequency_x=7.0,
        frequency_y=5.0,
        phase_shift=np.pi/3,
        num_points=2000
    )
    
    x, y = lissajous.generate_curve()
    
    print("Custom Lissajous Curve Configuration:")
    print(f"  Amplitude: ({lissajous.A}, {lissajous.B})")
    print(f"  Frequency: ({lissajous.a}, {lissajous.b})")
    print(f"  Phase: {lissajous.delta:.3f} rad ({np.degrees(lissajous.delta):.1f}°)")
    print(f"  Points: {lissajous.num_points}")
    print()
    
    arc_length = lissajous.calculate_arc_length(x, y)
    bbox = lissajous.calculate_bounding_box(x, y)
    symmetry = lissajous.calculate_symmetry_score(x, y)
    
    print("Calculated Properties:")
    print(f"  Arc Length: {arc_length:.2f}")
    print(f"  Width: {bbox['x_max'] - bbox['x_min']:.2f}")
    print(f"  Height: {bbox['y_max'] - bbox['y_min']:.2f}")
    print(f"  Symmetry: {symmetry:.3f}")
    print()


def main():
    """Run all examples"""
    print("\n")
    print("*" * 60)
    print("*" + " " * 58 + "*")
    print("*" + "  LISSAJOUS GEOMETRY SYSTEM - USAGE EXAMPLES".center(58) + "*")
    print("*" + " " * 58 + "*")
    print("*" * 60)
    print("\n")
    
    example_1_basic_generation()
    example_2_calculate_metrics()
    example_3_validate_properties()
    example_4_compare_curves()
    example_5_phase_shift_effect()
    example_6_custom_configuration()
    
    print("=" * 60)
    print("Examples completed successfully!")
    print("=" * 60)
    print()
    print("For more information, see:")
    print("  - LISSAJOUS_DOCUMENTATION.md for complete documentation")
    print("  - verify.py for the verification script")
    print("  - test_lissajous.py for unit tests")
    print()


if __name__ == "__main__":
    main()
