"""
Parallel Prompt Chain Example

This example demonstrates a parallel prompt chain that processes multiple sub-tasks
concurrently and then aggregates the results.
"""

import os
import sys
import asyncio
import logging
from typing import List, Dict, Any, Optional, Callable
from dotenv import load_dotenv

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from utils.llm import generate_chat_completion, create_system_message, create_user_message
from utils.base_agent import BaseAgent
from types.api import AgentRequest, AgentResponse
from chain_utils import JsonOutputParser, ChainMetrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class ParallelChain:
    """
    A parallel prompt chain that processes multiple sub-tasks concurrently
    and then aggregates the results.
    """
    
    def __init__(self):
        """Initialize the parallel chain."""
        self.tasks = []
        self.aggregator = None
        self.metrics = ChainMetrics()
    
    def add_task(self, task_config: Dict[str, Any]) -> None:
        """
        Add a task to be processed in parallel.
        
        Args:
            task_config: Task configuration containing:
                - name: Task name
                - system_prompt: System prompt for this task
                - user_prompt_template: Template for user prompt, can include {variables}
                - output_key: Key to store the output under
        """
        self.tasks.append(task_config)
    
    def set_aggregator(self, aggregator_config: Dict[str, Any]) -> None:
        """
        Set the aggregator that will combine results from parallel tasks.
        
        Args:
            aggregator_config: Aggregator configuration containing:
                - system_prompt: System prompt for the aggregator
                - user_prompt_template: Template for user prompt, can include {variables}
                - output_key: Key to store the output under
        """
        self.aggregator = aggregator_config
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute all tasks in parallel and then aggregate the results.
        
        Args:
            input_data: Input data for the chain
            
        Returns:
            Dictionary containing all task outputs and the aggregated result
        """
        results = input_data.copy()
        
        # Execute all tasks in parallel
        task_coroutines = []
        for task_config in self.tasks:
            task_coroutines.append(self._execute_task(task_config, results))
        
        # Wait for all tasks to complete
        await asyncio.gather(*task_coroutines)
        
        # Aggregate the results
        if self.aggregator:
            await self._execute_aggregator(results)
        
        # Add metrics to results
        results["metrics"] = self.metrics.get_summary()
        
        return results
    
    async def _execute_task(self, task_config: Dict[str, Any], results: Dict[str, Any]) -> None:
        """
        Execute a single task.
        
        Args:
            task_config: Task configuration
            results: Results dictionary to update
        """
        task_name = task_config["name"]
        self.metrics.start_step(task_name)
        logger.info(f"Executing task: {task_name}")
        
        # Format the user prompt template with available variables
        user_prompt = task_config["user_prompt_template"].format(**results)
        
        # Prepare messages for the LLM
        messages = [
            create_system_message(task_config["system_prompt"]),
            create_user_message(user_prompt)
        ]
        
        # Generate completion
        try:
            response = await generate_chat_completion(
                messages=messages,
                temperature=task_config.get("temperature", 0.7),
                max_tokens=task_config.get("max_tokens", 1000)
            )
            
            # Parse the output if a parser is provided
            if "output_parser" in task_config and task_config["output_parser"] is not None:
                try:
                    parsed_output = task_config["output_parser"].parse(response)
                    results[f"{task_config['output_key']}_parsed"] = parsed_output
                except Exception as e:
                    logger.error(f"Error parsing output for task {task_name}: {str(e)}")
            
            # Store the raw result
            output_key = task_config["output_key"]
            results[output_key] = response
            logger.info(f"Task {task_name} completed. Output stored in '{output_key}'")
            
        except Exception as e:
            logger.error(f"Error in task {task_name}: {str(e)}")
            results[f"{task_config['output_key']}_error"] = str(e)
        
        self.metrics.end_step()
    
    async def _execute_aggregator(self, results: Dict[str, Any]) -> None:
        """
        Execute the aggregator to combine results from parallel tasks.
        
        Args:
            results: Results dictionary to update
        """
        self.metrics.start_step("aggregator")
        logger.info("Executing aggregator")
        
        # Format the user prompt template with available variables
        user_prompt = self.aggregator["user_prompt_template"].format(**results)
        
        # Prepare messages for the LLM
        messages = [
            create_system_message(self.aggregator["system_prompt"]),
            create_user_message(user_prompt)
        ]
        
        # Generate completion
        try:
            response = await generate_chat_completion(
                messages=messages,
                temperature=self.aggregator.get("temperature", 0.7),
                max_tokens=self.aggregator.get("max_tokens", 1500)
            )
            
            # Parse the output if a parser is provided
            if "output_parser" in self.aggregator and self.aggregator["output_parser"] is not None:
                try:
                    parsed_output = self.aggregator["output_parser"].parse(response)
                    results[f"{self.aggregator['output_key']}_parsed"] = parsed_output
                except Exception as e:
                    logger.error(f"Error parsing aggregator output: {str(e)}")
            
            # Store the raw result
            output_key = self.aggregator["output_key"]
            results[output_key] = response
            logger.info(f"Aggregator completed. Output stored in '{output_key}'")
            
        except Exception as e:
            logger.error(f"Error in aggregator: {str(e)}")
            results[f"{self.aggregator['output_key']}_error"] = str(e)
        
        self.metrics.end_step()

# Example usage: Product analysis chain
async def run_product_analysis_chain(product_description: str) -> Dict[str, Any]:
    """
    Run a parallel chain to analyze a product from multiple perspectives.
    
    Args:
        product_description: Description of the product
        
    Returns:
        Dictionary with analysis results
    """
    # Create the chain
    chain = ParallelChain()
    
    # Add tasks for parallel processing
    chain.add_task({
        "name": "market_analysis",
        "system_prompt": "You are a market research analyst. Analyze the target market for this product, including demographics, size, and growth potential.",
        "user_prompt_template": "Analyze the target market for this product:\n\n{input}",
        "output_key": "market_analysis",
        "temperature": 0.4
    })
    
    chain.add_task({
        "name": "competitor_analysis",
        "system_prompt": "You are a competitive intelligence specialist. Identify key competitors for this product and analyze their strengths and weaknesses.",
        "user_prompt_template": "Identify and analyze competitors for this product:\n\n{input}",
        "output_key": "competitor_analysis",
        "temperature": 0.4
    })
    
    chain.add_task({
        "name": "pricing_strategy",
        "system_prompt": "You are a pricing strategist. Recommend a pricing strategy for this product based on its features, target market, and competitive landscape.",
        "user_prompt_template": "Recommend a pricing strategy for this product:\n\n{input}",
        "output_key": "pricing_strategy",
        "temperature": 0.5
    })
    
    chain.add_task({
        "name": "swot_analysis",
        "system_prompt": "You are a business analyst. Conduct a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for this product.",
        "user_prompt_template": "Conduct a SWOT analysis for this product:\n\n{input}",
        "output_key": "swot_analysis",
        "temperature": 0.4,
        "output_parser": JsonOutputParser({
            "type": "object",
            "properties": {
                "strengths": {"type": "array", "items": {"type": "string"}},
                "weaknesses": {"type": "array", "items": {"type": "string"}},
                "opportunities": {"type": "array", "items": {"type": "string"}},
                "threats": {"type": "array", "items": {"type": "string"}}
            }
        })
    })
    
    # Set the aggregator
    chain.set_aggregator({
        "system_prompt": "You are a product strategy consultant. Synthesize the analyses from different perspectives into a comprehensive product strategy.",
        "user_prompt_template": """Synthesize the following analyses into a comprehensive product strategy:

