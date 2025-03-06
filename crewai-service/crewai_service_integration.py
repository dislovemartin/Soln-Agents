import os
import requests
import logging
from typing import Dict, List, Any, Optional, Union
import time
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# URL for the CrewAI service
CREWAI_SERVICE_URL = os.environ.get("CREWAI_SERVICE_URL", "http://localhost:8000")

class CrewAIServiceIntegration:
    """
    Integration with CrewAI service for workflow execution.
    """
    
    def __init__(
        self, 
        execution_mode: str = "parallel",
        enable_performance_monitoring: bool = True,
        task_batch_size: int = 5,
        service_url: Optional[str] = None,
        llm_config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the CrewAI service integration.
        
        Args:
            execution_mode: Execution mode ("sequential" or "parallel")
            enable_performance_monitoring: Whether to track performance metrics
            task_batch_size: Number of tasks to execute in parallel
            service_url: Custom service URL (overrides environment variable)
            llm_config: Default LLM configuration for all requests
        """
        self.execution_mode = execution_mode
        self.enable_performance_monitoring = enable_performance_monitoring
        self.task_batch_size = task_batch_size
        self.service_url = service_url or CREWAI_SERVICE_URL
        self.llm_config = llm_config or {}
        
        # Check if service is available
        try:
            response = requests.get(f"{self.service_url}/")
            if response.status_code == 200:
                logger.info(f"Connected to CrewAI service at {self.service_url}")
            else:
                logger.warning(f"CrewAI service returned status {response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"Could not connect to CrewAI service: {str(e)}")
    
    def create_agent(
        self, 
        name: str, 
        role: str, 
        goal: Optional[str] = None,
        expertise: Optional[str] = None,
        backstory: Optional[str] = None,
        llm_config: Optional[Dict[str, Any]] = None,
        tools: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a CrewAI agent configuration.
        
        Args:
            name: Agent name
            role: Agent role description
            goal: Agent's primary goal
            expertise: Optional expertise area
            backstory: Agent's backstory
            llm_config: Custom LLM configuration for this agent
            tools: List of tool names this agent can use
            
        Returns:
            Agent configuration dictionary
        """
        return {
            "name": name,
            "role": role,
            "goal": goal,
            "expertise": expertise,
            "backstory": backstory,
            "llm_config": llm_config,
            "tools": tools or []
        }
    
    def create_task(
        self, 
        id: int, 
        description: str, 
        expected_output: str, 
        agent_name: Optional[str] = None,
        priority: int = 5, 
        dependencies: Optional[List[int]] = None,
        context: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Create a CrewAI task configuration.
        
        Args:
            id: Task ID
            description: Task description
            expected_output: Expected output format
            agent_name: Name of the agent to assign
            priority: Task priority (1-10)
            dependencies: List of task IDs this task depends on
            context: Additional context information for the task
            
        Returns:
            Task configuration dictionary
        """
        task = {
            "id": id,
            "description": description,
            "expected_output": expected_output,
            "agent_name": agent_name,
            "priority": priority,
            "dependencies": dependencies or [],
            "context": context or []
        }
        return task
    
    def execute_crew(
        self, 
        crew_name: str,
        agents: List[Dict[str, Any]], 
        tasks: List[Dict[str, Any]],
        llm_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a crew workflow through the service.
        
        Args:
            crew_name: Name for the crew
            agents: List of agent configurations
            tasks: List of task configurations
            llm_config: Custom LLM configuration for this workflow
            
        Returns:
            Execution results
        """
        logger.info(f"Executing crew {crew_name} with {len(agents)} agents and {len(tasks)} tasks")
        
        if len(agents) == 0 or len(tasks) == 0:
            logger.warning("No agents or tasks provided")
            return {
                "success": False,
                "error": "No agents or tasks provided"
            }
        
        # Use provided llm_config or fall back to default
        config = llm_config or self.llm_config
        
        # Prepare the request payload
        payload = {
            "name": crew_name,
            "agents": agents,
            "tasks": tasks,
            "execution_mode": self.execution_mode,
            "llm_config": config
        }
        
        # Execute batches if needed
        if len(tasks) > self.task_batch_size and self.execution_mode == "parallel":
            return self._execute_in_batches(crew_name, agents, tasks, config)
        
        # Execute the workflow
        try:
            logger.info(f"Sending request to {self.service_url}/execute_crew")
            response = requests.post(
                f"{self.service_url}/execute_crew",
                json=payload,
                timeout=600  # 10 minute timeout for long-running workflows
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Crew execution completed in {result.get('execution_time', 0):.2f} seconds")
                return result
            else:
                error_msg = f"Error executing crew: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    "success": False,
                    "error": error_msg
                }
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Error connecting to CrewAI service: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }
    
    def _execute_in_batches(
        self, 
        crew_name: str,
        agents: List[Dict[str, Any]], 
        tasks: List[Dict[str, Any]],
        llm_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute tasks in batches for better resource management.
        
        Args:
            crew_name: Name for the crew
            agents: List of agent configurations
            tasks: List of task configurations
            llm_config: Custom LLM configuration for this workflow
            
        Returns:
            Combined execution results
        """
        logger.info(f"Executing {len(tasks)} tasks in batches of {self.task_batch_size}")
        
        # Split tasks into batches
        batches = []
        current_batch = []
        
        for task in tasks:
            current_batch.append(task)
            
            if len(current_batch) >= self.task_batch_size:
                batches.append(current_batch)
                current_batch = []
        
        # Add any remaining tasks
        if current_batch:
            batches.append(current_batch)
        
        # Execute each batch
        batch_results = []
        overall_start_time = time.time()
        
        for i, batch in enumerate(batches):
            logger.info(f"Executing batch {i+1}/{len(batches)} with {len(batch)} tasks")
            
            batch_result = self.execute_crew(
                crew_name=f"{crew_name}_batch_{i+1}",
                agents=agents,
                tasks=batch,
                llm_config=llm_config
            )
            
            batch_results.append(batch_result)
        
        overall_execution_time = time.time() - overall_start_time
        
        # Combine results
        combined_result = {
            "success": all(result.get("success", False) for result in batch_results),
            "execution_time": overall_execution_time,
            "batch_results": batch_results,
            "batch_count": len(batches)
        }
        
        return combined_result

