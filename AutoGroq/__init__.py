"""
AutoGroq - A sophisticated agent workflow system built on LangGraph for Groq LLMs.
"""

__version__ = "0.1.0"

from .src.core.manager import AutoGroqManager
from .src.workflows.dynamic_team import DynamicTeamWorkflow
from .src.integrations.crewai_rust_integration import CrewAIRustIntegration
from .src.integrations.langgraph_integration import LangGraphIntegration
from .src.integrations.langsmith_integration import LangSmithIntegration

__all__ = [
    "AutoGroqManager",
    "DynamicTeamWorkflow",
    "CrewAIRustIntegration",
    "LangGraphIntegration",
    "LangSmithIntegration",
]
