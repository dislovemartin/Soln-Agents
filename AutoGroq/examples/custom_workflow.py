#!/usr/bin/env python3
"""
Example of creating a custom workflow for AutoGroq
"""

import os
import sys
import logging
from typing import Dict, Any, Optional

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path to import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import AutoGroq components
from src.workflows.base import BaseWorkflow, WorkflowResult, WorkflowStepResult
from src.integrations.crewai_rust_integration import CrewAIRustIntegration, CREWAI_RUST_AVAILABLE
from langsmith.run_trees import RunTree

class CrewAIRustCustomWorkflow(BaseWorkflow):
    """
    Custom workflow that leverages CrewAI-Rust for high-performance execution.
    This workflow demonstrates how to create a specialized workflow that uses
    CrewAI-Rust for parallel agent execution.
    """
    
    def __init__(
        self,
        task: str,
        execution_mode: str = "parallel",
        name: str = None,
        description: str = None
    ):
        """
        Initialize the custom CrewAI-Rust workflow.
        
        Args:
            task: The main task to accomplish
            execution_mode: Execution mode for CrewAI-Rust ("sequential", "parallel", "async")
            name: Optional name for the workflow
            description: Optional description
        """
        name = name or f"crewai-rust-workflow-{task[:20].replace(' ', '-')}"
        description = description or f"CrewAI-Rust workflow for: {task}"
        super().__init__(name=name, description=description)
        
        self.task = task
        self.execution_mode = execution_mode
        
        # Check if CrewAI-Rust is available
        if not CREWAI_RUST_AVAILABLE:
            raise ImportError(
                "CrewAI-Rust is required for this workflow. "
                "Install it with the instructions in the README."
            )
        
        # Initialize the CrewAI-Rust integration
        self.crewai_integration = CrewAIRustIntegration(execution_mode=execution_mode)
        logger.info(f"Initialized custom CrewAI-Rust workflow with mode: {execution_mode}")

    def build(self):
        """
        Build the workflow components.
        
        Returns:
            The constructed crew
        """
        logger.info(f"Building CrewAI-Rust workflow for task: {self.task}")
        
        # Create a crew
        crew = self.crewai_integration.create_crew(name=f"Crew-{self.name}")
        
        # Create the specialized agents
        researcher = self.crewai_integration.create_agent(
            name="DataResearcher",
            role="Research Specialist",
            expertise="Finding and analyzing information quickly and accurately"
        )
        
        analyst = self.crewai_integration.create_agent(
            name="DataAnalyst",
            role="Data Analyst",
            expertise="Analyzing data and extracting insights"
        )
        
        writer = self.crewai_integration.create_agent(
            name="ContentWriter",
            role="Content Creator",
            expertise="Creating well-structured content from research and analysis"
        )
        
        # Create the tasks for each agent
        research_task = self.crewai_integration.create_task(
            id=1,
            description=f"Research thoroughly on: {self.task}",
            expected_output="Comprehensive research notes with key information",
            agent_name="DataResearcher"
        )
        
        analysis_task = self.crewai_integration.create_task(
            id=2,
            description=f"Analyze the research findings for: {self.task}",
            expected_output="Analysis report with key insights and patterns",
            agent_name="DataAnalyst"
        )
        
        content_task = self.crewai_integration.create_task(
            id=3,
            description=f"Create a final report on: {self.task}",
            expected_output="Well-structured final report with insights and recommendations",
            agent_name="ContentWriter"
        )
        
        # Return the objects needed for execution
        return {
            "crew": crew,
            "agents": [researcher, analyst, writer],
            "tasks": [research_task, analysis_task, content_task]
        }
    
    def execute(self, inputs: Dict[str, Any], run_tree: Optional[RunTree] = None) -> WorkflowResult:
        """
        Execute the workflow.
        
        Args:
            inputs: Input parameters for the workflow
            run_tree: Optional RunTree for tracing
            
        Returns:
            WorkflowResult containing the execution results
        """
        logger.info(f"Executing CrewAI-Rust workflow: {self.name}")
        
        try:
            # Build the workflow components
            components = self.build()
            crew = components["crew"]
            agents = components["agents"]
            tasks = components["tasks"]
            
            # Update task descriptions with any input parameters
            if "additional_context" in inputs:
                for task in tasks:
                    task.description += f"\nAdditional context: {inputs['additional_context']}"
            
            # Create step results for tracking
            steps = []
            
            # Log the start of execution
            if run_tree:
                run_tree.trace({"message": f"Starting CrewAI-Rust workflow execution with mode: {self.execution_mode}"})
            
            # Execute the crew
            logger.info(f"Executing CrewAI-Rust crew with {len(tasks)} tasks and {len(agents)} agents")
            execution_result = self.crewai_integration.execute_crew(
                crew=crew,
                tasks=tasks,
                agents=agents
            )
            
            # Check if execution was successful
            if execution_result.get("success", False):
                logger.info("CrewAI-Rust execution completed successfully")
                execution_time = execution_result.get("execution_time", 0)
                memory_usage = execution_result.get("memory_usage", 0)
                
                # Add steps for each task
                for i, task in enumerate(tasks):
                    steps.append(
                        WorkflowStepResult(
                            step_name=f"task_{i+1}_{task.agent_name}",
                            success=True,
                            output=f"Completed task: {task.description[:50]}...",
                            metadata={
                                "task_id": task.id,
                                "agent": task.agent_name
                            }
                        )
                    )
                
                # Create the final result
                result = WorkflowResult(
                    workflow_name=self.name,
                    success=True,
                    steps=steps,
                    final_output=f"Successfully executed all tasks for '{self.task}'",
                    metadata={
                        "execution_time_seconds": execution_time,
                        "memory_usage_mb": memory_usage,
                        "execution_mode": self.execution_mode,
                        "task": self.task
                    }
                )
            else:
                # Handle execution failure
                error_message = execution_result.get("error", "Unknown error during execution")
                logger.error(f"CrewAI-Rust execution failed: {error_message}")
                
                result = WorkflowResult(
                    workflow_name=self.name,
                    success=False,
                    steps=steps,
                    error=error_message,
                    metadata={
                        "execution_mode": self.execution_mode,
                        "task": self.task
                    }
                )
            
            # Log the completion of execution
            if run_tree:
                run_tree.trace({
                    "result": str(result),
                    "success": result.success,
                    "execution_time": execution_result.get("execution_time", 0)
                })
            
            return result
            
        except Exception as e:
            logger.exception(f"Error executing CrewAI-Rust workflow: {str(e)}")
            return WorkflowResult(
                workflow_name=self.name,
                success=False,
                error=str(e),
                metadata={
                    "execution_mode": self.execution_mode,
                    "task": self.task
                }
            )

# Example usage (when run directly)
if __name__ == "__main__":
    # Example of running the custom workflow
    from src.core.manager import AutoGroqManager
    
    # Replace with your actual API key or set as environment variable
    api_key = os.environ.get("GROQ_API_KEY", "")
    
    if not api_key:
        logger.error("No Groq API key provided. Please set the GROQ_API_KEY environment variable.")
        sys.exit(1)
    
    # Initialize the manager
    manager = AutoGroqManager(api_key=api_key)
    
    # Create and execute the custom workflow
    workflow = CrewAIRustCustomWorkflow(
        task="Research the impact of AI on healthcare in the next decade",
        execution_mode="parallel"
    )
    
    # Execute the workflow
    result = manager.execute_workflow(
        workflow,
        inputs={"additional_context": "Focus on patient outcomes and cost reduction"}
    )
    
    # Print the results
    if result.success:
        logger.info(f"Workflow completed successfully: {result.final_output}")
    else:
        logger.error(f"Workflow failed: {result.error}")