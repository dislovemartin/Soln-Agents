"""
Integration with CrewAI-Rust for high-performance agent execution.
"""

from typing import Any, Dict, List, Optional
import asyncio
from loguru import logger

try:
    import crewai_rust
    CREWAI_RUST_AVAILABLE = True
except ImportError:
    logger.warning("crewai-rust not available. Install it for better performance.")
    CREWAI_RUST_AVAILABLE = False


class CrewAIRustIntegration:
    """
    Integration with CrewAI-Rust for high-performance workflow execution.
    """

    def __init__(self, execution_mode: str = "parallel"):
        """
        Initialize the CrewAI-Rust integration.

        Args:
            execution_mode: Execution mode ('sequential', 'parallel', or 'async')
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
        logger.info(f"Initialized CrewAI-Rust integration with mode: {execution_mode}")

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
        priority: int = 5, dependencies: List[int] = None
    ) -> Any:
        """
        Create a CrewAI-Rust task.

        Args:
            id: Task ID
            description: Task description
            expected_output: Expected output
            agent_name: Optional agent name
            priority: Task priority (1-10)
            dependencies: List of task IDs this task depends on

        Returns:
            CrewAI-Rust task
        """
        task = crewai_rust.Task(
            id=id,
            description=description,
            expected_output=expected_output,
            agent_name=agent_name,
        )
        
        # Store additional metadata as attributes
        task.priority = priority
        task.dependencies = dependencies or []
        
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

    def execute_crew(self, crew: Any, tasks: List[Any], agents: List[Any]) -> Dict[str, Any]:
        """
        Execute a crew with given tasks and agents.

        Args:
            crew: CrewAI-Rust crew
            tasks: List of tasks
            agents: List of agents

        Returns:
            Execution results
        """
        # Add agents and tasks to the crew
        for agent in agents:
            crew.add_agent(agent)
            
        for task in tasks:
            crew.add_task(task)
        
        # Execute based on the selected mode
        start_time = 0
        try:
            if self.execution_mode == "sequential":
                logger.info("Executing crew with sequential mode")
                start_time = crew.benchmark_sequential_tasks()
                crew.execute_sequential()
            elif self.execution_mode == "parallel":
                logger.info("Executing crew with parallel mode")
                crew.execute_parallel_rayon()
            elif self.execution_mode == "async":
                logger.info("Executing crew with async mode")
                asyncio.run(crew.execute_async())
            else:
                logger.warning(f"Unknown execution mode: {self.execution_mode}. Defaulting to sequential.")
                crew.execute_sequential()
                
            memory_usage = crew.get_memory_usage()
            logger.info(f"Crew execution completed. Memory usage: {memory_usage / 1024:.2f} MB")
            
            return {
                "success": True,
                "execution_time": start_time,
                "memory_usage": memory_usage / 1024,  # MB
            }
            
        except Exception as e:
            logger.exception(f"Error executing crew: {str(e)}")
            return {
                "success": False,
                "error": str(e),
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
