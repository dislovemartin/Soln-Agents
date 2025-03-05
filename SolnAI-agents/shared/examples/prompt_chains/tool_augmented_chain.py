"""
Tool-Augmented Prompt Chain Example

This example demonstrates a prompt chain that can use external tools to enhance
its capabilities, allowing the chain to access and process external information.
"""

import os
import sys
import asyncio
import logging
import json
import re
from typing import List, Dict, Any, Optional, Callable, Union
from dotenv import load_dotenv

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from utils.llm import generate_chat_completion, create_system_message, create_user_message
from utils.base_agent import BaseAgent
from types.api import AgentRequest, AgentResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class Tool:
    """Base class for tools that can be used in a tool-augmented chain."""
    
    def __init__(self, name: str, description: str):
        """
        Initialize the tool.
        
        Args:
            name: Tool name
            description: Tool description
        """
        self.name = name
        self.description = description
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the tool with the given parameters.
        
        Args:
            params: Tool parameters
            
        Returns:
            Dictionary with tool execution results
        """
        raise NotImplementedError("Subclasses must implement execute()")
    
    def get_schema(self) -> Dict[str, Any]:
        """
        Get the schema for this tool.
        
        Returns:
            Dictionary with tool schema
        """
        raise NotImplementedError("Subclasses must implement get_schema()")

class SearchTool(Tool):
    """Tool for searching information."""
    
    def __init__(self):
        """Initialize the search tool."""
        super().__init__(
            name="search",
            description="Search for information on a given topic"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a search query.
        
        Args:
            params: Dictionary with 'query' parameter
            
        Returns:
            Dictionary with search results
        """
        query = params.get("query", "")
        if not query:
            return {"error": "No query provided"}
        
        # In a real implementation, this would call an actual search API
        # Here we're simulating results for demonstration purposes
        logger.info(f"Searching for: {query}")
        
        # Simulate search results based on query keywords
        if "weather" in query.lower():
            return {
                "results": [
                    {
                        "title": "Current Weather Conditions",
                        "snippet": "Today's forecast: Partly cloudy with a high of 72°F and a low of 58°F. 20% chance of precipitation."
                    },
                    {
                        "title": "5-Day Weather Forecast",
                        "snippet": "Extended forecast shows warming trend with temperatures reaching 80°F by the weekend."
                    }
                ]
            }
        elif "population" in query.lower():
            return {
                "results": [
                    {
                        "title": "World Population Statistics",
                        "snippet": "Current world population is approximately 7.9 billion people as of 2023, with a growth rate of about 1% annually."
                    },
                    {
                        "title": "Population Distribution",
                        "snippet": "Asia contains about 60% of the world's population, with China and India being the most populous countries."
                    }
                ]
            }
        else:
            return {
                "results": [
                    {
                        "title": "General Information",
                        "snippet": "Here is some general information about your query. For more specific results, try adding more details to your search."
                    }
                ]
            }
    
    def get_schema(self) -> Dict[str, Any]:
        """
        Get the schema for this tool.
        
        Returns:
            Dictionary with tool schema
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

class CalculatorTool(Tool):
    """Tool for performing calculations."""
    
    def __init__(self):
        """Initialize the calculator tool."""
        super().__init__(
            name="calculator",
            description="Perform mathematical calculations"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a calculation.
        
        Args:
            params: Dictionary with 'expression' parameter
            
        Returns:
            Dictionary with calculation result
        """
        expression = params.get("expression", "")
        if not expression:
            return {"error": "No expression provided"}
        
        logger.info(f"Calculating: {expression}")
        
        try:
            # WARNING: eval is used here for demonstration purposes only
            # In a production environment, use a safer method for calculation
            result = eval(expression)
            return {"result": result}
        except Exception as e:
            return {"error": f"Calculation error: {str(e)}"}
    
    def get_schema(self) -> Dict[str, Any]:
        """
        Get the schema for this tool.
        
        Returns:
            Dictionary with tool schema
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "The mathematical expression to evaluate"
                    }
                },
                "required": ["expression"]
            }
        }

class WeatherTool(Tool):
    """Tool for getting weather information."""
    
    def __init__(self):
        """Initialize the weather tool."""
        super().__init__(
            name="weather",
            description="Get weather information for a location"
        )
    
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get weather information.
        
        Args:
            params: Dictionary with 'location' parameter
            
        Returns:
            Dictionary with weather information
        """
        location = params.get("location", "")
        if not location:
            return {"error": "No location provided"}
        
        logger.info(f"Getting weather for: {location}")
        
        # In a real implementation, this would call an actual weather API
        # Here we're simulating results for demonstration purposes
        locations = {
            "new york": {
                "temperature": 68,
                "condition": "Partly Cloudy",
                "humidity": 65,
                "wind": "10 mph"
            },
            "london": {
                "temperature": 59,
                "condition": "Rainy",
                "humidity": 80,
                "wind": "15 mph"
            },
            "tokyo": {
                "temperature": 75,
                "condition": "Sunny",
                "humidity": 50,
                "wind": "5 mph"
            },
            "sydney": {
                "temperature": 82,
                "condition": "Clear",
                "humidity": 45,
                "wind": "8 mph"
            }
        }
        
        location_lower = location.lower()
        for key in locations:
            if key in location_lower:
                return {"weather": locations[key]}
        
        # Default weather if location not found
        return {
            "weather": {
                "temperature": 70,
                "condition": "Unknown",
                "humidity": 60,
                "wind": "7 mph",
                "note": f"Simulated data for {location}"
            }
        }
    
    def get_schema(self) -> Dict[str, Any]:
        """
        Get the schema for this tool.
        
        Returns:
            Dictionary with tool schema
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The location to get weather for"
                    }
                },
                "required": ["location"]
            }
        }

class ToolAugmentedChain:
    """
    A prompt chain that can use external tools to enhance its capabilities,
    allowing the chain to access and process external information.
    """
    
    def __init__(self, tools: List[Tool]):
        """
        Initialize the tool-augmented chain.
        
        Args:
            tools: List of tools available to the chain
        """
        self.tools = {tool.name: tool for tool in tools}
        self.results = {}
        self.tool_calls = []
    
    async def execute(self, user_query: str) -> Dict[str, Any]:
        """
        Execute the chain with the given user query.
        
        Args:
            user_query: The user's query
            
        Returns:
            Dictionary with chain results
        """
        # Initialize results
        self.results = {
            "user_query": user_query,
            "tool_calls": [],
            "final_response": None
        }
        
        # Step 1: Determine if tools are needed and which ones to use
        tool_selection = await self._determine_tools(user_query)
        
        # Step 2: Call tools if needed
        if tool_selection.get("tools_needed", False):
            for tool_call in tool_selection.get("tool_calls", []):
                await self._execute_tool_call(tool_call)
        
        # Step 3: Generate final response
        final_response = await self._generate_response(user_query)
        self.results["final_response"] = final_response
        
        return self.results
    
    async def _determine_tools(self, user_query: str) -> Dict[str, Any]:
        """
        Determine if tools are needed and which ones to use.
        
        Args:
            user_query: The user's query
            
        Returns:
            Dictionary with tool selection results
        """
        # Create tool descriptions for the system prompt
        tool_descriptions = []
        for tool_name, tool in self.tools.items():
            schema = tool.get_schema()
            tool_descriptions.append(f"Tool: {tool_name}\nDescription: {schema['description']}\nParameters: {json.dumps(schema['parameters'])}")
        
        tool_descriptions_text = "\n\n".join(tool_descriptions)
        
        system_prompt = f"""
