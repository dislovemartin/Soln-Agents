"""
Branching Prompt Chain Example

This example demonstrates a branching prompt chain that takes different paths
based on the output of previous steps, allowing for more dynamic and adaptive processing.
"""

import os
import sys
import asyncio
import logging
import json
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

class BranchingChain:
    """
    A branching prompt chain that can take different paths based on the output
    of previous steps, allowing for more dynamic and adaptive processing.
    """
    
    def __init__(self):
        """Initialize the branching chain."""
        self.steps = {}
        self.results = {}
    
    def add_step(self, step_id: str, step_config: Dict[str, Any]) -> None:
        """
        Add a step to the chain.
        
        Args:
            step_id: Unique identifier for the step
            step_config: Step configuration containing:
                - system_prompt: System prompt for this step
                - user_prompt_template: Template for user prompt, can include {variables}
                - output_key: Key to store the output under
                - next_step: Either a step_id or a function that determines the next step
        """
        self.steps[step_id] = step_config
    
    async def execute(self, initial_input: str, start_step_id: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute the chain with the given input, starting from the specified step.
        
        Args:
            initial_input: The initial input to the chain
            start_step_id: ID of the first step to execute
            context: Optional additional context
            
        Returns:
            Dictionary containing all step outputs
        """
        # Initialize context
        self.results = context or {}
        self.results["initial_input"] = initial_input
        
        # Start with the specified step
        current_step_id = start_step_id
        path_taken = [current_step_id]
        
        # Execute steps until we reach a step with no next step
        while current_step_id:
            # Execute the current step
            await self._execute_step(current_step_id)
            
            # Determine the next step
            next_step = self.steps[current_step_id].get("next_step")
            
            if next_step is None:
                # End of chain
                break
                
            elif isinstance(next_step, str):
                # Static next step
                current_step_id = next_step
                
            elif callable(next_step):
                # Dynamic next step based on function
                current_step_id = next_step(self.results)
                
            else:
                # Invalid next_step
                raise ValueError(f"Invalid next_step for step {current_step_id}: {next_step}")
            
            # Record the path taken
            if current_step_id:
                path_taken.append(current_step_id)
        
        # Store the path taken
        self.results["path_taken"] = path_taken
        
        return self.results
    
    async def _execute_step(self, step_id: str) -> None:
        """
        Execute a single step in the chain.
        
        Args:
            step_id: ID of the step to execute
        """
        if step_id not in self.steps:
            raise ValueError(f"Step not found: {step_id}")
            
        step = self.steps[step_id]
        logger.info(f"Executing step: {step_id}")
        
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
            logger.info(f"Step {step_id} completed. Output stored in '{output_key}'")
            
            # Process the output if needed
            if "output_processor" in step and callable(step["output_processor"]):
                processed_output = step["output_processor"](response)
                processed_key = f"{output_key}_processed"
                self.results[processed_key] = processed_output
                logger.info(f"Processed output stored in '{processed_key}'")
            
        except Exception as e:
            logger.error(f"Error in step {step_id}: {str(e)}")
            raise

# Example usage: Customer support ticket routing chain
async def run_support_ticket_chain(ticket_description: str) -> Dict[str, Any]:
    """
    Run a branching chain to categorize and route a customer support ticket.
    
    Args:
        ticket_description: Description of the support ticket
        
    Returns:
        Dictionary with chain results
    """
    # Create the chain
    chain = BranchingChain()
    
    # Define a function to determine the next step based on category
    def route_by_category(results: Dict[str, Any]) -> str:
        category = results.get("category_processed", {}).get("category", "").lower()
        
        if "technical" in category or "bug" in category:
            return "technical_support"
        elif "billing" in category or "payment" in category:
            return "billing_support"
        elif "feature" in category or "request" in category:
            return "feature_request"
        else:
            return "general_inquiry"
    
    # Define a function to process the category output
    def process_category(output: str) -> Dict[str, str]:
        try:
            # Try to parse as JSON
            return json.loads(output)
        except json.JSONDecodeError:
            # Extract category using simple heuristic
            category_line = [line for line in output.split('\n') if "category" in line.lower()]
            if category_line:
                category = category_line[0].split(":", 1)[1].strip() if ":" in category_line[0] else category_line[0]
                return {"category": category}
            return {"category": "general"}
    
    # Add steps to the chain
    chain.add_step("categorize", {
        "system_prompt": "You are a support ticket categorization system. Analyze the ticket and determine the appropriate category.",
        "user_prompt_template": "Categorize the following support ticket. Respond with a JSON object containing a 'category' field with one of these values: Technical Issue, Billing Question, Feature Request, or General Inquiry.\n\nTicket: {initial_input}",
        "output_key": "category",
        "output_processor": process_category,
        "next_step": route_by_category,
        "temperature": 0.3
    })
    
    chain.add_step("technical_support", {
        "system_prompt": "You are a technical support specialist. Provide a detailed response to resolve the technical issue.",
        "user_prompt_template": "Provide a technical support response for this issue:\n\n{initial_input}",
        "output_key": "support_response",
        "next_step": "prioritize",
        "temperature": 0.4
    })
    
    chain.add_step("billing_support", {
        "system_prompt": "You are a billing support specialist. Address the customer's billing or payment concern.",
        "user_prompt_template": "Provide a billing support response for this inquiry:\n\n{initial_input}",
        "output_key": "support_response",
        "next_step": "prioritize",
        "temperature": 0.4
    })
    
    chain.add_step("feature_request", {
        "system_prompt": "You are a product manager. Respond to this feature request with appreciation and next steps.",
        "user_prompt_template": "Provide a response to this feature request:\n\n{initial_input}",
        "output_key": "support_response",
        "next_step": "prioritize",
        "temperature": 0.5
    })
    
    chain.add_step("general_inquiry", {
        "system_prompt": "You are a customer support representative. Provide a helpful response to this general inquiry.",
        "user_prompt_template": "Provide a response to this general inquiry:\n\n{initial_input}",
        "output_key": "support_response",
        "next_step": "prioritize",
        "temperature": 0.5
    })
    
    chain.add_step("prioritize", {
        "system_prompt": "You are a support ticket prioritization system. Determine the priority level of this ticket.",
        "user_prompt_template": "Based on the following ticket and support response, assign a priority level (Low, Medium, High, Critical).\n\nTicket: {initial_input}\n\nResponse: {support_response}",
        "output_key": "priority",
        "next_step": None,  # End of chain
        "temperature": 0.3
    })
    
    # Execute the chain
    results = await chain.execute(ticket_description, "categorize")
    
    return results

class SupportTicketAgent(BaseAgent):
    """
    An agent that uses a branching prompt chain to process customer support tickets.
    """
    
    def __init__(self):
        """Initialize the support ticket agent."""
        super().__init__(
            name="Support Ticket Agent",
            description="An agent that processes customer support tickets using a branching prompt chain",
            version="1.0.0"
        )
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a customer support ticket.
        
        Args:
            request: The agent request containing a ticket description
            
        Returns:
            AgentResponse: The agent response with the support response
        """
        try:
            # Extract ticket description from request
            ticket_description = request.query
            
            # Run the chain
            results = await run_support_ticket_chain(ticket_description)
            
            # Extract category and priority
            category = results.get("category_processed", {}).get("category", "General")
            priority = results.get("priority", "").strip()
            
            # Format the response
            response_text = f"""
# Support Ticket Response

## Category: {category}
## Priority: {priority}

{results['support_response']}

---
*This response was generated automatically based on your inquiry. If you need further assistance, please reply to this message.*
            """
            
            # Return successful response
            return AgentResponse(
                success=True,
                output=response_text,
                data={
                    "category": category,
                    "priority": priority,
                    "response": results['support_response'],
                    "path_taken": results['path_taken']
                }
            )
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            
            # Return error response
            return AgentResponse(
                success=False,
                output=f"I encountered an error while processing your support ticket: {str(e)}",
                error=str(e)
            )

if __name__ == "__main__":
    # Example support tickets
    tickets = [
        "I can't log into my account. I keep getting an 'invalid password' error even though I'm sure my password is correct.",
        "I was charged twice for my monthly subscription. Can you please refund one of the charges?",
        "It would be great if you could add a dark mode to the application. The bright interface hurts my eyes at night.",
        "How do I change my email address on my account?"
    ]
    
    # Run the chain for each ticket
    async def main():
        for i, ticket in enumerate(tickets):
            print(f"\n=== TICKET {i+1} ===\n{ticket}\n")
            results = await run_support_ticket_chain(ticket)
            print(f"Category: {results.get('category_processed', {}).get('category', 'Unknown')}")
            print(f"Path: {' -> '.join(results['path_taken'])}")
            print(f"Priority: {results['priority']}")
            print("\nResponse:")
            print(results["support_response"])
            print("\n" + "="*50)
    
    asyncio.run(main())
