#!/usr/bin/env python3
"""
Example of loading and executing a YAML-based crew configuration with AutoGroq
"""

import os
import sys
import logging
from typing import Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path to import the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import AutoGroq components
from src.core.manager import AutoGroqManager
from src.integrations.crewai_rust_integration import CrewAIRustIntegration, CREWAI_RUST_AVAILABLE

def main():
    """Run an example workflow using YAML configuration"""
    logger.info("Starting YAML-based CrewAI-Rust example")
    
    # Check if CrewAI-Rust is available
    if not CREWAI_RUST_AVAILABLE:
        logger.error("CrewAI-Rust is not available. Please install it first.")
        sys.exit(1)
    
    # Get Groq API key from environment
    api_key = os.environ.get("GROQ_API_KEY", "")
    
    if not api_key:
        logger.error("No Groq API key provided. Please set the GROQ_API_KEY environment variable.")
        sys.exit(1)
    
    # Initialize AutoGroq manager
    manager = AutoGroqManager(api_key=api_key)
    logger.info("AutoGroqManager initialized successfully")
    
    # Initialize CrewAI-Rust integration
    crewai_integration = CrewAIRustIntegration(execution_mode="parallel")
    logger.info("CrewAI-Rust integration initialized")
    
    # Path to the YAML configuration file
    yaml_path = os.path.join(os.path.dirname(__file__), "research_crew.yaml")
    
    if not os.path.exists(yaml_path):
        logger.error(f"YAML configuration file not found: {yaml_path}")
        sys.exit(1)
    
    try:
        # Validate the YAML content
        with open(yaml_path, "r") as f:
            yaml_content = f.read()
        
        is_valid = crewai_integration.validate_yaml(yaml_content)
        if not is_valid:
            logger.error("Invalid YAML configuration")
            sys.exit(1)
        
        logger.info("YAML configuration is valid")
        
        # Load the crew from YAML
        crew = crewai_integration.load_from_yaml(yaml_path)
        logger.info(f"Loaded crew '{crew.name}' from YAML")
        
        # Display information about the loaded crew
        logger.info(f"Crew name: {crew.name}")
        logger.info(f"Execution mode: {crew.process}")
        logger.info(f"Number of agents: {len(crew.agents)}")
        logger.info(f"Number of tasks: {len(crew.tasks)}")
        
        # Execute the crew
        logger.info("Executing crew from YAML configuration...")
        
        # Execute based on the selected mode in the YAML
        if crew.process == "sequential":
            logger.info("Executing with sequential mode")
            crew.execute_sequential()
        elif crew.process == "parallel":
            logger.info("Executing with parallel mode")
            crew.execute_parallel_rayon()
        elif crew.process == "async":
            logger.info("Executing with async mode")
            import asyncio
            asyncio.run(crew.execute_concurrent_tokio_async())
        else:
            logger.warning(f"Unknown execution mode: {crew.process}. Defaulting to sequential.")
            crew.execute_sequential()
        
        # Get memory usage
        memory_usage = crew.get_memory_usage()
        logger.info(f"Crew execution completed. Memory usage: {memory_usage / 1024:.2f} MB")
        
        logger.info("YAML-based workflow execution completed successfully")
        
    except Exception as e:
        logger.exception(f"Error executing YAML-based workflow: {e}")

if __name__ == "__main__":
    main()