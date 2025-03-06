#!/usr/bin/env python3
"""
Example script demonstrating AutoGroq with CrewAI-Rust integration
"""

import os
import sys
import logging
from typing import Dict, Any
import yaml

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path to import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import AutoGroq components
from src.core.manager import AutoGroqManager
from src.workflows.dynamic_team import DynamicTeamWorkflow
from src.integrations.crewai_rust_integration import CrewAIRustIntegration, CREWAI_RUST_AVAILABLE
from src.integrations.langgraph_integration import LangGraphIntegration

# Function to load configuration
def load_config(config_path: str = None) -> Dict[str, Any]:
    """Load configuration from a YAML file or environment variables"""
    config = {}
    
    # Try to load from file if provided
    if config_path and os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            logger.info(f"Loaded configuration from {config_path}")
        except Exception as e:
            logger.error(f"Error loading configuration from {config_path}: {e}")
    
    # Check environment variables for API key
    api_key = os.environ.get('GROQ_API_KEY', config.get('groq', {}).get('api_key'))
    
    if not api_key:
        logger.warning("No Groq API key found. Please provide one through config file or GROQ_API_KEY env variable.")
    
    # Set the api_key in the config
    if api_key and 'groq' not in config:
        config['groq'] = {'api_key': api_key}
    elif api_key:
        config['groq']['api_key'] = api_key
        
    return config

# Function to initialize CrewAI-Rust integration
def initialize_crewai_rust(execution_mode: str = "parallel") -> CrewAIRustIntegration:
    """Initialize CrewAI-Rust integration if available"""
    if not CREWAI_RUST_AVAILABLE:
        logger.error("CrewAI-Rust is not available. Please install it first.")
        sys.exit(1)
        
    try:
        integration = CrewAIRustIntegration(execution_mode=execution_mode)
        logger.info(f"CrewAI-Rust integration initialized with mode: {execution_mode}")
        return integration
    except ImportError as e:
        logger.error(f"Failed to initialize CrewAI-Rust: {e}")
        sys.exit(1)

# Main function to run the example
def main():
    """Run an example workflow using AutoGroq and CrewAI-Rust"""
    logger.info("Starting AutoGroq with CrewAI-Rust example")
    
    # Step 1 & 2: Load configuration and initialize AutoGroqManager
    config = load_config()
    api_key = config.get('groq', {}).get('api_key')
    
    if not api_key:
        logger.error("No Groq API key provided. Exiting.")
        sys.exit(1)
    
    manager = AutoGroqManager(
        api_key=api_key,
        default_model=config.get('model', {}).get('name', "llama-3.3-70b-versatile"),
        langsmith_project="autogroq-example"
    )
    
    logger.info("AutoGroqManager initialized successfully")
    
    # Check available models
    try:
        models = manager.list_available_models()
        logger.info(f"Available models: {models}")
    except Exception as e:
        logger.error(f"Error listing models: {e}")
    
    # Step 3: Create a workflow
    task = "Research and summarize the key features of large language models and their applications in business"
    workflow = DynamicTeamWorkflow(
        task=task,
        team_size=3,
        model=manager.default_model,
        max_iterations=5,
        name="research-team-workflow"
    )
    
    logger.info(f"Created workflow: {workflow.name}")
    
    # Step 4: Execute the workflow
    try:
        logger.info("Executing workflow...")
        result = manager.execute_workflow(workflow)
        logger.info(f"Workflow execution completed with success: {result.success}")
        
        if result.success:
            logger.info(f"Final output: {result.final_output}")
        else:
            logger.error(f"Workflow failed: {result.error}")
            
        # Print step results
        for step in result.steps:
            logger.info(f"Step '{step.step_name}': Success={step.success}")
            if not step.success and step.error:
                logger.error(f"  Error: {step.error}")
    
    except Exception as e:
        logger.error(f"Error executing workflow: {e}")
    
    # Step 5: Example of using CrewAI-Rust for a specific task (if available)
    if CREWAI_RUST_AVAILABLE:
        try:
            logger.info("Initializing CrewAI-Rust integration...")
            crew_integration = initialize_crewai_rust(execution_mode="parallel")
            
            # Create a simple crew
            crew = crew_integration.create_crew(name="Research Team")
            
            # Create agents
            researcher = crew_integration.create_agent(
                name="Alice",
                role="Researcher",
                expertise="Finding and analyzing information"
            )
            
            writer = crew_integration.create_agent(
                name="Bob",
                role="Writer",
                expertise="Crafting concise summaries"
            )
            
            # Create tasks
            research_task = crew_integration.create_task(
                id=1,
                description="Research large language models and their features",
                expected_output="Comprehensive research notes",
                agent_name="Alice"
            )
            
            writing_task = crew_integration.create_task(
                id=2,
                description="Write a summary based on the research",
                expected_output="Concise summary document",
                agent_name="Bob"
            )
            
            # Execute the crew
            logger.info("Executing CrewAI-Rust tasks...")
            result = crew_integration.execute_crew(
                crew=crew,
                tasks=[research_task, writing_task],
                agents=[researcher, writer]
            )
            
            logger.info(f"CrewAI-Rust execution completed: {result}")
            
        except Exception as e:
            logger.error(f"Error with CrewAI-Rust: {e}")
    
    logger.info("Example completed.")

if __name__ == "__main__":
    main()