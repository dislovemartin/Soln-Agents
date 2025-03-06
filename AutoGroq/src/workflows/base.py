"""
Base workflow class for AutoGroq.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
from pydantic import BaseModel, Field

from langsmith.run_trees import RunTree


class BaseWorkflow(ABC):
    """
    Abstract base class for all AutoGroq workflows.
    """

    def __init__(self, name: str, description: str = ""):
        """
        Initialize a workflow.

        Args:
            name: Name of the workflow
            description: Optional description of the workflow
        """
        self.name = name
        self.description = description
        self.manager = None

    def bind_manager(self, manager: Any) -> None:
        """
        Bind a manager to this workflow.

        Args:
            manager: The AutoGroq manager
        """
        self.manager = manager

    @abstractmethod
    def build(self) -> Any:
        """
        Build the workflow graph.

        Returns:
            The built workflow
        """
        pass

    @abstractmethod
    def execute(self, inputs: Dict[str, Any], run_tree: Optional[RunTree] = None) -> Any:
        """
        Execute the workflow.

        Args:
            inputs: Input parameters for the workflow
            run_tree: Optional RunTree for tracing

        Returns:
            The result of the workflow execution
        """
        pass


class WorkflowStepResult(BaseModel):
    """
    Result of a workflow step.
    """
    step_name: str = Field(..., description="Name of the step")
    success: bool = Field(..., description="Whether the step was successful")
    output: Any = Field(None, description="Output of the step")
    error: Optional[str] = Field(None, description="Error message if the step failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class WorkflowResult(BaseModel):
    """
    Result of a workflow execution.
    """
    workflow_name: str = Field(..., description="Name of the workflow")
    success: bool = Field(..., description="Whether the workflow was successful")
    steps: List[WorkflowStepResult] = Field(default_factory=list, description="Results of individual steps")
    final_output: Any = Field(None, description="Final output of the workflow")
    error: Optional[str] = Field(None, description="Error message if the workflow failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
