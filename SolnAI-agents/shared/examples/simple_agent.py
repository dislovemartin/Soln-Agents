"""
Simple agent example using the SolnAI shared utilities.

This example demonstrates how to create a basic agent using the BaseAgent class
and other shared utilities.
"""

import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_agent import BaseAgent
from types.api import AgentRequest, AgentResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class SimpleAgent(BaseAgent):
    """
    A simple agent that echoes the user's query with a greeting.
    """
    
    def __init__(self):
        """Initialize the simple agent."""
        super().__init__(
            name="Simple Echo Agent",
            description="A simple agent that echoes the user's query with a greeting",
            version="1.0.0"
        )
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a user request by echoing it back with a greeting.
        
        Args:
            request: The agent request
            
        Returns:
            AgentResponse: The agent response
        """
        try:
            # Log the request
            logger.info(f"Received request: {request.query}")
            
            # Process the request (in this case, just echo it back)
            response_text = f"Hello! You said: {request.query}"
            
            # Return successful response
            return AgentResponse(
                success=True,
                output=response_text
            )
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            
            # Return error response
            return AgentResponse(
                success=False,
                output=f"I encountered an error: {str(e)}",
                error=str(e)
            )

if __name__ == "__main__":
    # Create and run the agent
    agent = SimpleAgent()
    agent.run(port=8080)
