"""
Core AutoGroq manager for executing workflows.
"""

from typing import Any, Dict, List, Optional, Union
from loguru import logger
import groq
from langchain.callbacks.base import BaseCallbackManager
from langsmith.run_trees import RunTree

from ..workflows.base import BaseWorkflow


class AutoGroqManager:
    """
    Manager for AutoGroq operations, providing a central interface for workflow execution
    and integration with various backends.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        callback_manager: Optional[BaseCallbackManager] = None,
        default_model: str = "qwen-2.5-32b",
        langsmith_project: Optional[str] = None,
    ):
        """
        Initialize the AutoGroq manager.

        Args:
            api_key: Groq API key for authentication
            callback_manager: Optional callback manager for monitoring
            default_model: Default Groq model to use
            langsmith_project: Optional LangSmith project for tracing
        """
        self.api_key = api_key
        self.client = groq.Client(api_key=api_key) if api_key else None
        self.callback_manager = callback_manager
        self.default_model = default_model
        self.langsmith_project = langsmith_project
        self.workflows: Dict[str, BaseWorkflow] = {}
        logger.info(f"Initialized AutoGroq manager with model: {default_model}")

    def register_workflow(self, workflow: BaseWorkflow) -> None:
        """
        Register a workflow with the manager.

        Args:
            workflow: The workflow to register
        """
        self.workflows[workflow.name] = workflow
        workflow.bind_manager(self)
        logger.info(f"Registered workflow: {workflow.name}")

    def execute_workflow(
        self, workflow: Union[BaseWorkflow, str], inputs: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Execute a workflow.

        Args:
            workflow: The workflow to execute or its name if already registered
            inputs: Optional inputs to the workflow

        Returns:
            The result of the workflow execution
        """
        if isinstance(workflow, str):
            if workflow not in self.workflows:
                raise ValueError(f"Workflow '{workflow}' not registered")
            workflow_obj = self.workflows[workflow]
        else:
            workflow_obj = workflow
            if workflow_obj.name not in self.workflows:
                self.register_workflow(workflow_obj)

        logger.info(f"Executing workflow: {workflow_obj.name}")
        # Skip RunTree for now to avoid issues
        inputs = inputs or {}
        try:
            result = workflow_obj.execute(inputs, run_tree=None)
            return result
        except Exception as e:
            logger.error(f"Error executing workflow: {str(e)}")
            raise

    def list_available_models(self) -> List[str]:
        """
        List available Groq models.

        Returns:
            List of available model names
        """
        if not self.client:
            raise ValueError("Groq client not initialized. Provide an API key.")
            
        models = self.client.models.list()
        return [model.id for model in models.data]

    def get_model_details(self, model_name: str) -> Dict[str, Any]:
        """
        Get details about a specific Groq model.

        Args:
            model_name: Name of the model

        Returns:
            Dictionary of model details
        """
        if not self.client:
            raise ValueError("Groq client not initialized. Provide an API key.")
            
        model = self.client.models.retrieve(model_name)
        return {
            "id": model.id,
            "created": model.created,
            "owned_by": model.owned_by,
            "description": getattr(model, "description", "No description available"),
            "context_length": getattr(model, "context_window", "Unknown"),
        }
