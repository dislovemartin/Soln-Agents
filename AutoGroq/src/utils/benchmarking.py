"""
Benchmarking utilities for AutoGroq performance analysis.
"""

import time
import json
import os
import datetime
from typing import Dict, Any, List, Optional, Callable, Union
import matplotlib.pyplot as plt
import numpy as np
from loguru import logger

class PerformanceBenchmark:
    """
    Tool for benchmarking and comparing different workflow configurations.
    """
    
    def __init__(
        self, 
        output_dir: str = "./benchmarks",
        save_charts: bool = True
    ):
        """
        Initialize the benchmark tool.
        
        Args:
            output_dir: Directory to save benchmark results
            save_charts: Whether to generate and save charts
        """
        self.output_dir = output_dir
        self.save_charts = save_charts
        self.results = {}
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
    
    def run_benchmark(
        self, 
        name: str,
        execution_func: Callable[[], Any],
        params: Dict[str, Any] = None,
        iterations: int = 1,
        warmup_iterations: int = 0
    ) -> Dict[str, Any]:
        """
        Run a benchmark and record the results.
        
        Args:
            name: Name of the benchmark
            execution_func: Function to execute for the benchmark
            params: Parameters used for this benchmark run
            iterations: Number of iterations to run
            warmup_iterations: Number of warmup iterations (not recorded)
            
        Returns:
            Benchmark results
        """
        logger.info(f"Running benchmark: {name}")
        logger.info(f"Parameters: {params}")
        
        # Perform warmup iterations
        if warmup_iterations > 0:
            logger.info(f"Running {warmup_iterations} warmup iterations...")
            for i in range(warmup_iterations):
                execution_func()
        
        # Run the actual benchmark
        execution_times = []
        memory_usages = []
        full_results = []
        
        for i in range(iterations):
            logger.info(f"Iteration {i+1}/{iterations}")
            start_time = time.time()
            result = execution_func()
            end_time = time.time()
            
            execution_time = end_time - start_time
            memory_usage = result.get("memory_usage", 0) if isinstance(result, dict) else 0
            
            execution_times.append(execution_time)
            memory_usages.append(memory_usage)
            full_results.append(result)
            
            logger.info(f"  Execution time: {execution_time:.4f} seconds")
            logger.info(f"  Memory usage: {memory_usage:.2f} MB")
        
        # Calculate statistics
        avg_execution_time = sum(execution_times) / len(execution_times)
        avg_memory_usage = sum(memory_usages) / len(memory_usages) if memory_usages else 0
        
        min_execution_time = min(execution_times)
        max_execution_time = max(execution_times)
        
        # Compile the benchmark results
        benchmark_result = {
            "name": name,
            "params": params or {},
            "iterations": iterations,
            "timestamp": datetime.datetime.now().isoformat(),
            "avg_execution_time": avg_execution_time,
            "min_execution_time": min_execution_time,
            "max_execution_time": max_execution_time,
            "avg_memory_usage": avg_memory_usage,
            "execution_times": execution_times,
            "memory_usages": memory_usages,
            "full_results": full_results
        }
        
        # Save the results
        self.results[name] = benchmark_result
        self._save_benchmark(benchmark_result)
        
        return benchmark_result
    
    def compare_benchmarks(
        self,
        benchmarks: List[str] = None,
        metrics: List[str] = None
    ) -> Dict[str, Any]:
        """
        Compare multiple benchmarks.
        
        Args:
            benchmarks: List of benchmark names to compare (if None, use all)
            metrics: List of metrics to compare (if None, use default set)
            
        Returns:
            Comparison results
        """
        if not benchmarks:
            benchmarks = list(self.results.keys())
        
        if not metrics:
            metrics = ["avg_execution_time", "avg_memory_usage"]
        
        comparison = {}
        
        for metric in metrics:
            comparison[metric] = {}
            for benchmark in benchmarks:
                if benchmark in self.results and metric in self.results[benchmark]:
                    comparison[metric][benchmark] = self.results[benchmark][metric]
        
        # Generate comparison charts
        if self.save_charts:
            self._generate_comparison_charts(comparison)
        
        return comparison
    
    def generate_report(self, output_file: Optional[str] = None) -> str:
        """
        Generate a comprehensive benchmark report.
        
        Args:
            output_file: File to save the report to (if None, use default)
            
        Returns:
            Path to the generated report
        """
        if not output_file:
            timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            output_file = os.path.join(self.output_dir, f"benchmark_report_{timestamp}.md")
        
        # Generate the report content
        report = "# AutoGroq Benchmark Report\n\n"
        report += f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        report += "## Summary\n\n"
        report += "| Benchmark | Execution Time (s) | Memory Usage (MB) |\n"
        report += "|-----------|-------------------|-------------------|\n"
        
        for name, result in self.results.items():
            report += f"| {name} | {result.get('avg_execution_time', 'N/A'):.4f} | {result.get('avg_memory_usage', 'N/A'):.2f} |\n"
        
        report += "\n## Detailed Results\n\n"
        
        for name, result in self.results.items():
            report += f"### {name}\n\n"
            report += f"- Parameters: {result.get('params', {})}\n"
            report += f"- Iterations: {result.get('iterations', 0)}\n"
            report += f"- Average Execution Time: {result.get('avg_execution_time', 'N/A'):.4f} seconds\n"
            report += f"- Min Execution Time: {result.get('min_execution_time', 'N/A'):.4f} seconds\n"
            report += f"- Max Execution Time: {result.get('max_execution_time', 'N/A'):.4f} seconds\n"
            report += f"- Average Memory Usage: {result.get('avg_memory_usage', 'N/A'):.2f} MB\n\n"
        
        # Write the report to the output file
        with open(output_file, "w") as f:
            f.write(report)
        
        return output_file
    
    def _save_benchmark(self, benchmark: Dict[str, Any]) -> None:
        """
        Save a benchmark result to a file.
        
        Args:
            benchmark: Benchmark result to save
        """
        name = benchmark["name"].replace(" ", "_").lower()
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = os.path.join(self.output_dir, f"{name}_{timestamp}.json")
        
        # Save the benchmark data
        with open(filename, "w") as f:
            json.dump(benchmark, f, indent=2)
        
        logger.info(f"Benchmark saved to {filename}")
        
        # Generate charts if enabled
        if self.save_charts:
            self._generate_charts(benchmark)
    
    def _generate_charts(self, benchmark: Dict[str, Any]) -> None:
        """
        Generate charts for a benchmark result.
        
        Args:
            benchmark: Benchmark result to generate charts for
        """
        name = benchmark["name"].replace(" ", "_").lower()
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        
        # Plot execution times
        if "execution_times" in benchmark:
            plt.figure(figsize=(10, 6))
            plt.plot(range(1, len(benchmark["execution_times"]) + 1), benchmark["execution_times"], 'b-', marker='o')
            plt.axhline(y=benchmark["avg_execution_time"], color='r', linestyle='--', label=f'Average: {benchmark["avg_execution_time"]:.4f}s')
            plt.title(f"Execution Times: {benchmark['name']}")
            plt.xlabel("Iteration")
            plt.ylabel("Time (seconds)")
            plt.grid(True)
            plt.legend()
            
            chart_file = os.path.join(self.output_dir, f"{name}_times_{timestamp}.png")
            plt.savefig(chart_file)
            plt.close()
            
            logger.info(f"Execution time chart saved to {chart_file}")
        
        # Plot memory usage
        if "memory_usages" in benchmark and any(benchmark["memory_usages"]):
            plt.figure(figsize=(10, 6))
            plt.plot(range(1, len(benchmark["memory_usages"]) + 1), benchmark["memory_usages"], 'g-', marker='o')
            plt.axhline(y=benchmark["avg_memory_usage"], color='r', linestyle='--', label=f'Average: {benchmark["avg_memory_usage"]:.2f}MB')
            plt.title(f"Memory Usage: {benchmark['name']}")
            plt.xlabel("Iteration")
            plt.ylabel("Memory (MB)")
            plt.grid(True)
            plt.legend()
            
            chart_file = os.path.join(self.output_dir, f"{name}_memory_{timestamp}.png")
            plt.savefig(chart_file)
            plt.close()
            
            logger.info(f"Memory usage chart saved to {chart_file}")
    
    def _generate_comparison_charts(self, comparison: Dict[str, Dict[str, Any]]) -> None:
        """
        Generate comparison charts.
        
        Args:
            comparison: Comparison data
        """
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        
        for metric, values in comparison.items():
            if not values:
                continue
                
            benchmarks = list(values.keys())
            metric_values = list(values.values())
            
            plt.figure(figsize=(12, 6))
            bars = plt.bar(benchmarks, metric_values)
            
            # Add value labels on top of bars
            for i, bar in enumerate(bars):
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height,
                         f'{metric_values[i]:.4f}',
                         ha='center', va='bottom', rotation=0)
            
            plt.title(f"Comparison: {metric}")
            plt.xlabel("Benchmark")
            plt.ylabel(metric)
            plt.xticks(rotation=45, ha='right')
            plt.tight_layout()
            plt.grid(axis='y')
            
            chart_file = os.path.join(self.output_dir, f"comparison_{metric}_{timestamp}.png")
            plt.savefig(chart_file)
            plt.close()
            
            logger.info(f"Comparison chart for {metric} saved to {chart_file}")


