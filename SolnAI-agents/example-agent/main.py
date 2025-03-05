"""
Example agent implementation using the SolnAI shared utilities.

This agent demonstrates how to use the shared utilities to create a
simple agent that responds to user queries using an LLM.
"""

import os
import sys
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.utils.base_agent import BaseAgent
from shared.types.api import AgentRequest, AgentResponse
from shared.utils.llm import generate_chat_completion, create_system_message, create_user_message

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class ExampleAgent(BaseAgent):
    """
    Example agent implementation.
    
    This agent demonstrates how to extend the BaseAgent class to create
    a simple agent that responds to user queries using an LLM.
    """
    
    def __init__(self):
        """Initialize the example agent."""
        super().__init__(
            name="Example Agent",
            description="A simple example agent that responds to user queries using an LLM",
            version="1.0.0"
        )
        
        # Set up agent-specific configuration
        self.system_prompt = """
        You are a helpful AI assistant that provides concise and accurate responses to user queries.
        Always be respectful and professional in your responses.
        If you don't know the answer to a question, admit it rather than making something up.
        """
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a user request.
        
        Args:
            request: The agent request
            
        Returns:
            AgentResponse: The agent response
        """
        try:
            # Get conversation history
            history = await self.get_conversation_history(request.session_id)
            
            # Prepare messages for the LLM
            messages = [create_system_message(self.system_prompt)]
            
            # Add conversation history
            for msg in history:
                msg_data = msg["message"]
                msg_type = msg_data["type"]
                msg_content = msg_data["content"]
                
                if msg_type == "human":
                    messages.append(create_user_message(msg_content))
                else:  # "ai"
                    messages.append({"role": "assistant", "content": msg_content})
            
            # Add the current query
            messages.append(create_user_message(request.query))
            
            # Generate response using the LLM
            response_text = await generate_chat_completion(messages)
            
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
                output=f"I encountered an error while processing your request: {str(e)}",
                error=str(e)
            )

if __name__ == "__main__":
    # Create and run the agent
    agent = ExampleAgent()
    agent.run()
