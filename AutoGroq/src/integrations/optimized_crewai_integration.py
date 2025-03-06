"""
Enhanced integration with CrewAI-Rust for high-performance agent execution with improved monitoring.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import asyncio
import time
import os
from loguru import logger
import psutil
import tracemalloc

try:
    import crewai_rust
    CREWAI_RUST_AVAILABLE = True
except ImportError:
    logger.warning("crewai-rust not available. Install it for better performance.")
    CREWAI_RUST_AVAILABLE = False


class PerformanceMetrics:
    """
    Class to track and store performance metrics for task execution.
    """
    
    def __init__(self):
        self.execution_times = {}
        self.memory_usage_samples = {}
        self.cpu_usage_samples = {}
        self.start_time = None
        self.total_execution_time = 0
        self.peak_memory_usage = 0
        self.average_cpu_usage = 0
    
    def start_monitoring(self):
        """Start performance monitoring."""
        self.start_time = time.time()
        tracemalloc.start()
        return self
    
    def stop_monitoring(self):
        """Stop performance monitoring and calculate final metrics."""
        if self.start_time:
            self.total_execution_time = time.time() - self.start_time
            current, peak = tracemalloc.get_traced_memory()
            self.peak_memory_usage = peak / 1024 / 1024  # Convert to MB
            
            # Calculate average CPU usage
            if self.cpu_usage_samples:
                self.average_cpu_usage = sum(self.cpu_usage_samples.values()) / len(self.cpu_usage_samples)
            
            tracemalloc.stop()
    
    def record_task_execution(self, task_id: int, execution_time: float):
        """Record the execution time for a specific task."""
        self.execution_times[task_id] = execution_time
    
    def sample_resource_usage(self, task_id: Optional[int] = None):
        """Take a sample of current resource usage."""
        # Memory usage
        current, peak = tracemalloc.get_traced_memory()
        current_mb = current / 1024 / 1024  # Convert to MB
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # Store the sample
        timestamp = time.time() - self.start_time if self.start_time else 0
        
        if task_id is not None:
            if task_id not in self.memory_usage_samples:
                self.memory_usage_samples[task_id] = []
            if task_id not in self.cpu_usage_samples:
                self.cpu_usage_samples[task_id] = []
                
            self.memory_usage_samples[task_id].append((timestamp, current_mb))
            self.cpu_usage_samples[task_id].append((timestamp, cpu_percent))
        else:
            # Global metrics
            if 'global' not in self.memory_usage_samples:
                self.memory_usage_samples['global'] = []
            if 'global' not in self.cpu_usage_samples:
                self.cpu_usage_samples['global'] = []
                
            self.memory_usage_samples['global'].append((timestamp, current_mb))
            self.cpu_usage_samples['global'].append((timestamp, cpu_percent))
    
    def get_report(self) -> Dict[str, Any]:
        """Get a comprehensive performance report."""
        return {
            'total_execution_time_seconds': self.total_execution_time,
            'peak_memory_usage_mb': self.peak_memory_usage,
            'average_cpu_usage_percent': self.average_cpu_usage,
            'task_execution_times': self.execution_times,
            'memory_usage_timeline': self.memory_usage_samples,
            'cpu_usage_timeline': self.cpu_usage_samples,
        }
    
    def log_summary(self):
        """Log a summary of the performance metrics."""
        logger.info(f"Performance Summary:")
        logger.info(f"  Total execution time: {self.total_execution_time:.2f} seconds")
        logger.info(f"  Peak memory usage: {self.peak_memory_usage:.2f} MB")
        logger.info(f"  Average CPU usage: {self.average_cpu_usage:.2f}%")
        
        if self.execution_times:
            logger.info("  Task execution times:")
            for task_id, exec_time in self.execution_times.items():
                logger.info(f"    Task {task_id}: {exec_time:.4f} seconds")


class OptimizedCrewAIIntegration:
    """
    Enhanced integration with CrewAI-Rust for high-performance workflow execution
    with improved performance monitoring and optimization.
    """

    def __init__(
        self, 
        execution_mode: str = "parallel",
        enable_performance_monitoring: bool = True,
        cache_dir: Optional[str] = None,
        task_batch_size: int = 5
    ):
        """
        Initialize the enhanced CrewAI-Rust integration.

        Args:
            execution_mode: Execution mode ('sequential', 'parallel', or 'async')
            enable_performance_monitoring: Whether to enable detailed performance monitoring
            cache_dir: Directory to use for caching task results
            task_batch_size: Maximum number of tasks to execute in a batch (for parallel mode)
        """
        if not CREWAI_RUST_AVAILABLE:
            raise ImportError(
                "crewai-rust is required for this integration. "
                "Install it with:\n"
                "cd crewai-rust/ && cargo build --release && "
                "cd crewai-pyo3/ && maturin build --release && "
                "pip install ./target/wheels/crewai_rust-*.whl"
            )
            
        self.execution_mode = execution_mode
        self.enable_performance_monitoring = enable_performance_monitoring
        self.performance_metrics = PerformanceMetrics() if enable_performance_monitoring else None
        self.task_batch_size = task_batch_size
        
        # Set up caching if enabled
        self.cache_dir = cache_dir
        if self.cache_dir and not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir, exist_ok=True)
            
        logger.info(f"Initialized enhanced CrewAI-Rust integration with mode: {execution_mode}")
        if enable_performance_monitoring:
            logger.info("Performance monitoring enabled")
        if cache_dir:
            logger.info(f"Caching enabled in: {cache_dir}")

    def create_agent(self, name: str, role: str, expertise: Optional[str] = None) -> Any:
        """
        Create a CrewAI-Rust agent.

        Args:
            name: Agent name
            role: Agent role
            expertise: Optional expertise

        Returns:
            CrewAI-Rust agent
        """
        return crewai_rust.Agent(name=name, role=role, expertise=expertise)

    def create_task(
        self, id: int, description: str, expected_output: str, agent_name: Optional[str] = None,
        priority: int = 1, dependencies: List[int] = None
    ) -> Any:
        """
        Create a CrewAI-Rust task with additional metadata for optimization.

        Args:
            id: Task ID
            description: Task description
            expected_output: Expected output
            agent_name: Optional agent name
            priority: Task priority (1-10, higher numbers = higher priority)
            dependencies: Optional list of task IDs that must complete before this one

        Returns:
            CrewAI-Rust task with enhanced metadata
        """
        # Create the task
        task = crewai_rust.Task(
            id=id,
            description=description,
            expected_output=expected_output,
            agent_name=agent_name,
        )
        
        # Store task metadata separately since Task is immutable
        # We'll use this metadata for optimization
        if not hasattr(self, '_task_metadata'):
            self._task_metadata = {}
            
        self._task_metadata[id] = {
            'priority': priority,
            'dependencies': dependencies or []
        }
        
        return task

    def create_crew(self, name: str) -> Any:
        """
        Create a CrewAI-Rust crew.

        Args:
            name: Crew name

        Returns:
            CrewAI-Rust crew
        """
        return crewai_rust.Crew(name=name, process=self.execution_mode)

    def execute_crew(
        self, 
        crew: Any, 
        tasks: List[Any], 
        agents: List[Any],
        monitor_interval: float = 0.5
    ) -> Dict[str, Any]:
        """
        Execute a crew with given tasks and agents, with enhanced monitoring and optimization.

        Args:
            crew: CrewAI-Rust crew
            tasks: List of tasks
            agents: List of agents
            monitor_interval: Interval in seconds for resource monitoring

        Returns:
            Execution results with detailed performance metrics
        """
        # Add agents and tasks to the crew
        for agent in agents:
            crew.add_agent(agent)
            
        # Sort tasks by priority and dependencies for optimization
        sorted_tasks = self._optimize_task_order(tasks)
        
        for task in sorted_tasks:
            crew.add_task(task)
        
        # Start performance monitoring if enabled
        if self.enable_performance_monitoring:
            self.performance_metrics.start_monitoring()
            
            # Start a background monitoring task if using async mode
            if self.execution_mode == "async":
                self._start_async_monitoring(monitor_interval)
        
        # Execute based on the selected mode
        start_time = time.time()
        execution_result = {}
        
        try:
            if self.execution_mode == "sequential":
                logger.info("Executing crew with sequential mode")
                sequential_benchmark = crew.benchmark_sequential_tasks()
                crew.execute_sequential()
                execution_result["sequential_benchmark"] = sequential_benchmark
                
            elif self.execution_mode == "parallel":
                logger.info("Executing crew with parallel mode")
                self._execute_parallel_optimized(crew, sorted_tasks)
                
            elif self.execution_mode == "async":
                logger.info("Executing crew with async mode")
                asyncio.run(crew.execute_async())
                
            else:
                logger.warning(f"Unknown execution mode: {self.execution_mode}. Defaulting to sequential.")
                crew.execute_sequential()
                
            # Get memory usage
            memory_usage = crew.get_memory_usage() if hasattr(crew, "get_memory_usage") else 0
            
            # Stop performance monitoring and get the report
            if self.enable_performance_monitoring:
                self.performance_metrics.stop_monitoring()
                self.performance_metrics.log_summary()
                performance_report = self.performance_metrics.get_report()
            else:
                performance_report = {
                    "total_execution_time_seconds": time.time() - start_time,
                    "memory_usage_mb": memory_usage / 1024 if memory_usage else 0
                }
            
            execution_result.update({
                "success": True,
                "execution_time": time.time() - start_time,
                "memory_usage": memory_usage / 1024 if memory_usage else 0,  # MB
                "performance": performance_report
            })
            
            return execution_result
            
        except Exception as e:
            logger.exception(f"Error executing crew: {str(e)}")
            
            # Stop performance monitoring even on error
            if self.enable_performance_monitoring:
                self.performance_metrics.stop_monitoring()
            
            return {
                "success": False,
                "error": str(e),
                "execution_time": time.time() - start_time
            }

    def load_from_yaml(self, yaml_path: str) -> Any:
        """
        Load a crew configuration from YAML.

        Args:
            yaml_path: Path to the YAML file

        Returns:
            CrewAI-Rust crew
        """
        return crewai_rust.Crew.load_from_yaml(yaml_path)

    def validate_yaml(self, yaml_content: str) -> bool:
        """
        Validate YAML content for crew configuration.

        Args:
            yaml_content: YAML content to validate

        Returns:
            True if valid, False otherwise
        """
        return crewai_rust.is_valid_yaml(yaml_content)
        
    def _optimize_task_order(self, tasks: List[Any]) -> List[Any]:
        """
        Optimize the order of tasks based on priority and dependencies.
        
        Args:
            tasks: List of tasks to optimize
            
        Returns:
            Sorted list of tasks
        """
        # Create a dictionary of tasks by ID for easy lookup
        task_dict = {task.id: task for task in tasks}
        
        # Get the task metadata (or use empty defaults)
        if not hasattr(self, '_task_metadata'):
            self._task_metadata = {}
            
        # Create a dependency graph
        dependency_graph = {
            task.id: self._task_metadata.get(task.id, {}).get('dependencies', []) 
            for task in tasks
        }
        
        # Calculate the "readiness" of each task (tasks with no dependencies are ready)
        ready_tasks = []
        waiting_tasks = []
        
        for task in tasks:
            deps = self._task_metadata.get(task.id, {}).get('dependencies', [])
            if not deps:
                ready_tasks.append(task)
            else:
                waiting_tasks.append(task)
        
        # Sort ready tasks by priority (higher priority first)
        ready_tasks.sort(
            key=lambda t: self._task_metadata.get(t.id, {}).get('priority', 1), 
            reverse=True
        )
        
        # Build the final sorted list
        sorted_tasks = []
        while ready_tasks:
            # Take the highest priority ready task
            current_task = ready_tasks.pop(0)
            sorted_tasks.append(current_task)
            
            # Check if any waiting tasks can now be moved to ready
            still_waiting = []
            for task in waiting_tasks:
                deps = self._task_metadata.get(task.id, {}).get('dependencies', [])
                if all(dep_id in [t.id for t in sorted_tasks] for dep_id in deps):
                    ready_tasks.append(task)
                else:
                    still_waiting.append(task)
            
            waiting_tasks = still_waiting
            
            # Re-sort ready tasks by priority
            ready_tasks.sort(
                key=lambda t: self._task_metadata.get(t.id, {}).get('priority', 1), 
                reverse=True
            )
        
        # If there are still waiting tasks, there might be a circular dependency
        # In that case, just add them at the end sorted by priority
        if waiting_tasks:
            logger.warning("Possible circular dependency detected in tasks. Adding remaining tasks at the end.")
            waiting_tasks.sort(
                key=lambda t: self._task_metadata.get(t.id, {}).get('priority', 1), 
                reverse=True
            )
            sorted_tasks.extend(waiting_tasks)
        
        return sorted_tasks
    
    def _execute_parallel_optimized(self, crew: Any, sorted_tasks: List[Any]):
        """
        Execute tasks in parallel using batching for better resource management.
        
        Args:
            crew: The CrewAI-Rust crew
            sorted_tasks: List of tasks sorted by priority and dependencies
        """
        logger.info(f"Executing {len(sorted_tasks)} tasks in optimized parallel mode with batch size {self.task_batch_size}")
        
        # Split tasks into batches
        current_batch = []
        for task in sorted_tasks:
            current_batch.append(task)
            
            if len(current_batch) >= self.task_batch_size:
                # Execute this batch
                logger.info(f"Executing batch of {len(current_batch)} tasks")
                self._execute_batch(crew, current_batch)
                current_batch = []
        
        # Execute any remaining tasks
        if current_batch:
            logger.info(f"Executing final batch of {len(current_batch)} tasks")
            self._execute_batch(crew, current_batch)
    
    def _execute_batch(self, crew: Any, batch: List[Any]):
        """
        Execute a batch of tasks in parallel.
        
        Args:
            crew: The CrewAI-Rust crew
            batch: List of tasks to execute
        """
        # Create a temporary crew just for this batch
        batch_name = f"batch_{int(time.time())}"
        batch_crew = crewai_rust.Crew(name=batch_name, process="parallel")
        
        # Create and add a default agent for each task
        # We'll create one agent per task type to handle different roles
        used_agent_names = set()
        
        for task in batch:
            if hasattr(task, 'agent_name') and task.agent_name:
                agent_name = task.agent_name
                if agent_name not in used_agent_names:
                    batch_crew.add_agent(
                        crewai_rust.Agent(
                            name=agent_name,
                            role=f"Process {agent_name} related tasks",
                            expertise="Task processing and analysis"
                        )
                    )
                    used_agent_names.add(agent_name)
            else:
                # Add a default agent if no agent is specified
                if "DefaultAgent" not in used_agent_names:
                    batch_crew.add_agent(
                        crewai_rust.Agent(
                            name="DefaultAgent",
                            role="Process general tasks",
                            expertise="General task processing"
                        )
                    )
                    used_agent_names.add("DefaultAgent")
                    
                # Assign this agent to the task
                task.agent_name = "DefaultAgent"
        
        # Add the batch tasks
        for task in batch:
            batch_crew.add_task(task)
        
        # Execute the batch
        start_time = time.time()
        batch_crew.execute_parallel_rayon()
        end_time = time.time()
        
        # Record performance metrics if enabled
        if self.enable_performance_monitoring:
            for task in batch:
                self.performance_metrics.record_task_execution(task.id, end_time - start_time)
                self.performance_metrics.sample_resource_usage(task.id)
    
    def _start_async_monitoring(self, interval: float):
        """
        Start an async task to monitor resource usage at regular intervals.
        
        Args:
            interval: Time between monitoring samples in seconds
        """
        async def monitor_resources():
            while True:
                if not self.enable_performance_monitoring:
                    break
                    
                self.performance_metrics.sample_resource_usage()
                await asyncio.sleep(interval)
        
        asyncio.create_task(monitor_resources())