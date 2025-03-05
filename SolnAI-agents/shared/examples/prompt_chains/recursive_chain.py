"""
Recursive Prompt Chain Example

This example demonstrates a recursive prompt chain that can call itself to solve
complex problems by breaking them down into smaller sub-problems.
"""

import os
import sys
import asyncio
import logging
import json
import re
from typing import List, Dict, Any, Optional, Callable, Union, Tuple
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

class RecursiveChain:
    """
    A recursive prompt chain that can call itself to solve complex problems
    by breaking them down into smaller sub-problems.
    """
    
    def __init__(self, 
                 system_prompt: str, 
                 max_recursion_depth: int = 5,
                 temperature: float = 0.7,
                 max_tokens: int = 1000):
        """
        Initialize the recursive chain.
        
        Args:
            system_prompt: The system prompt to use for all steps
            max_recursion_depth: Maximum recursion depth to prevent infinite loops
            temperature: Temperature for LLM generation
            max_tokens: Maximum tokens for LLM generation
        """
        self.system_prompt = system_prompt
        self.max_recursion_depth = max_recursion_depth
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.call_history = []
    
    async def solve(self, problem: str, depth: int = 0) -> Dict[str, Any]:
        """
        Solve a problem, potentially recursively.
        
        Args:
            problem: The problem to solve
            depth: Current recursion depth
            
        Returns:
            Dictionary with the solution and metadata
        """
        if depth > self.max_recursion_depth:
            return {
                "solution": "Maximum recursion depth exceeded. Unable to solve the problem.",
                "status": "error",
                "sub_problems": []
            }
        
        # Log the current call
        call_id = len(self.call_history) + 1
        logger.info(f"[Call {call_id}, Depth {depth}] Solving problem: {problem[:100]}...")
        
        # Record this call
        call_record = {
            "id": call_id,
            "depth": depth,
            "problem": problem,
            "sub_problems": [],
            "solution": None
        }
        self.call_history.append(call_record)
        
        # Prepare the prompt
        user_prompt = f"""
Problem: {problem}

If this problem is complex, break it down into smaller sub-problems. For each sub-problem, write "SUB-PROBLEM:" followed by the sub-problem description.

After listing any sub-problems (or if none are needed), provide your solution to the original problem, starting with "SOLUTION:".

If you need to solve a sub-problem before solving the main problem, write "NEED-SOLUTION:" followed by the specific sub-problem that needs to be solved first.
"""
        
        # Generate the initial response
        messages = [
            create_system_message(self.system_prompt),
            create_user_message(user_prompt)
        ]
        
        response = await generate_chat_completion(
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )
        
        # Parse the response
        sub_problems = self._extract_sub_problems(response)
        need_solution = self._extract_need_solution(response)
        solution = self._extract_solution(response)
        
        # Update the call record
        call_record["sub_problems"] = sub_problems
        call_record["need_solution"] = need_solution
        call_record["initial_solution"] = solution
        
        # If a sub-problem needs to be solved first
        if need_solution:
            logger.info(f"[Call {call_id}] Needs solution to sub-problem: {need_solution[:100]}...")
            
            # Recursively solve the sub-problem
            sub_result = await self.solve(need_solution, depth + 1)
            
            # Use the sub-problem solution to solve the original problem
            user_prompt_with_sub = f"""
Problem: {problem}

I've solved a sub-problem for you:
SUB-PROBLEM: {need_solution}
SUB-SOLUTION: {sub_result['solution']}

Now, using this information, please solve the original problem. Start your solution with "SOLUTION:".
"""
            
            messages = [
                create_system_message(self.system_prompt),
                create_user_message(user_prompt_with_sub)
            ]
            
            response = await generate_chat_completion(
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Extract the final solution
            solution = self._extract_solution(response)
        
        # Update the call record with the final solution
        call_record["solution"] = solution
        
        return {
            "solution": solution,
            "status": "success",
            "sub_problems": sub_problems,
            "call_history": self.call_history
        }
    
    def _extract_sub_problems(self, text: str) -> List[str]:
        """Extract sub-problems from the response."""
        sub_problems = []
        for line in text.split('\n'):
            if line.strip().startswith("SUB-PROBLEM:"):
                sub_problem = line.strip()[len("SUB-PROBLEM:"):].strip()
                sub_problems.append(sub_problem)
        return sub_problems
    
    def _extract_need_solution(self, text: str) -> Optional[str]:
        """Extract a sub-problem that needs to be solved first."""
        match = re.search(r"NEED-SOLUTION:(.*?)(?:\n\n|\n|$)", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return None
    
    def _extract_solution(self, text: str) -> str:
        """Extract the solution from the response."""
        match = re.search(r"SOLUTION:(.*?)(?:\n\n|\n|$)", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text  # Return the full text if no SOLUTION: marker is found

# Example usage: Complex problem solving chain
async def run_problem_solving_chain(problem: str) -> Dict[str, Any]:
    """
    Run a recursive chain to solve a complex problem.
    
    Args:
        problem: The problem to solve
        
    Returns:
        Dictionary with the solution and metadata
    """
    # Create the chain
    system_prompt = """
You are an expert problem solver that can break down complex problems into smaller, more manageable sub-problems.
For each problem, you'll either:
1. Provide a direct solution if the problem is simple enough
2. Break it down into sub-problems
3. Identify a specific sub-problem that needs to be solved first

Always be thorough and systematic in your approach.
"""
    
    chain = RecursiveChain(
        system_prompt=system_prompt,
        max_recursion_depth=3,
        temperature=0.4
    )
    
    # Solve the problem
    result = await chain.solve(problem)
    
    return result

class ProblemSolvingAgent(BaseAgent):
    """
    An agent that uses a recursive prompt chain to solve complex problems.
    """
    
    def __init__(self):
        """Initialize the problem solving agent."""
        super().__init__(
            name="Problem Solving Agent",
            description="An agent that solves complex problems by breaking them down into smaller sub-problems",
            version="1.0.0"
        )
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a request to solve a complex problem.
        
        Args:
            request: The agent request containing a problem description
            
        Returns:
            AgentResponse: The agent response with the solution
        """
        try:
            # Extract problem from request
            problem = request.query
            
            # Run the chain
            result = await run_problem_solving_chain(problem)
            
            # Format the response
            response_text = f"""
# Problem Solution

## Original Problem
{problem}

## Solution
{result['solution']}
"""
            
            # Add sub-problems if any
            if result['sub_problems']:
                response_text += "\n## Sub-Problems Identified\n"
                for i, sub_problem in enumerate(result['sub_problems']):
                    response_text += f"{i+1}. {sub_problem}\n"
            
            # Add call history for transparency
            response_text += "\n## Solution Process\n"
            for call in result['call_history']:
                response_text += f"- Depth {call['depth']}: {call['problem'][:100]}...\n"
            
            # Return successful response
            return AgentResponse(
                success=True,
                output=response_text,
                data=result
            )
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            
            # Return error response
            return AgentResponse(
                success=False,
                output=f"I encountered an error while solving the problem: {str(e)}",
                error=str(e)
            )

if __name__ == "__main__":
    # Example problems
    problems = [
        "Design a system to monitor the health of a distributed microservice architecture with at least 20 services.",
        "Explain how quantum computing works to a 10-year-old child.",
        "Create a step-by-step plan for a small business to implement an effective social media marketing strategy with a limited budget."
    ]
    
    # Run the chain for each problem
    async def main():
        for i, problem in enumerate(problems):
            print(f"\n=== PROBLEM {i+1} ===\n{problem}\n")
            result = await run_problem_solving_chain(problem)
            print("Solution:")
            print(result["solution"])
            print("\nSub-problems:")
            for sub in result["sub_problems"]:
                print(f"- {sub}")
            print("\n" + "="*50)
    
    asyncio.run(main())
