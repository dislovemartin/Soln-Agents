"""
Tests for the Dynamic Team Workflow.
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.core.manager import AutoGroqManager
from src.workflows.dynamic_team import DynamicTeamWorkflow
from src.workflows.base import WorkflowResult


@pytest.fixture
def mock_manager():
    """Create a mock AutoGroq manager."""
    with patch("src.core.manager.groq.Client") as mock_client:
        manager = AutoGroqManager(
            api_key="mock-api-key",
            default_model="mock-model",
        )
        yield manager


@pytest.fixture
def workflow():
    """Create a dynamic team workflow for testing."""
    return DynamicTeamWorkflow(
        task="Test task",
        team_size=2,
        model="mock-model",
        name="test-workflow",
    )


def test_workflow_initialization():
    """Test workflow initialization."""
    workflow = DynamicTeamWorkflow(
        task="Test task",
        team_size=3,
        model="test-model",
        name="test-workflow",
    )
    
    assert workflow.name == "test-workflow"
    assert workflow.task == "Test task"
    assert workflow.team_size == 3
    assert workflow.model == "test-model"


def test_workflow_build(workflow):
    """Test building the workflow graph."""
    graph = workflow.build()
    
    # Check that the graph was built successfully
    assert graph is not None
    assert workflow.graph is not None


@patch("langgraph.graph.StateGraph")
def test_workflow_execution(mock_state_graph, mock_manager, workflow):
    """Test workflow execution."""
    # Mock the graph compilation and execution
    mock_compiled = MagicMock()
    mock_state_graph.return_value.compile.return_value = mock_compiled
    
    # Mock the stream method to return a single state
    mock_compiled.stream.return_value = [
        {
            "task": "Test task",
            "status": "completed",
            "final_result": "Test result",
            "completed_steps": ["analyze_task", "create_team", "plan_execution", "execute_plan", "synthesize_results"],
        }
    ]
    
    # Register the workflow with the manager
    mock_manager.register_workflow(workflow)
    
    # Execute the workflow
    result = mock_manager.execute_workflow(workflow)
    
    # Check that the result is as expected
    assert isinstance(result, WorkflowResult)
    assert result.workflow_name == workflow.name
    assert result.success is True
    assert result.final_output == "Test result"


@patch("langgraph.graph.StateGraph")
def test_workflow_error_handling(mock_state_graph, mock_manager, workflow):
    """Test workflow error handling."""
    # Mock the graph compilation
    mock_compiled = MagicMock()
    mock_state_graph.return_value.compile.return_value = mock_compiled
    
    # Mock the stream method to raise an exception
    mock_compiled.stream.side_effect = Exception("Test error")
    
    # Register the workflow with the manager
    mock_manager.register_workflow(workflow)
    
    # Execute the workflow
    result = mock_manager.execute_workflow(workflow)
    
    # Check that the error was handled correctly
    assert isinstance(result, WorkflowResult)
    assert result.workflow_name == workflow.name
    assert result.success is False
    assert "Test error" in result.error


def test_manager_model_listing(mock_manager):
    """Test listing available models."""
    # Set up the mock
    mock_manager.client.models.list.return_value.data = [
        MagicMock(id="model1"),
        MagicMock(id="model2"),
    ]
    
    # List models
    models = mock_manager.list_available_models()
    
    # Check the result
    assert len(models) == 2
    assert "model1" in models
    assert "model2" in models


def test_manager_model_details(mock_manager):
    """Test getting model details."""
    # Set up the mock
    mock_manager.client.models.retrieve.return_value = MagicMock(
        id="model1",
        created=1234567890,
        owned_by="groq",
        description="Test model",
        context_window=8192,
    )
    
    # Get model details
    details = mock_manager.get_model_details("model1")
    
    # Check the result
    assert details["id"] == "model1"
    assert details["owned_by"] == "groq"
    assert details["description"] == "Test model"
    assert details["context_length"] == 8192
