"""
Optimized workflow implementation with caching and resource management.
"""

from typing import Any, Dict, List, Optional, Tuple, Union, Callable
import os
import json
import time
import hashlib
import asyncio
from loguru import logger
import psutil
from functools import lru_cache

from langsmith.run_trees import RunTree
from langchain_core.messages import HumanMessage, AIMessage

from .base import BaseWorkflow, WorkflowResult, WorkflowStepResult
from ..integrations.optimized_crewai_integration import OptimizedCrewAIIntegration


class ResourceMonitor:
    """
    Monitor and manage system resources during workflow execution.
    """
    
    def __init__(
        self, 
        memory_threshold: float = 80.0,  # Percentage
        cpu_threshold: float = 90.0,     # Percentage
        check_interval: float = 1.0      # Seconds
    ):
        """
        Initialize the resource monitor.
        
        Args:
            memory_threshold: Memory usage threshold (percentage)
            cpu_threshold: CPU usage threshold (percentage)
            check_interval: Interval between resource checks (seconds)
        """
        self.memory_threshold = memory_threshold
        self.cpu_threshold = cpu_threshold
        self.check_interval = check_interval
        self.monitoring = False
        self.monitor_task = None
        
        # Stats
        self.peak_memory_usage = 0.0
        self.peak_cpu_usage = 0.0
        self.resource_samples = []
    
    async def start_monitoring(self):
        """Start resource monitoring."""
        self.monitoring = True
        self.monitor_task = asyncio.create_task(self._monitor_resources())
        logger.info(f"Resource monitoring started with thresholds: Memory={self.memory_threshold}%, CPU={self.cpu_threshold}%")
    
    async def stop_monitoring(self):
        """Stop resource monitoring."""
        self.monitoring = False
        if self.monitor_task:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass
        logger.info("Resource monitoring stopped")
    
    async def _monitor_resources(self):
        """Monitor system resources and take action if thresholds are exceeded."""
        while self.monitoring:
            try:
                # Check memory usage
                memory_percent = psutil.virtual_memory().percent
                cpu_percent = psutil.cpu_percent(interval=0.1)
                
                # Update peaks
                self.peak_memory_usage = max(self.peak_memory_usage, memory_percent)
                self.peak_cpu_usage = max(self.peak_cpu_usage, cpu_percent)
                
                # Store sample
                self.resource_samples.append({
                    "timestamp": time.time(),
                    "memory_percent": memory_percent,
                    "cpu_percent": cpu_percent
                })
                
                # Check against thresholds
                if memory_percent > self.memory_threshold:
                    logger.warning(f"Memory usage ({memory_percent:.1f}%) exceeds threshold ({self.memory_threshold:.1f}%)")
                    self._take_memory_action()
                    
                if cpu_percent > self.cpu_threshold:
                    logger.warning(f"CPU usage ({cpu_percent:.1f}%) exceeds threshold ({self.cpu_threshold:.1f}%)")
                    self._take_cpu_action()
                
            except Exception as e:
                logger.error(f"Error in resource monitoring: {str(e)}")
            
            await asyncio.sleep(self.check_interval)
    
    def _take_memory_action(self):
        """Take action when memory threshold is exceeded."""
        # Force garbage collection
        import gc
        gc.collect()
        
        # Clear any internal caches
        lru_cache.cache_clear()
    
    def _take_cpu_action(self):
        """Take action when CPU threshold is exceeded."""
        # Throttle processing for a brief period
        time.sleep(0.5)  # Sleep to allow CPU to cool down
    
    def get_resource_report(self) -> Dict[str, Any]:
        """Get a report of resource usage."""
        return {
            "peak_memory_usage_percent": self.peak_memory_usage,
            "peak_cpu_usage_percent": self.peak_cpu_usage,
            "current_memory_usage_percent": psutil.virtual_memory().percent,
            "current_cpu_usage_percent": psutil.cpu_percent(interval=0.1),
            "samples_count": len(self.resource_samples),
            "samples": self.resource_samples[-5:] if self.resource_samples else []  # Just the most recent samples
        }


