#!/usr/bin/env python3
"""
Performance benchmark for AutoGroq workflows.
"""

import os
import sys
import logging
import argparse
import time
from typing import Dict, Any, List, Optional
import matplotlib.pyplot as plt

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path to import AutoGroq modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import AutoGroq components
from src.core.manager import AutoGroqManager
from src.workflows.dynamic_team import DynamicTeamWorkflow
from src.workflows.optimized_workflow import OptimizedTeamWorkflow
from src.utils.benchmarking import PerformanceBenchmark, run_execution_mode_comparison
from src.integrations.optimized_crewai_integration import OptimizedCrewAIIntegration, CREWAI_RUST_AVAILABLE


def create_benchmark_task(task_complexity: str = "medium") -> str:
    """Create a benchmark task with the specified complexity."""
    if task_complexity == "simple":
        return "Summarize the key features of large language models."
    
    elif task_complexity == "medium":
        return "Research and summarize the key features of large language models and their applications in business."
    
    elif task_complexity == "complex":
        return "Research, analyze, and create a comprehensive report on the evolution of large language models, their key technical innovations, limitations, ethical considerations, and potential future developments in business applications."
    
    else:
        raise ValueError(f"Unknown task complexity: {task_complexity}")


def run_team_size_benchmark(
    api_key: str,
    model: str = "llama3-70b-8192",
    output_dir: str = "./benchmarks/team_size",
    team_sizes: List[int] = None,
    iterations: int = 2,
    task_complexity: str = "medium"
):
    """
    Benchmark performance with different team sizes.
    
    Args:
        api_key: Groq API key
        model: Model to use
        output_dir: Output directory for benchmark results
        team_sizes: List of team sizes to test
        iterations: Number of iterations per configuration
        task_complexity: Task complexity level
    """
    if not team_sizes:
        team_sizes = [1, 2, 3, 5]
    
    logger.info(f"Running team size benchmark with team sizes: {team_sizes}")
    logger.info(f"Task complexity: {task_complexity}")
    logger.info(f"Model: {model}")
    logger.info(f"Iterations per configuration: {iterations}")
    
    benchmark = PerformanceBenchmark(output_dir=output_dir)
    task = create_benchmark_task(task_complexity)
    
    # Initialize manager
    manager = AutoGroqManager(api_key=api_key, default_model=model)
    
    # Test each team size
    for team_size in team_sizes:
        logger.info(f"Benchmarking team size: {team_size}")
        
        # Standard workflow
        def standard_execution():
            workflow = DynamicTeamWorkflow(
                task=task,
                team_size=team_size,
                model=model,
                name=f"standard_team_{team_size}"
            )
            return manager.execute_workflow(workflow)
        
        benchmark.run_benchmark(
            name=f"standard_team_size_{team_size}",
            execution_func=standard_execution,
            params={"team_size": team_size, "model": model, "workflow_type": "standard"},
            iterations=iterations
        )
        
        # Optimized workflow (if CrewAI-Rust is available)
        if CREWAI_RUST_AVAILABLE:
            def optimized_execution():
                workflow = OptimizedTeamWorkflow(
                    task=task,
                    team_size=team_size,
                    model=model,
                    execution_mode="parallel",
                    name=f"optimized_team_{team_size}"
                )
                return manager.execute_workflow(workflow)
            
            benchmark.run_benchmark(
                name=f"optimized_team_size_{team_size}",
                execution_func=optimized_execution,
                params={"team_size": team_size, "model": model, "workflow_type": "optimized"},
                iterations=iterations
            )
    
    # Compare the results
    comparison = benchmark.compare_benchmarks()
    
    # Generate a comprehensive report
    report_path = benchmark.generate_report()
    logger.info(f"Team size benchmark report saved to {report_path}")
    
    return comparison


def run_execution_mode_benchmark(
    api_key: str,
    model: str = "llama3-70b-8192",
    output_dir: str = "./benchmarks/execution_modes",
    team_size: int = 3,
    iterations: int = 2,
    task_complexity: str = "medium"
):
    """
    Benchmark performance with different execution modes.
    
    Args:
        api_key: Groq API key
        model: Model to use
        output_dir: Output directory for benchmark results
        team_size: Team size to use
        iterations: Number of iterations per configuration
        task_complexity: Task complexity level
    """
    if not CREWAI_RUST_AVAILABLE:
        logger.error("CrewAI-Rust is not available. Cannot run execution mode benchmark.")
        return None
    
    logger.info(f"Running execution mode benchmark with team size: {team_size}")
    logger.info(f"Task complexity: {task_complexity}")
    logger.info(f"Model: {model}")
    logger.info(f"Iterations per configuration: {iterations}")
    
    task = create_benchmark_task(task_complexity)
    manager = AutoGroqManager(api_key=api_key, default_model=model)
    
    # Define workflow creation function
    def create_workflow():
        return OptimizedTeamWorkflow(
            task=task,
            team_size=team_size,
            model=model,
            name=f"execution_mode_benchmark"
        )
    
    # Define execution function
    def execute_workflow(workflow, mode):
        workflow.execution_mode = mode
        return manager.execute_workflow(workflow)
    
    # Run the comparison
    comparison = run_execution_mode_comparison(
        create_workflow_func=create_workflow,
        execute_func=execute_workflow,
        output_dir=output_dir,
        iterations=iterations
    )
    
    return comparison


