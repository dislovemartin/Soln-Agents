"""
Base agent class for AutoGroq.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from ..tools.base_tool import BaseTool


class BaseAgent(ABC):
    """
    Abstract base class for all AutoGroq agents.
    """

    def __init__(
        self,
        name: str,
        role: str,
        description: str = "",
        model: str = "llama3-70b-8192",
        tools: Optional[List[BaseTool]] = None,
    ):
        """
        Initialize an agent.

        Args:
            name: Name of the agent
            role: Role of the agent
            description: Optional description of the agent
            model: Groq model to use
            tools: Optional list of tools
        """
        self.name = name
        self.role = role
        self.description = description
        self.model = model
        self.tools = tools or []
        self.context = {}

    def add_tool(self, tool: BaseTool) -> None:
        """
        Add a tool to the agent.

        Args:
            tool: Tool to add
        """
        self.tools.append(tool)

    def set_context(self, context: Dict[str, Any]) -> None:
        """
        Set context for the agent.

        Args:
            context: Context dictionary
        """
        self.context = context

    def get_description(self) -> str:
        """
        Get the agent description.

        Returns:
            Agent description
        """
        base = f"I am {self.name}, a {self.role}."
        if self.description:
            base += f" {self.description}"
        
        if self.tools:
            tool_desc = "\n\nTools available:\n"
            for tool in self.tools:
                tool_desc += f"- {tool.name}: {tool.description}\n"
            base += tool_desc
        
        return base

    @abstractmethod
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent.

        Args:
            inputs: Input parameters for the agent

        Returns:
            Execution results
        """
        pass


class GroqAgent(BaseAgent):
    """
    Agent that uses Groq's high-performance LLM APIs.
    """

    def __init__(
        self,
        name: str,
        role: str,
        description: str = "",
        model: str = "llama3-70b-8192",
        tools: Optional[List[BaseTool]] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None,
    ):
        """
        Initialize a Groq agent.

        Args:
            name: Name of the agent
            role: Role of the agent
            description: Optional description of the agent
            model: Groq model to use
            tools: Optional list of tools
            max_tokens: Maximum tokens to generate
            temperature: Generation temperature
            system_prompt: Optional system prompt
        """
        super().__init__(name, role, description, model, tools)
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.system_prompt = system_prompt or f"You are {name}, a {role}."
        if description:
            self.system_prompt += f" {description}"
        
        # This would be used when we have Groq client
        self.client = None

    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent using Groq's API.

        Args:
            inputs: Input parameters for the agent

        Returns:
            Execution results
        """
        # In a full implementation, this would use the Groq client
        # to call the API with the agent's prompt
        
        # Mock implementation
        message = inputs.get("message", "")
        response = f"Response from {self.name} ({self.role}): I have processed your message: '{message}'"
        
        return {
            "response": response,
            "agent_name": self.name,
            "model": self.model,
        }
