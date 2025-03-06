"""
Integration with LangSmith for tracing and evaluation.
"""

from typing import Any, Dict, List, Optional, Callable, Union
import os
from datetime import datetime
from loguru import logger

from langsmith import Client, traceable
from langsmith.run_trees import RunTree


class LangSmithIntegration:
    """
    Integration with LangSmith for tracing and evaluation.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_url: Optional[str] = None,
    ):
        """
        Initialize the LangSmith integration.

        Args:
            api_key: LangSmith API key (defaults to LANGCHAIN_API_KEY env var)
            api_url: LangSmith API URL (defaults to LANGCHAIN_ENDPOINT env var)
        """
        self.api_key = api_key or os.getenv("LANGCHAIN_API_KEY")
        self.api_url = api_url or os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
        
        if self.api_key:
            self.client = Client(api_key=self.api_key, api_url=self.api_url)
            logger.info(f"Initialized LangSmith integration with API URL: {self.api_url}")
        else:
            self.client = None
            logger.warning(
                "LangSmith API key not provided. Set LANGCHAIN_API_KEY environment variable "
                "or pass api_key to enable LangSmith integration."
            )

    def create_project(self, project_name: str, description: Optional[str] = None) -> str:
        """
        Create a LangSmith project.

        Args:
            project_name: Name of the project
            description: Optional project description

        Returns:
            Project ID
        """
        if not self.client:
            logger.warning("LangSmith client not initialized. Cannot create project.")
            return ""
            
        try:
            # Check if project exists
            projects = self.client.list_projects()
            for project in projects:
                if project.name == project_name:
                    logger.info(f"Project '{project_name}' already exists with ID: {project.id}")
                    return project.id
            
            # Create new project
            project = self.client.create_project(
                project_name=project_name,
                description=description or f"Created by AutoGroq on {datetime.now().isoformat()}",
            )
            logger.info(f"Created LangSmith project: {project_name} with ID: {project.id}")
            return project.id
            
        except Exception as e:
            logger.exception(f"Error creating LangSmith project: {str(e)}")
            return ""

    def trace_workflow(
        self, 
        fn: Callable, 
        project_name: Optional[str] = None,
        name: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Callable:
        """
        Create a traced version of a function or workflow.

        Args:
            fn: Function to trace
            project_name: Optional project name
            name: Optional run name
            tags: Optional tags for the run

        Returns:
            Traced function
        """
        if not self.client:
            logger.warning("LangSmith client not initialized. Returning original function.")
            return fn
            
        name = name or fn.__name__
        tags = tags or ["autogroq"]
        
        @traceable(project_name=project_name, name=name, tags=tags)
        def traced_fn(*args, **kwargs):
            return fn(*args, **kwargs)
            
        return traced_fn

    def create_run_tree(
        self,
        name: str,
        run_type: str = "chain",
        project_name: Optional[str] = None,
        inputs: Optional[Dict[str, Any]] = None,
    ) -> RunTree:
        """
        Create a run tree for manual tracing.

        Args:
            name: Name of the run
            run_type: Type of the run
            project_name: Optional project name
            inputs: Optional inputs to the run

        Returns:
            RunTree instance
        """
        return RunTree(
            name=name,
            run_type=run_type,
            project_name=project_name,
            inputs=inputs or {},
        )

    def evaluate_run(
        self,
        run_id: str,
        evaluator_name: str,
        evaluation_criteria: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Evaluate a run using LangSmith evaluators.

        Args:
            run_id: ID of the run to evaluate
            evaluator_name: Name of the evaluator to use
            evaluation_criteria: Criteria for evaluation

        Returns:
            Evaluation results
        """
        if not self.client:
            logger.warning("LangSmith client not initialized. Cannot evaluate run.")
            return {"error": "LangSmith client not initialized"}
            
        try:
            evaluation = self.client.run_evaluator(
                run_id=run_id,
                evaluator=evaluator_name,
                **evaluation_criteria,
            )
            logger.info(f"Evaluated run {run_id} with evaluator {evaluator_name}")
            return evaluation
            
        except Exception as e:
            logger.exception(f"Error evaluating run: {str(e)}")
            return {"error": str(e)}

    def get_run_details(self, run_id: str) -> Dict[str, Any]:
        """
        Get details of a specific run.

        Args:
            run_id: ID of the run

        Returns:
            Run details
        """
        if not self.client:
            logger.warning("LangSmith client not initialized. Cannot get run details.")
            return {"error": "LangSmith client not initialized"}
            
        try:
            run = self.client.read_run(run_id=run_id)
            return {
                "id": run.id,
                "name": run.name,
                "start_time": run.start_time,
                "end_time": run.end_time,
                "status": run.status,
                "error": run.error,
                "inputs": run.inputs,
                "outputs": run.outputs,
                "feedback": run.feedback,
            }
            
        except Exception as e:
            logger.exception(f"Error getting run details: {str(e)}")
            return {"error": str(e)}