def run_task_complexity_benchmark(
    api_key: str,
    model: str = "llama3-70b-8192",
    output_dir: str = "./benchmarks/task_complexity",
    team_size: int = 3,
    iterations: int = 2,
    execution_mode: str = "parallel"
):
    """
    Benchmark performance with different task complexities.
    
    Args:
        api_key: Groq API key
        model: Model to use
        output_dir: Output directory for benchmark results
        team_size: Team size to use
        iterations: Number of iterations per configuration
        execution_mode: Execution mode to use
    """
    logger.info(f"Running task complexity benchmark with team size: {team_size}")
    logger.info(f"Model: {model}")
    logger.info(f"Execution mode: {execution_mode}")
    logger.info(f"Iterations per configuration: {iterations}")
    
    benchmark = PerformanceBenchmark(output_dir=output_dir)
    manager = AutoGroqManager(api_key=api_key, default_model=model)
    
    # Test each complexity level
    complexities = ["simple", "medium", "complex"]
    workflow_types = ["standard"]
    
    if CREWAI_RUST_AVAILABLE:
        workflow_types.append("optimized")
    
    for complexity in complexities:
        task = create_benchmark_task(complexity)
        
        for workflow_type in workflow_types:
            logger.info(f"Benchmarking task complexity: {complexity}, workflow type: {workflow_type}")
            
            def execution_func():
                if workflow_type == "standard":
                    workflow = DynamicTeamWorkflow(
                        task=task,
                        team_size=team_size,
                        model=model,
                        name=f"standard_{complexity}"
                    )
                else:  # optimized
                    workflow = OptimizedTeamWorkflow(
                        task=task,
                        team_size=team_size,
                        model=model,
                        execution_mode=execution_mode,
                        name=f"optimized_{complexity}"
                    )
                
                return manager.execute_workflow(workflow)
            
            benchmark.run_benchmark(
                name=f"{workflow_type}_{complexity}",
                execution_func=execution_func,
                params={
                    "complexity": complexity,
                    "team_size": team_size,
                    "model": model,
                    "workflow_type": workflow_type,
                    "execution_mode": execution_mode
                },
                iterations=iterations
            )
    
    # Compare the results
    comparison = benchmark.compare_benchmarks()
    
    # Generate a comprehensive report
    report_path = benchmark.generate_report()
    logger.info(f"Task complexity benchmark report saved to {report_path}")
    
    return comparison


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="AutoGroq Performance Benchmarks")
    
    parser.add_argument("--benchmark", choices=["team-size", "execution-mode", "task-complexity", "all"],
                        default="all", help="Benchmark type to run")
    
    parser.add_argument("--api-key", type=str, help="Groq API key")
    
    parser.add_argument("--model", type=str, default="llama3-70b-8192",
                        help="Model to use for benchmarks")
    
    parser.add_argument("--team-size", type=int, default=3,
                        help="Team size for execution mode and task complexity benchmarks")
    
    parser.add_argument("--iterations", type=int, default=2,
                        help="Number of iterations per configuration")
    
    parser.add_argument("--output-dir", type=str, default="./benchmarks",
                        help="Output directory for benchmark results")
    
    return parser.parse_args()


def main():
    """Main function to run the benchmarks."""
    args = parse_arguments()
    
    # Get API key from arguments or environment
    api_key = args.api_key or os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.error("No Groq API key provided. Set it via --api-key or GROQ_API_KEY environment variable.")
        sys.exit(1)
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Determine which benchmarks to run
    benchmarks_to_run = []
    if args.benchmark == "all":
        benchmarks_to_run = ["team-size", "execution-mode", "task-complexity"]
    else:
        benchmarks_to_run = [args.benchmark]
    
    # Run the selected benchmarks
    for benchmark in benchmarks_to_run:
        logger.info(f"Running benchmark: {benchmark}")
        
        if benchmark == "team-size":
            run_team_size_benchmark(
                api_key=api_key,
                model=args.model,
                output_dir=os.path.join(args.output_dir, "team_size"),
                iterations=args.iterations
            )
        
        elif benchmark == "execution-mode":
            run_execution_mode_benchmark(
                api_key=api_key,
                model=args.model,
                output_dir=os.path.join(args.output_dir, "execution_modes"),
                team_size=args.team_size,
                iterations=args.iterations
            )
        
        elif benchmark == "task-complexity":
            run_task_complexity_benchmark(
                api_key=api_key,
                model=args.model,
                output_dir=os.path.join(args.output_dir, "task_complexity"),
                team_size=args.team_size,
                iterations=args.iterations
            )
    
    logger.info("All benchmarks completed successfully.")


if __name__ == "__main__":
    main()