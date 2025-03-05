"""
YouTube agent example using the SolnAI shared utilities.

This example demonstrates how to create an agent that uses the YouTube utilities
to fetch video information and transcripts.
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
from utils.youtube import extract_youtube_id, get_video_info, get_video_transcript
from utils.llm import generate_chat_completion, create_system_message, create_user_message

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class YouTubeAgent(BaseAgent):
    """
    An agent that summarizes YouTube videos.
    """
    
    def __init__(self):
        """Initialize the YouTube agent."""
        super().__init__(
            name="YouTube Summary Agent",
            description="An agent that summarizes YouTube videos",
            version="1.0.0"
        )
        
        # Set up agent-specific configuration
        self.system_prompt = """
        You are a helpful AI assistant that summarizes YouTube videos.
        Given a video transcript and metadata, provide a concise summary of the video's content.
        Include key points, main ideas, and important details.
        Format your summary in a clear and readable way.
        """
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a user request by summarizing a YouTube video.
        
        Args:
            request: The agent request containing a YouTube URL or ID
            
        Returns:
            AgentResponse: The agent response with the video summary
        """
        try:
            # Log the request
            logger.info(f"Received request: {request.query}")
            
            # Extract YouTube ID from the query
            try:
                id_type, youtube_id = extract_youtube_id(request.query)
                
                if id_type != "video":
                    return AgentResponse(
                        success=False,
                        output="Please provide a valid YouTube video URL or ID.",
                        error="Not a video URL or ID"
                    )
                
            except ValueError as e:
                return AgentResponse(
                    success=False,
                    output=f"Could not extract YouTube video ID from your query. Please provide a valid YouTube video URL or ID.",
                    error=str(e)
                )
            
            # Get video information
            video_info = await get_video_info(youtube_id)
            
            # Get video transcript
            try:
                transcript = await get_video_transcript(youtube_id)
            except Exception as e:
                return AgentResponse(
                    success=False,
                    output=f"Could not retrieve transcript for video {youtube_id}. The video may not have captions available.",
                    error=str(e)
                )
            
            # Prepare prompt for summarization
            prompt = f"""
            Please summarize the following YouTube video:
            
            Title: {video_info['title']}
            Channel: {video_info['channel_title']}
            Published: {video_info['published_at']}
            
            Transcript:
            {transcript[:4000]}  # Truncate transcript if too long
            
            Please provide a concise summary of the video's content, including key points and main ideas.
            """
            
            # Generate summary using LLM
            messages = [
                create_system_message(self.system_prompt),
                create_user_message(prompt)
            ]
            
            summary = await generate_chat_completion(
                messages=messages,
                temperature=0.3,
                max_tokens=1000
            )
            
            # Format response
            response_text = f"""
            # Summary of: {video_info['title']}
            
            {summary}
            
            ## Video Information
            - **Channel:** {video_info['channel_title']}
            - **Published:** {video_info['published_at']}
            - **Video ID:** {youtube_id}
            - **URL:** https://www.youtube.com/watch?v={youtube_id}
            """
            
            # Return successful response
            return AgentResponse(
                success=True,
                output=response_text,
                data={
                    "video_info": video_info,
                    "summary": summary
                }
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
    agent = YouTubeAgent()
    agent.run(port=8080)
