#!/usr/bin/env python3
"""
Benchmark for Text Processing Node

This script benchmarks the performance of the text processing node,
comparing the Rust implementation against the Python fallback implementation.
"""

import sys
import os
import time
import json
from typing import Dict, Any, List

# Add nodes directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "nodes"))

# Import the text processing node
from text_processing_node import TextProcessingNode

# Sample text for benchmarking
SAMPLE_TEXT = """
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
"""

# Create a larger sample by repeating the text
LARGE_SAMPLE_TEXT = SAMPLE_TEXT * 100


def benchmark_operation(operation: str, use_rust: bool, iterations: int = 10) -> Dict[str, Any]:
    """Benchmark a specific text processing operation.
    
    Args:
        operation: The operation to benchmark
        use_rust: Whether to use Rust extensions
        iterations: Number of iterations for benchmarking
        
    Returns:
        Dict[str, Any]: Benchmark results
    """
    # Configure the node
    config = {
        "inputVariable": "input_text",
        "operations": [operation],
        "chunkSize": 1000,
        "useRustExtensions": use_rust,
        "resultVariable": "processed_text"
    }
    
    # Create node
    node = TextProcessingNode(config)
    
    # Sample variables
    variables = {
        "input_text": LARGE_SAMPLE_TEXT
    }
    
    # Measure execution time
    start_time = time.time()
    
    for _ in range(iterations):
        result_variables = node.process(variables)
    
    execution_time = time.time() - start_time
    
    return {
        "operation": operation,
        "implementation": "Rust" if use_rust else "Python",
        "iterations": iterations,
        "execution_time": execution_time,
        "avg_time_per_iteration": execution_time / iterations
    }


def run_benchmarks() -> List[Dict[str, Any]]:
    """Run benchmarks for various text processing operations.
    
    Returns:
        List[Dict[str, Any]]: Benchmark results
    """
    operations = ["count_tokens", "chunk", "lowercase", "uppercase", "trim", "remove_html", "extract_keywords"]
    results = []
    
    print("\n=== Text Processing Benchmark ===\n")
    print(f"Sample text size: {len(LARGE_SAMPLE_TEXT)} characters\n")
    
    for operation in operations:
        # Benchmark Python implementation
        python_result = benchmark_operation(operation, False)
        results.append(python_result)
        
        # Benchmark Rust implementation
        rust_result = benchmark_operation(operation, True)
        results.append(rust_result)
        
        # Calculate speedup
        speedup = python_result["execution_time"] / rust_result["execution_time"] if rust_result["execution_time"] > 0 else 0
        
        # Print results
        print(f"Operation: {operation}")
        print(f"  Python: {python_result['execution_time']:.6f}s ({python_result['avg_time_per_iteration']:.6f}s per iteration)")
        print(f"  Rust:   {rust_result['execution_time']:.6f}s ({rust_result['avg_time_per_iteration']:.6f}s per iteration)")
        print(f"  Speedup: {speedup:.2f}x\n")
    
    return results


def main():
    """Run the benchmark."""
    results = run_benchmarks()
    
    # Save results to file
    with open("text_processing_benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("Benchmark results saved to text_processing_benchmark_results.json")


if __name__ == "__main__":
    main()