Market Analysis:
{market_analysis}

Competitor Analysis:
{competitor_analysis}

Pricing Strategy:
{pricing_strategy}

SWOT Analysis:
{swot_analysis}

Provide a clear, actionable product strategy based on these insights.""",
        "output_key": "product_strategy",
        "temperature": 0.6
    })
    
    # Execute the chain
    results = await chain.execute({"input": product_description})
    
    return results

class ProductAnalysisAgent(BaseAgent):
    """
    An agent that uses a parallel prompt chain to analyze products.
    """
    
    def __init__(self):
        """Initialize the product analysis agent."""
        super().__init__(
            name="Product Analysis Agent",
            description="An agent that analyzes products from multiple perspectives using a parallel prompt chain",
            version="1.0.0"
        )
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a request to analyze a product.
        
        Args:
            request: The agent request containing a product description
            
        Returns:
            AgentResponse: The agent response with the analysis
        """
        try:
            # Extract product description from request
            product_description = request.query
            
            # Run the chain
            results = await run_product_analysis_chain(product_description)
            
            # Format the response
            response_text = f"""
# Product Analysis

## Product Strategy
{results['product_strategy']}

## Market Analysis
{results['market_analysis']}

## Competitor Analysis
{results['competitor_analysis']}

## Pricing Strategy
{results['pricing_strategy']}

## SWOT Analysis
"""
            
            # Add SWOT analysis if parsed successfully
            if "swot_analysis_parsed" in results:
                swot = results["swot_analysis_parsed"]
                
                response_text += "\n### Strengths\n"
                for item in swot.get("strengths", []):
                    response_text += f"- {item}\n"
                
                response_text += "\n### Weaknesses\n"
                for item in swot.get("weaknesses", []):
                    response_text += f"- {item}\n"
                
                response_text += "\n### Opportunities\n"
                for item in swot.get("opportunities", []):
                    response_text += f"- {item}\n"
                
                response_text += "\n### Threats\n"
                for item in swot.get("threats", []):
                    response_text += f"- {item}\n"
            else:
                response_text += results["swot_analysis"]
            
            # Add performance metrics
            response_text += "\n## Performance Metrics\n"
            response_text += f"Total execution time: {results['metrics']['total_time']:.2f} seconds\n"
            
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
                output=f"I encountered an error while analyzing the product: {str(e)}",
                error=str(e)
            )

if __name__ == "__main__":
    # Example product descriptions
    products = [
        "A smart water bottle that tracks hydration levels, reminds users to drink water, and syncs with fitness apps. It features LED indicators, a temperature sensor, and a rechargeable battery that lasts up to 2 weeks.",
        "An AI-powered language learning platform that uses speech recognition to provide real-time feedback on pronunciation and conversation skills. It offers courses in 25 languages and adapts to the user's learning style and pace."
    ]
    
    # Run the chain for each product
    async def main():
        for i, product in enumerate(products):
            print(f"\n=== PRODUCT {i+1} ===\n{product}\n")
            results = await run_product_analysis_chain(product)
            print("\n=== PRODUCT STRATEGY ===\n")
            print(results["product_strategy"])
            print(f"\nExecution time: {results['metrics']['total_time']:.2f} seconds")
            print("\n" + "="*50)
    
    asyncio.run(main())
