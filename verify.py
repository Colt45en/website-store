#!/usr/bin/env python3
"""
Verification Script for Lissajous Geometry System
==================================================

This script verifies the correctness of Lissajous curve generation,
validates mathematical formulations, and generates validation metrics.

Author: Automated System
Date: 2025-10-15
"""

import numpy as np
import csv
import os
import sys
from typing import Tuple, List, Dict
import json


class LissajousGeometry:
    """
    Lissajous Geometry System
    
    Generates Lissajous curves using parametric equations:
    x(t) = A * sin(a*t + δ)
    y(t) = B * sin(b*t)
    
    where:
    - A, B: amplitudes
    - a, b: frequency ratios
    - δ: phase shift
    - t: time parameter
    """
    
    def __init__(self, amplitude_x: float = 1.0, amplitude_y: float = 1.0,
                 frequency_x: float = 3.0, frequency_y: float = 2.0,
                 phase_shift: float = np.pi/2, num_points: int = 1000):
        """
        Initialize Lissajous curve parameters.
        
        Args:
            amplitude_x: Amplitude in x-direction
            amplitude_y: Amplitude in y-direction
            frequency_x: Frequency ratio in x-direction
            frequency_y: Frequency ratio in y-direction
            phase_shift: Phase shift (in radians)
            num_points: Number of points to generate
        """
        self.A = amplitude_x
        self.B = amplitude_y
        self.a = frequency_x
        self.b = frequency_y
        self.delta = phase_shift
        self.num_points = num_points
        self.t = np.linspace(0, 2 * np.pi, num_points)
        
    def generate_curve(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate Lissajous curve coordinates.
        
        Returns:
            Tuple of (x, y) numpy arrays
        """
        x = self.A * np.sin(self.a * self.t + self.delta)
        y = self.B * np.sin(self.b * self.t)
        return x, y
    
    def calculate_arc_length(self, x: np.ndarray, y: np.ndarray) -> float:
        """
        Calculate approximate arc length of the curve.
        
        Args:
            x: x-coordinates
            y: y-coordinates
            
        Returns:
            Approximate arc length
        """
        dx = np.diff(x)
        dy = np.diff(y)
        segments = np.sqrt(dx**2 + dy**2)
        return np.sum(segments)
    
    def calculate_bounding_box(self, x: np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """
        Calculate bounding box dimensions.
        
        Args:
            x: x-coordinates
            y: y-coordinates
            
        Returns:
            Dictionary with min/max x and y values
        """
        return {
            'x_min': float(np.min(x)),
            'x_max': float(np.max(x)),
            'y_min': float(np.min(y)),
            'y_max': float(np.max(y))
        }
    
    def calculate_symmetry_score(self, x: np.ndarray, y: np.ndarray) -> float:
        """
        Calculate symmetry score of the curve.
        
        Args:
            x: x-coordinates
            y: y-coordinates
            
        Returns:
            Symmetry score (0 to 1, where 1 is perfectly symmetric)
        """
        # Check x-axis symmetry
        x_symmetry = np.mean(np.abs(x + np.flip(x)))
        y_symmetry = np.mean(np.abs(y + np.flip(y)))
        
        # Normalize to 0-1 range
        max_deviation = max(np.max(np.abs(x)), np.max(np.abs(y)))
        if max_deviation > 0:
            symmetry = 1 - (x_symmetry + y_symmetry) / (4 * max_deviation)
        else:
            symmetry = 1.0
            
        return max(0.0, min(1.0, symmetry))


class ValidationMetrics:
    """
    Validation metrics for Lissajous geometry system.
    """
    
    @staticmethod
    def validate_amplitude_bounds(x: np.ndarray, y: np.ndarray, 
                                  expected_a: float, expected_b: float,
                                  tolerance: float = 0.01) -> bool:
        """
        Validate that generated curve respects amplitude bounds.
        
        Args:
            x: x-coordinates
            y: y-coordinates
            expected_a: Expected amplitude in x
            expected_b: Expected amplitude in y
            tolerance: Acceptable tolerance
            
        Returns:
            True if validation passes
        """
        actual_a = np.max(np.abs(x))
        actual_b = np.max(np.abs(y))
        
        x_valid = abs(actual_a - expected_a) <= tolerance
        y_valid = abs(actual_b - expected_b) <= tolerance
        
        return x_valid and y_valid
    
    @staticmethod
    def validate_periodicity(x: np.ndarray, y: np.ndarray, 
                           freq_x: float, freq_y: float,
                           tolerance: float = 0.1) -> bool:
        """
        Validate periodicity of the curve.
        
        Args:
            x: x-coordinates
            y: y-coordinates
            freq_x: Frequency in x direction
            freq_y: Frequency in y direction
            tolerance: Acceptable tolerance
            
        Returns:
            True if validation passes
        """
        # For Lissajous curves, if freq_x/freq_y is rational, curve is periodic
        # Check if first and last points are close (indicating closure)
        if len(x) < 2 or len(y) < 2:
            return False
            
        start_dist = np.sqrt((x[0] - x[-1])**2 + (y[0] - y[-1])**2)
        max_dist = max(np.max(np.abs(x)), np.max(np.abs(y)))
        
        if max_dist > 0:
            normalized_dist = start_dist / max_dist
            return normalized_dist <= tolerance
        
        return True
    
    @staticmethod
    def validate_smoothness(x: np.ndarray, y: np.ndarray,
                          max_curvature: float = 100.0) -> bool:
        """
        Validate smoothness of the curve (no sharp discontinuities).
        
        Args:
            x: x-coordinates
            y: y-coordinates
            max_curvature: Maximum acceptable curvature
            
        Returns:
            True if validation passes
        """
        if len(x) < 3 or len(y) < 3:
            return False
            
        # Calculate second derivatives (approximate curvature)
        dx = np.diff(x)
        dy = np.diff(y)
        ddx = np.diff(dx)
        ddy = np.diff(dy)
        
        # Check for reasonable curvature
        max_ddx = np.max(np.abs(ddx))
        max_ddy = np.max(np.abs(ddy))
        
        return max_ddx < max_curvature and max_ddy < max_curvature


def generate_csv_datasets(output_dir: str = "datasets"):
    """
    Generate CSV datasets for various Lissajous curve configurations.
    Section 6: Dataset Generation
    
    Args:
        output_dir: Directory to save CSV files
    """
    os.makedirs(output_dir, exist_ok=True)
    
    configurations = [
        # (amp_x, amp_y, freq_x, freq_y, phase, name)
        (1.0, 1.0, 1.0, 1.0, 0.0, "circle"),
        (1.0, 1.0, 1.0, 1.0, np.pi/2, "diagonal"),
        (1.0, 1.0, 3.0, 2.0, np.pi/2, "standard_3_2"),
        (1.0, 1.0, 5.0, 4.0, np.pi/2, "standard_5_4"),
        (1.5, 1.0, 3.0, 2.0, 0.0, "asymmetric_3_2"),
        (1.0, 1.0, 2.0, 3.0, np.pi/4, "inverted_2_3"),
    ]
    
    summary_data = []
    
    for amp_x, amp_y, freq_x, freq_y, phase, name in configurations:
        lissajous = LissajousGeometry(
            amplitude_x=amp_x,
            amplitude_y=amp_y,
            frequency_x=freq_x,
            frequency_y=freq_y,
            phase_shift=phase,
            num_points=1000
        )
        
        x, y = lissajous.generate_curve()
        
        # Save curve data
        csv_path = os.path.join(output_dir, f"lissajous_{name}.csv")
        with open(csv_path, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['t', 'x', 'y'])
            for i, (xi, yi) in enumerate(zip(x, y)):
                writer.writerow([lissajous.t[i], xi, yi])
        
        # Calculate metrics
        arc_length = lissajous.calculate_arc_length(x, y)
        bbox = lissajous.calculate_bounding_box(x, y)
        symmetry = lissajous.calculate_symmetry_score(x, y)
        
        summary_data.append({
            'name': name,
            'amplitude_x': amp_x,
            'amplitude_y': amp_y,
            'frequency_x': freq_x,
            'frequency_y': freq_y,
            'phase_shift': phase,
            'arc_length': arc_length,
            'x_min': bbox['x_min'],
            'x_max': bbox['x_max'],
            'y_min': bbox['y_min'],
            'y_max': bbox['y_max'],
            'symmetry_score': symmetry
        })
        
        print(f"Generated dataset: {name}")
    
    # Save summary CSV
    summary_path = os.path.join(output_dir, "summary.csv")
    with open(summary_path, 'w', newline='') as csvfile:
        fieldnames = summary_data[0].keys()
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(summary_data)
    
    print(f"\nAll datasets saved to {output_dir}/")
    print(f"Summary saved to {summary_path}")
    
    return summary_data


def run_verification_suite() -> Dict[str, any]:
    """
    Run comprehensive verification suite.
    
    Returns:
        Dictionary containing verification results
    """
    print("=" * 60)
    print("LISSAJOUS GEOMETRY VERIFICATION SUITE")
    print("=" * 60)
    print()
    
    results = {
        'tests_passed': 0,
        'tests_failed': 0,
        'test_details': []
    }
    
    # Test 1: Basic curve generation
    print("Test 1: Basic Curve Generation")
    try:
        lissajous = LissajousGeometry()
        x, y = lissajous.generate_curve()
        assert len(x) == 1000, "Expected 1000 points"
        assert len(y) == 1000, "Expected 1000 points"
        print("  ✓ PASSED: Generated 1000 points")
        results['tests_passed'] += 1
        results['test_details'].append({'test': 'Basic Generation', 'status': 'PASSED'})
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        results['tests_failed'] += 1
        results['test_details'].append({'test': 'Basic Generation', 'status': 'FAILED', 'error': str(e)})
    
    # Test 2: Amplitude validation
    print("\nTest 2: Amplitude Validation")
    try:
        lissajous = LissajousGeometry(amplitude_x=2.0, amplitude_y=1.5)
        x, y = lissajous.generate_curve()
        validator = ValidationMetrics()
        assert validator.validate_amplitude_bounds(x, y, 2.0, 1.5), "Amplitude bounds not respected"
        print("  ✓ PASSED: Amplitude bounds validated")
        results['tests_passed'] += 1
        results['test_details'].append({'test': 'Amplitude Validation', 'status': 'PASSED'})
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        results['tests_failed'] += 1
        results['test_details'].append({'test': 'Amplitude Validation', 'status': 'FAILED', 'error': str(e)})
    
    # Test 3: Smoothness validation
    print("\nTest 3: Curve Smoothness")
    try:
        lissajous = LissajousGeometry()
        x, y = lissajous.generate_curve()
        validator = ValidationMetrics()
        assert validator.validate_smoothness(x, y), "Curve not smooth"
        print("  ✓ PASSED: Curve is smooth")
        results['tests_passed'] += 1
        results['test_details'].append({'test': 'Smoothness Validation', 'status': 'PASSED'})
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        results['tests_failed'] += 1
        results['test_details'].append({'test': 'Smoothness Validation', 'status': 'FAILED', 'error': str(e)})
    
    # Test 4: Arc length calculation
    print("\nTest 4: Arc Length Calculation")
    try:
        lissajous = LissajousGeometry(frequency_x=1.0, frequency_y=1.0, phase_shift=0.0)
        x, y = lissajous.generate_curve()
        arc_length = lissajous.calculate_arc_length(x, y)
        # For a circle with radius 1, circumference ≈ 2π ≈ 6.28
        assert 5.0 < arc_length < 8.0, f"Unexpected arc length: {arc_length}"
        print(f"  ✓ PASSED: Arc length = {arc_length:.2f}")
        results['tests_passed'] += 1
        results['test_details'].append({'test': 'Arc Length', 'status': 'PASSED', 'value': arc_length})
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        results['tests_failed'] += 1
        results['test_details'].append({'test': 'Arc Length', 'status': 'FAILED', 'error': str(e)})
    
    # Test 5: Bounding box calculation
    print("\nTest 5: Bounding Box Calculation")
    try:
        lissajous = LissajousGeometry(amplitude_x=2.0, amplitude_y=1.5)
        x, y = lissajous.generate_curve()
        bbox = lissajous.calculate_bounding_box(x, y)
        assert abs(bbox['x_max']) <= 2.01, "X max out of bounds"
        assert abs(bbox['y_max']) <= 1.51, "Y max out of bounds"
        print(f"  ✓ PASSED: Bounding box calculated correctly")
        results['tests_passed'] += 1
        results['test_details'].append({'test': 'Bounding Box', 'status': 'PASSED'})
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        results['tests_failed'] += 1
        results['test_details'].append({'test': 'Bounding Box', 'status': 'FAILED', 'error': str(e)})
    
    # Test 6: Symmetry score
    print("\nTest 6: Symmetry Score Calculation")
    try:
        lissajous = LissajousGeometry()
        x, y = lissajous.generate_curve()
        symmetry = lissajous.calculate_symmetry_score(x, y)
        assert 0.0 <= symmetry <= 1.0, "Symmetry score out of range"
        print(f"  ✓ PASSED: Symmetry score = {symmetry:.3f}")
        results['tests_passed'] += 1
        results['test_details'].append({'test': 'Symmetry Score', 'status': 'PASSED', 'value': symmetry})
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        results['tests_failed'] += 1
        results['test_details'].append({'test': 'Symmetry Score', 'status': 'FAILED', 'error': str(e)})
    
    print("\n" + "=" * 60)
    print(f"VERIFICATION COMPLETE")
    print(f"Tests Passed: {results['tests_passed']}")
    print(f"Tests Failed: {results['tests_failed']}")
    print("=" * 60)
    
    return results


def main():
    """Main execution function."""
    print("Lissajous Geometry System - Verification Script\n")
    
    # Run verification suite
    results = run_verification_suite()
    
    print("\n" + "=" * 60)
    print("GENERATING CSV DATASETS (Section 6)")
    print("=" * 60)
    print()
    
    # Generate datasets
    summary_data = generate_csv_datasets()
    
    # Save verification results
    with open('verification_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\nVerification results saved to verification_results.json")
    
    # Exit with appropriate code
    if results['tests_failed'] > 0:
        print("\n⚠ Some tests failed. Please review the results.")
        return 1
    else:
        print("\n✓ All tests passed successfully!")
        return 0


if __name__ == "__main__":
    sys.exit(main())