def run_execution_mode_comparison(
    create_workflow_func: Callable[[], Any],
    execute_func: Callable[[Any, str], Dict[str, Any]],
    output_dir: str = "./benchmarks/execution_modes",
    iterations: int = 3
) -> Dict[str, Any]:
    """
    Run a comparison of different execution modes (sequential, parallel, async).
    
    Args:
        create_workflow_func: Function that creates a workflow for testing
        execute_func: Function that executes the workflow with a given mode
        output_dir: Directory to save results
        iterations: Number of iterations per mode
        
    Returns:
        Comparison results
    """
    benchmark = PerformanceBenchmark(output_dir=output_dir)
    
    # Test each execution mode
    modes = ["sequential", "parallel", "async"]
    
    for mode in modes:
        logger.info(f"Benchmarking execution mode: {mode}")
        
        def execution_wrapper():
            workflow = create_workflow_func()
            return execute_func(workflow, mode)
        
        benchmark.run_benchmark(
            name=f"execution_mode_{mode}",
            execution_func=execution_wrapper,
            params={"execution_mode": mode},
            iterations=iterations
        )
    
    # Compare the results
    comparison = benchmark.compare_benchmarks()
    
    # Generate a comprehensive report
    report_path = benchmark.generate_report()
    logger.info(f"Benchmark report saved to {report_path}")
    
    return comparison