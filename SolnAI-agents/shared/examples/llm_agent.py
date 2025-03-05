"""
LLM-powered agent example using the SolnAI shared utilities.

This example demonstrates how to create an agent that uses the LLM utilities
to generate responses to user queries.
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
from utils.llm import generate_chat_completion, create_system_message, create_user_message

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class LLMAgent(BaseAgent):
    """
    An agent that uses an LLM to generate responses to user queries.
    """
    
    def __init__(self):
        """Initialize the LLM agent."""
        super().__init__(
            name="LLM Agent",
            description="An agent that uses an LLM to generate responses to user queries",
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
        Process a user request by generating a response using an LLM.
        
        Args:
            request: The agent request
            
        Returns:
            AgentResponse: The agent response
        """
        try:
            # Log the request
            logger.info(f"Received request: {request.query}")
            
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
            response_text = await generate_chat_completion(
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
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
    agent = LLMAgent()
    agent.run(port=8080)
