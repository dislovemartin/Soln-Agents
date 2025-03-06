"""
Base tool class for AutoGroq.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ToolInput(BaseModel):
    """Input for a tool execution."""
    pass


class ToolOutput(BaseModel):
    """Output from a tool execution."""
    pass


class BaseTool(ABC):
    """
    Abstract base class for all AutoGroq tools.
    """

    def __init__(self, name: str, description: str):
        """
        Initialize a tool.

        Args:
            name: Name of the tool
            description: Description of the tool
        """
        self.name = name
        self.description = description

    @abstractmethod
    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the tool.

        Args:
            inputs: Input parameters for the tool

        Returns:
            Tool execution results
        """
        pass

    def get_schema(self) -> Dict[str, Any]:
        """
        Get the schema for the tool.

        Returns:
            Tool schema as a dictionary
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }


class WebSearchTool(BaseTool):
    """
    Tool for performing web searches.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize a web search tool.

        Args:
            api_key: Optional API key for search API
        """
        super().__init__(
            name="web_search",
            description="Search the web for information",
        )
        self.api_key = api_key

    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a web search.

        Args:
            inputs: Input parameters with 'query' key

        Returns:
            Search results
        """
        query = inputs.get("query", "")
        
        # Mock implementation - in a real tool, this would call a search API
        return {
            "results": [
                {
                    "title": f"Result 1 for: {query}",
                    "snippet": f"This is a snippet from the first result for query: {query}",
                    "url": f"https://example.com/result1?q={query}"
                },
                {
                    "title": f"Result 2 for: {query}",
                    "snippet": f"This is a snippet from the second result for query: {query}",
                    "url": f"https://example.com/result2?q={query}"
                }
            ]
        }

    def get_schema(self) -> Dict[str, Any]:
        """
        Get the schema for the web search tool.

        Returns:
            Tool schema as a dictionary
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query"
                    }
                },
                "required": ["query"]
            }
        }
