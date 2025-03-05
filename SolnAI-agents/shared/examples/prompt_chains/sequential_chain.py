"""
Sequential Prompt Chain Example

This example demonstrates a sequential prompt chain for breaking down a complex task
into a series of simpler steps, with each step building on the results of previous steps.
"""

import os
import sys
import asyncio
import logging
from typing import List, Dict, Any, Optional
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

class SequentialChain:
    """
    A sequential prompt chain that processes a task through multiple steps,
    with each step building on the results of previous steps.
    """
    
    def __init__(self, steps: List[Dict[str, Any]]):
        """
        Initialize the sequential chain with a list of steps.
        
        Args:
            steps: List of step configurations, each containing:
                - name: Step name
                - system_prompt: System prompt for this step
                - user_prompt_template: Template for user prompt, can include {variables}
                - output_key: Key to store the output under
        """
        self.steps = steps
        self.results = {}
    
    async def execute(self, initial_input: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute the chain with the given input.
        
        Args:
            initial_input: The initial input to the chain
            context: Optional additional context
            
        Returns:
            Dictionary containing all step outputs
        """
        # Initialize context
        self.results = context or {}
        self.results["initial_input"] = initial_input
        
        # Execute each step in sequence
        for step in self.steps:
            await self._execute_step(step)
            
        return self.results
    
    async def _execute_step(self, step: Dict[str, Any]) -> None:
        """
        Execute a single step in the chain.
        
        Args:
            step: Step configuration
        """
        step_name = step["name"]
        logger.info(f"Executing step: {step_name}")
        
        # Format the user prompt template with available variables
        user_prompt = step["user_prompt_template"].format(**self.results)
        
        # Prepare messages for the LLM
        messages = [
            create_system_message(step["system_prompt"]),
            create_user_message(user_prompt)
        ]
        
        # Generate completion
        try:
            response = await generate_chat_completion(
                messages=messages,
                temperature=step.get("temperature", 0.7),
                max_tokens=step.get("max_tokens", 1000)
            )
            
            # Store the result
            output_key = step["output_key"]
            self.results[output_key] = response
            logger.info(f"Step {step_name} completed. Output stored in '{output_key}'")
            
        except Exception as e:
            logger.error(f"Error in step {step_name}: {str(e)}")
            raise

# Example usage: Research paper summarization chain
async def run_research_summarization_chain(paper_url: str) -> Dict[str, Any]:
    """
    Run a sequential chain to summarize a research paper.
    
    Args:
        paper_url: URL of the research paper
        
    Returns:
        Dictionary with chain results
    """
    # Define the chain steps
    steps = [
        {
            "name": "extract_key_points",
            "system_prompt": "You are a research assistant that extracts key points from academic papers. Focus on the main contributions, methodology, and results.",
            "user_prompt_template": "Extract the key points from this research paper: {initial_input}",
            "output_key": "key_points",
            "temperature": 0.3
        },
        {
            "name": "analyze_methodology",
            "system_prompt": "You are a methodology expert who analyzes research methods. Evaluate the strengths and limitations of the approach.",
            "user_prompt_template": "Based on these key points, analyze the methodology used in the paper:\n\n{key_points}",
            "output_key": "methodology_analysis",
            "temperature": 0.4
        },
        {
            "name": "generate_summary",
            "system_prompt": "You are a scientific writer who creates clear, concise summaries of research papers for a general audience.",
            "user_prompt_template": "Create a comprehensive yet accessible summary of this research paper.\n\nKey points:\n{key_points}\n\nMethodology analysis:\n{methodology_analysis}",
            "output_key": "summary",
            "temperature": 0.5
        },
        {
            "name": "suggest_applications",
            "system_prompt": "You are an innovation consultant who identifies practical applications of research findings.",
            "user_prompt_template": "Based on this paper summary, suggest 3-5 practical applications or implications of this research:\n\n{summary}",
            "output_key": "applications",
            "temperature": 0.7
        }
    ]
    
    # Create and execute the chain
    chain = SequentialChain(steps)
    results = await chain.execute(paper_url)
    
    return results

class ResearchSummaryAgent(BaseAgent):
    """
    An agent that uses a sequential prompt chain to summarize research papers.
    """
    
    def __init__(self):
        """Initialize the research summary agent."""
        super().__init__(
            name="Research Summary Agent",
            description="An agent that summarizes research papers using a sequential prompt chain",
            version="1.0.0"
        )
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a request to summarize a research paper.
        
        Args:
            request: The agent request containing a research paper URL
            
        Returns:
            AgentResponse: The agent response with the summary
        """
        try:
            # Extract paper URL from request
            paper_url = request.query
            
            # Run the chain
            results = await run_research_summarization_chain(paper_url)
            
            # Format the response
            response_text = f"""
# Research Paper Summary

## Summary
{results['summary']}

## Key Points
{results['key_points']}

## Methodology Analysis
{results['methodology_analysis']}

## Potential Applications
{results['applications']}
            """
            
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
                output=f"I encountered an error while summarizing the research paper: {str(e)}",
                error=str(e)
            )

if __name__ == "__main__":
    # Example paper URL
    paper_url = "https://arxiv.org/abs/2303.08774"  # "A Survey of Large Language Models"
    
    # Run the chain
    async def main():
        results = await run_research_summarization_chain(paper_url)
        print("\n=== SUMMARY ===\n")
        print(results["summary"])
        print("\n=== APPLICATIONS ===\n")
        print(results["applications"])
    
    asyncio.run(main())