You are an AI assistant with access to the following tools:

{tool_descriptions_text}

Determine if any of these tools are needed to answer the user's query.
If tools are needed, specify which tools to use and the parameters for each tool call.
Respond in JSON format with the following structure:
{{
  "tools_needed": true/false,
  "reasoning": "Your reasoning for why tools are or aren't needed",
  "tool_calls": [
    {{
      "tool": "tool_name",
      "parameters": {{
        "param1": "value1",
        ...
      }}
    }},
    ...
  ]
}}
"""
        
        user_prompt = f"User query: {user_query}"
        
        messages = [
            create_system_message(system_prompt),
            create_user_message(user_prompt)
        ]
        
        response = await generate_chat_completion(
            messages=messages,
            temperature=0.3,
            max_tokens=1000
        )
        
        # Parse the JSON response
        try:
            # Extract JSON from the response
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Look for JSON objects without code blocks
                json_match = re.search(r'(\{[\s\S]*\})', response)
                if json_match:
                    json_str = json_match.group(1)
                else:
                    raise ValueError("Could not find JSON in the response")
            
            result = json.loads(json_str)
            logger.info(f"Tool selection: {result}")
            return result
        except Exception as e:
            logger.error(f"Error parsing tool selection: {str(e)}")
            # Default to no tools needed
            return {"tools_needed": False, "reasoning": "Error in tool selection", "tool_calls": []}
    
    async def _execute_tool_call(self, tool_call: Dict[str, Any]) -> None:
        """
        Execute a tool call and store the results.
        
        Args:
            tool_call: Dictionary with tool call details
        """
        tool_name = tool_call.get("tool")
        parameters = tool_call.get("parameters", {})
        
        if tool_name not in self.tools:
            logger.error(f"Tool not found: {tool_name}")
            tool_result = {"error": f"Tool not found: {tool_name}"}
        else:
            try:
                tool = self.tools[tool_name]
                logger.info(f"Executing tool: {tool_name} with parameters: {parameters}")
                tool_result = await tool.execute(parameters)
            except Exception as e:
                logger.error(f"Error executing tool {tool_name}: {str(e)}")
                tool_result = {"error": f"Tool execution error: {str(e)}"}
        
        # Store the tool call and result
        call_record = {
            "tool": tool_name,
            "parameters": parameters,
            "result": tool_result
        }
        self.results["tool_calls"].append(call_record)
    
    async def _generate_response(self, user_query: str) -> str:
        """
        Generate the final response based on tool results.
        
        Args:
            user_query: The user's query
            
        Returns:
            Final response text
        """
        # Create a summary of tool calls and results
        tool_results_text = ""
        for call in self.results["tool_calls"]:
            tool_results_text += f"Tool: {call['tool']}\n"
            tool_results_text += f"Parameters: {json.dumps(call['parameters'])}\n"
            tool_results_text += f"Result: {json.dumps(call['result'])}\n\n"
        
        system_prompt = """