class ResultCache:
    """
    Cache for workflow execution results to avoid redundant work.
    """
    
    def __init__(self, cache_dir: str = "./.cache/workflows"):
        """
        Initialize the result cache.
        
        Args:
            cache_dir: Directory to store cache files
        """
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        logger.info(f"Workflow result cache initialized at {cache_dir}")
    
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Get a cached result.
        
        Args:
            key: Cache key
            
        Returns:
            Cached result or None if not found
        """
        cache_file = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading cache: {str(e)}")
        return None
    
    def set(self, key: str, value: Dict[str, Any]) -> None:
        """
        Store a result in the cache.
        
        Args:
            key: Cache key
            value: Result to cache
        """
        cache_file = os.path.join(self.cache_dir, f"{key}.json")
        try:
            with open(cache_file, "w") as f:
                json.dump(value, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving to cache: {str(e)}")
    
    def generate_key(self, workflow_name: str, inputs: Dict[str, Any]) -> str:
        """
        Generate a cache key for a workflow execution.
        
        Args:
            workflow_name: Name of the workflow
            inputs: Input parameters
            
        Returns:
            Cache key
        """
        # Create a stable representation of the inputs
        input_str = json.dumps(inputs, sort_keys=True)
        hash_obj = hashlib.md5(input_str.encode())
        return f"{workflow_name}_{hash_obj.hexdigest()}"


class OptimizedWorkflow(BaseWorkflow):
    """
    Optimized workflow with advanced performance features.
    """
    
    def __init__(
        self,
        name: str,
        description: str = "",
        execution_mode: str = "parallel",
        use_caching: bool = True,
        enable_resource_monitoring: bool = True,
        cache_dir: Optional[str] = None,
        memory_threshold: float = 80.0,
        cpu_threshold: float = 90.0,
        task_batch_size: int = 5
    ):
        """
        Initialize the optimized workflow.
        
        Args:
            name: Name of the workflow
            description: Description of the workflow
            execution_mode: Execution mode (sequential, parallel, async)
            use_caching: Whether to cache workflow results
            enable_resource_monitoring: Whether to monitor system resources
            cache_dir: Directory for caching results
            memory_threshold: Memory usage threshold percentage
            cpu_threshold: CPU usage threshold percentage
            task_batch_size: Batch size for parallel task execution
        """
        super().__init__(name=name, description=description)
        
        self.execution_mode = execution_mode
        self.use_caching = use_caching
        self.enable_resource_monitoring = enable_resource_monitoring
        self.task_batch_size = task_batch_size
        
        # Set up caching
        if use_caching:
            if not cache_dir:
                cache_dir = os.path.join("./.cache", "workflow_" + name.replace(" ", "_").lower())
            self.cache = ResultCache(cache_dir=cache_dir)
        else:
            self.cache = None
        
        # Set up resource monitoring
        if enable_resource_monitoring:
            self.resource_monitor = ResourceMonitor(
                memory_threshold=memory_threshold,
                cpu_threshold=cpu_threshold
            )
        else:
            self.resource_monitor = None
        
        # Initialize the crewai integration
        try:
            self.crewai_integration = OptimizedCrewAIIntegration(
                execution_mode=execution_mode,
                enable_performance_monitoring=True,
                cache_dir=cache_dir,
                task_batch_size=task_batch_size
            )
            self.crewai_available = True
        except ImportError:
            logger.warning("CrewAI-Rust not available. Performance optimizations will be limited.")
            self.crewai_available = False
        
        logger.info(f"Initialized optimized workflow: {name}")
        logger.info(f"  Execution mode: {execution_mode}")
        logger.info(f"  Caching: {'Enabled' if use_caching else 'Disabled'}")
        logger.info(f"  Resource monitoring: {'Enabled' if enable_resource_monitoring else 'Disabled'}")
    
    async def execute_async(self, inputs: Dict[str, Any], run_tree: Optional[RunTree] = None) -> WorkflowResult:
        """
        Execute the workflow asynchronously.
        
        Args:
            inputs: Input parameters
            run_tree: Optional RunTree for tracing
            
        Returns:
            Workflow execution result
        """
        # Check cache first if enabled
        if self.use_caching and self.cache:
            cache_key = self.cache.generate_key(self.name, inputs)
            cached_result = self.cache.get(cache_key)
            
            if cached_result:
                logger.info(f"Using cached result for workflow: {self.name}")
                return WorkflowResult(**cached_result)
        
        # Start resource monitoring if enabled
        if self.enable_resource_monitoring and self.resource_monitor:
            await self.resource_monitor.start_monitoring()
        
        start_time = time.time()
        execution_metadata = {
            "started_at": start_time,
            "inputs": {k: v for k, v in inputs.items() if k != "api_key"},  # Don't log API keys
            "execution_mode": self.execution_mode
        }
        
        try:
            # Build the workflow - this should be implemented by subclasses
            workflow_components = await self.build_async()
            
            if run_tree:
                run_tree.trace({
                    "event": "workflow_built",
                    "workflow_name": self.name,
                    "execution_mode": self.execution_mode
                })
            
            # Implement the actual execution logic in _execute_components method
            steps, final_output = await self._execute_components_async(workflow_components, inputs, run_tree)
            
            # Create the result
            result = WorkflowResult(
                workflow_name=self.name,
                success=True,
                steps=steps,
                final_output=final_output,
                metadata={
                    **execution_metadata,
                    "execution_time": time.time() - start_time
                }
            )
            
            # Cache the result if caching is enabled
            if self.use_caching and self.cache:
                self.cache.set(cache_key, result.dict())
            
            return result
            
        except Exception as e:
            logger.exception(f"Error executing workflow: {str(e)}")
            return WorkflowResult(
                workflow_name=self.name,
                success=False,
                error=str(e),
                metadata={
                    **execution_metadata,
                    "execution_time": time.time() - start_time,
                    "error_type": type(e).__name__
                }
            )
        finally:
            # Stop resource monitoring
            if self.enable_resource_monitoring and self.resource_monitor:
                await self.resource_monitor.stop_monitoring()
                
                # Include resource usage in the trace
                if run_tree:
                    run_tree.trace({
                        "event": "resource_usage",
                        "data": self.resource_monitor.get_resource_report()
                    })
    
    def execute(self, inputs: Dict[str, Any], run_tree: Optional[RunTree] = None) -> WorkflowResult:
        """
        Execute the workflow synchronously.
        
        Args:
            inputs: Input parameters
            run_tree: Optional RunTree for tracing
            
        Returns:
            Workflow execution result
        """
        # For synchronous execution, we'll run the async version in an event loop
        return asyncio.run(self.execute_async(inputs, run_tree))
    
    async def build_async(self) -> Dict[str, Any]:
        """
        Build the workflow components asynchronously.
        This method should be implemented by subclasses.
        
        Returns:
            Dict of workflow components
        """
        raise NotImplementedError("Subclasses must implement build_async()")
    
    def build(self) -> Dict[str, Any]:
        """
        Build the workflow components synchronously.
        This method can be overridden by subclasses, but defaults to calling build_async.
        
        Returns:
            Dict of workflow components
        """
        return asyncio.run(self.build_async())
    
    async def _execute_components_async(
        self, 
        components: Dict[str, Any], 
        inputs: Dict[str, Any],
        run_tree: Optional[RunTree] = None
    ) -> Tuple[List[WorkflowStepResult], Any]:
        """
        Execute workflow components asynchronously.
        This method should be implemented by subclasses.
        
        Args:
            components: Workflow components from build_async
            inputs: Input parameters
            run_tree: Optional RunTree for tracing
            
        Returns:
            Tuple of (step results, final output)
        """
        raise NotImplementedError("Subclasses must implement _execute_components_async()")


class OptimizedTeamWorkflow(OptimizedWorkflow):
    """
    Optimized implementation of a team-based workflow using CrewAI-Rust for execution.
    """
    
    def __init__(
        self,
        task: str,
        team_size: int = 3,
        model: str = "qwen-2.5-32b",
        max_iterations: int = 10,
        execution_mode: str = "parallel",
        name: Optional[str] = None,
        description: Optional[str] = None,
        use_caching: bool = True,
        enable_resource_monitoring: bool = True,
        task_batch_size: int = 5
    ):
        """
        Initialize the optimized team workflow.
        
        Args:
            task: The main task to accomplish
            team_size: Number of agents in the team
            model: Model to use for agent interactions
            max_iterations: Maximum number of iterations
            execution_mode: Execution mode (sequential, parallel, async)
            name: Optional workflow name
            description: Optional workflow description
            use_caching: Whether to cache workflow results
            enable_resource_monitoring: Whether to monitor system resources
            task_batch_size: Batch size for parallel task execution
        """
        # Create a unique name based on task hash
        task_hash = abs(hash(task)) % 100000
        name = name or f"optimized-team-{task_hash}"
        description = description or f"Optimized team workflow for: {task}"
        
        super().__init__(
            name=name,
            description=description,
            execution_mode=execution_mode,
            use_caching=use_caching,
            enable_resource_monitoring=enable_resource_monitoring,
            task_batch_size=task_batch_size
        )
        
        self.task = task
        self.team_size = team_size
        self.model = model
        self.max_iterations = max_iterations
        
        logger.info(f"Created optimized team workflow for task: {task}")
        logger.info(f"  Team size: {team_size}")
        logger.info(f"  Model: {model}")
        logger.info(f"  Max iterations: {max_iterations}")
    
    async def build_async(self) -> Dict[str, Any]:
        """
        Build the workflow components asynchronously.
        
        Returns:
            Dict of workflow components
        """
        logger.info(f"Building optimized team workflow for task: {self.task}")
        
        # Define agent roles based on team size
        roles = self._get_team_roles(self.team_size)
        
        # Create agents
        agents = []
        for i, role in enumerate(roles):
            agent = self.crewai_integration.create_agent(
                name=f"Agent-{i+1}",
                role=role["title"],
                expertise=role["expertise"]
            )
            agents.append(agent)
        
        # Create tasks
        tasks = []
        for i, role in enumerate(roles):
            task = self.crewai_integration.create_task(
                id=i+1,
                description=f"{role['task_prefix']} {self.task}",
                expected_output=role["expected_output"],
                agent_name=f"Agent-{i+1}",
                priority=role["priority"],
                dependencies=role.get("dependencies", [])
            )
            tasks.append(task)
        
        # Create the crew
        crew = self.crewai_integration.create_crew(name=f"Team-{self.name}")
        
        return {
            "agents": agents,
            "tasks": tasks,
            "crew": crew,
            "roles": roles
        }
    
    async def _execute_components_async(
        self, 
        components: Dict[str, Any], 
        inputs: Dict[str, Any],
        run_tree: Optional[RunTree] = None
    ) -> Tuple[List[WorkflowStepResult], Any]:
        """
        Execute the team workflow asynchronously.
        
        Args:
            components: Workflow components from build_async
            inputs: Input parameters
            run_tree: Optional RunTree for tracing
            
        Returns:
            Tuple of (step results, final output)
        """
        logger.info(f"Executing optimized team workflow: {self.name}")
        
        # Extract components
        agents = components["agents"]
        tasks = components["tasks"]
        crew = components["crew"]
        roles = components["roles"]
        
        if run_tree:
            run_tree.trace({
                "event": "execution_start",
                "agents_count": len(agents),
                "tasks_count": len(tasks)
            })
        
        # Execute the crew
        monitor_interval = inputs.get("monitor_interval", 0.5)
        execution_result = self.crewai_integration.execute_crew(
            crew=crew,
            tasks=tasks,
            agents=agents,
            monitor_interval=monitor_interval
        )
        
        if run_tree:
            run_tree.trace({
                "event": "crew_execution_completed",
                "success": execution_result.get("success", False),
                "execution_time": execution_result.get("execution_time", 0),
                "memory_usage": execution_result.get("memory_usage", 0)
            })
        
        # Create step results
        steps = []
        for i, task in enumerate(tasks):
            success = execution_result.get("success", False)
            
            # Get execution time for this task if available
            task_execution_time = None
            if "performance" in execution_result and "task_execution_times" in execution_result["performance"]:
                task_execution_time = execution_result["performance"]["task_execution_times"].get(task.id, None)
            
            step_result = WorkflowStepResult(
                step_name=f"task_{task.id}_{roles[i]['title']}",
                success=success,
                output=f"Task {task.id} {'completed' if success else 'failed'}: {task.description}",
                error=None if success else "Task execution failed",
                metadata={
                    "task_id": task.id,
                    "agent": task.agent_name,
                    "execution_time": task_execution_time
                }
            )
            steps.append(step_result)
        
        # Create final output
        if execution_result.get("success", False):
            final_output = f"Team successfully executed the task: {self.task}\n\n"
            
            # Add performance summary if available
            if "performance" in execution_result:
                perf = execution_result["performance"]
                final_output += f"\nPerformance metrics:\n"
                final_output += f"- Total execution time: {perf.get('total_execution_time_seconds', 0):.2f} seconds\n"
                final_output += f"- Peak memory usage: {perf.get('peak_memory_usage_mb', 0):.2f} MB\n"
                if "average_cpu_usage_percent" in perf:
                    final_output += f"- Average CPU usage: {perf.get('average_cpu_usage_percent', 0):.2f}%\n"
        else:
            final_output = f"Team execution failed for task: {self.task}"
            if "error" in execution_result:
                final_output += f"\nError: {execution_result['error']}"
        
        return steps, final_output
    
    def _get_team_roles(self, team_size: int) -> List[Dict[str, Any]]:
        """
        Define roles for the team based on team size.
        
        Args:
            team_size: Number of team members
            
        Returns:
            List of role definitions
        """
        if team_size == 1:
            return [{
                "title": "Generalist",
                "expertise": "Problem solving across multiple domains",
                "task_prefix": "Analyze and complete the following task:",
                "expected_output": "Comprehensive solution",
                "priority": 5,
                "dependencies": []
            }]
        
        elif team_size == 2:
            return [
                {
                    "title": "Researcher",
                    "expertise": "Gathering and analyzing information",
                    "task_prefix": "Research and analyze information for:",
                    "expected_output": "Research findings",
                    "priority": 10,  # Highest priority, no dependencies
                    "dependencies": []
                },
                {
                    "title": "Synthesizer",
                    "expertise": "Organizing information and creating final outputs",
                    "task_prefix": "Synthesize findings to complete:",
                    "expected_output": "Final synthesis",
                    "priority": 5,
                    "dependencies": [1]  # Depends on Researcher (task ID 1)
                }
            ]
        
        elif team_size == 3:
            return [
                {
                    "title": "Researcher",
                    "expertise": "Gathering and analyzing information",
                    "task_prefix": "Research and analyze information for:",
                    "expected_output": "Research findings",
                    "priority": 10,
                    "dependencies": []
                },
                {
                    "title": "Analyst",
                    "expertise": "Identifying patterns and extracting insights",
                    "task_prefix": "Analyze the research findings for:",
                    "expected_output": "Analysis and insights",
                    "priority": 5,
                    "dependencies": [1]  # Depends on Researcher
                },
                {
                    "title": "Creator",
                    "expertise": "Creating final outputs and recommendations",
                    "task_prefix": "Create the final output for:",
                    "expected_output": "Final deliverable",
                    "priority": 1,
                    "dependencies": [2]  # Depends on Analyst
                }
            ]
        
        else:
            # For larger teams, define specialized roles with dependencies
            roles = [
                {
                    "title": "Research Lead",
                    "expertise": "Planning and coordinating research",
                    "task_prefix": "Plan and coordinate research for:",
                    "expected_output": "Research plan",
                    "priority": 10,
                    "dependencies": []
                },
                {
                    "title": "Data Collector",
                    "expertise": "Gathering and organizing information",
                    "task_prefix": "Collect and organize information for:",
                    "expected_output": "Collected data",
                    "priority": 8,
                    "dependencies": [1]  # Depends on Research Lead
                },
                {
                    "title": "Analyst",
                    "expertise": "Identifying patterns and extracting insights",
                    "task_prefix": "Analyze the collected data for:",
                    "expected_output": "Analysis and insights",
                    "priority": 6,
                    "dependencies": [2]  # Depends on Data Collector
                },
                {
                    "title": "Creator",
                    "expertise": "Creating final outputs and recommendations",
                    "task_prefix": "Create the final output for:",
                    "expected_output": "Final deliverable",
                    "priority": 4,
                    "dependencies": [3]  # Depends on Analyst
                }
            ]
            
            # Add additional specialized roles if team size is greater than 4
            additional_roles = [
                {
                    "title": "Domain Expert",
                    "expertise": "Providing specialized domain knowledge",
                    "task_prefix": "Provide domain expertise for:",
                    "expected_output": "Domain-specific insights",
                    "priority": 7,
                    "dependencies": [1]  # Depends on Research Lead
                },
                {
                    "title": "Quality Assurance",
                    "expertise": "Reviewing and validating outputs",
                    "task_prefix": "Review and validate the outputs for:",
                    "expected_output": "Validation report",
                    "priority": 2,
                    "dependencies": [4]  # Depends on Creator
                },
                {
                    "title": "Implementer",
                    "expertise": "Providing practical implementation steps",
                    "task_prefix": "Create implementation steps for:",
                    "expected_output": "Implementation plan",
                    "priority": 3,
                    "dependencies": [3, 5]  # Depends on Analyst and Domain Expert
                }
            ]
            
            # Add as many additional roles as needed to reach the team size
            for i in range(min(len(additional_roles), team_size - len(roles))):
                roles.append(additional_roles[i])
            
            return roles[:team_size]  # Limit to the requested team size