You are an AI assistant that uses tool results to provide helpful, accurate responses to user queries.
Use the provided tool results to formulate a comprehensive and informative response.
Make sure to integrate the tool results naturally into your response without explicitly mentioning that you used tools.
"""
        
        user_prompt = f"""
User query: {user_query}

Tool results:
{tool_results_text}

Please provide a helpful response to the user's query based on these tool results.
"""
        
        messages = [
            create_system_message(system_prompt),
            create_user_message(user_prompt)
        ]
        
        response = await generate_chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1500
        )
        
        return response

# Example usage: Information assistant chain
async def run_information_assistant_chain(user_query: str) -> Dict[str, Any]:
    """
    Run a tool-augmented chain to answer user queries with external information.
    
    Args:
        user_query: The user's query
        
    Returns:
        Dictionary with chain results
    """
    # Create the tools
    tools = [
        SearchTool(),
        CalculatorTool(),
        WeatherTool()
    ]
    
    # Create and execute the chain
    chain = ToolAugmentedChain(tools)
    results = await chain.execute(user_query)
    
    return results

class InformationAssistantAgent(BaseAgent):
    """
    An agent that uses a tool-augmented prompt chain to answer user queries
    with access to external information.
    """
    
    def __init__(self):
        """Initialize the information assistant agent."""
        super().__init__(
            name="Information Assistant Agent",
            description="An agent that answers user queries with access to external tools and information",
            version="1.0.0"
        )
        self.tools = [
            SearchTool(),
            CalculatorTool(),
            WeatherTool()
        ]
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a user query.
        
        Args:
            request: The agent request containing a user query
            
        Returns:
            AgentResponse: The agent response with the answer
        """
        try:
            # Extract query from request
            query = request.query
            
            # Run the chain
            chain = ToolAugmentedChain(self.tools)
            results = await chain.execute(query)
            
            # Format the response
            response_text = results["final_response"]
            
            # Add tool usage information if debug mode is enabled
            if request.parameters and request.parameters.get("debug", False):
                response_text += "\n\n---\n\n**Debug Information:**\n\n"
                response_text += "Tools used:\n"
                
                for call in results["tool_calls"]:
                    response_text += f"- {call['tool']} with parameters: {json.dumps(call['parameters'])}\n"
            
            # Return successful response
            return AgentResponse(
                success=True,
                output=response_text,
                data=results
            )
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            
            # Return error response
            return AgentResponse(
                success=False,
                output=f"I encountered an error while processing your query: {str(e)}",
                error=str(e)
            )

if __name__ == "__main__":
    # Example queries
    queries = [
        "What's the weather like in New York?",
        "What is the square root of 144?",
        "What is the population of Earth?",
        "Can you tell me about the weather in Tokyo and London?"
    ]
    
    # Run the chain for each query
    async def main():
        for i, query in enumerate(queries):
            print(f"\n=== QUERY {i+1} ===\n{query}\n")
            results = await run_information_assistant_chain(query)
            print("Response:")
            print(results["final_response"])
            print("\nTool calls:")
            for call in results["tool_calls"]:
                print(f"- {call['tool']} with parameters: {call['parameters']}")
            print("\n" + "="*50)
    
    asyncio.run(main())
