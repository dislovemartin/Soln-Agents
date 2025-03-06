#\!/usr/bin/env python
"""
Main script for AutoGroq.
"""

import os
import sys
import argparse
from dotenv import load_dotenv
from loguru import logger

from src.core.manager import AutoGroqManager
from src.workflows.dynamic_team import DynamicTeamWorkflow
from src.utils.helpers import load_config

# Load environment variables
load_dotenv()

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="AutoGroq - Agent workflow system")
    parser.add_argument(
        "--config", "-c", default="config/default_config.yaml", help="Path to config file"
    )
    parser.add_argument(
        "--task", "-t", required=False, help="Task to execute"
    )
    parser.add_argument(
        "--model", "-m", default="llama3-70b-8192", help="Groq model to use"
    )
    parser.add_argument(
        "--team-size", "-s", type=int, default=3, help="Team size for dynamic team workflow"
    )
    parser.add_argument(
        "--api-key", "-k", help="Groq API key (overrides environment variable)"
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose logging"
    )
    
    return parser.parse_args()

def setup_logging(verbose=False):
    """Set up logging configuration."""
    log_level = "DEBUG" if verbose else "INFO"
    logger.remove()  # Remove default handler
    logger.add(sys.stderr, level=log_level)
    logger.add("logs/autogroq.log", rotation="10 MB", level=log_level)

def main():
    """Main entry point."""
    args = parse_args()
    setup_logging(args.verbose)
    
    # Load configuration
    config = load_config(args.config)
    if not config:
        logger.error(f"Failed to load configuration from {args.config}")
        sys.exit(1)
    
    # Get API key (priority: command line > environment variable > config file)
    api_key = args.api_key or os.getenv("GROQ_API_KEY") or config.get("api", {}).get("groq_api_key")
    if not api_key:
        logger.error("No Groq API key provided. Set GROQ_API_KEY environment variable or provide via --api-key")
        sys.exit(1)
    
    # Initialize AutoGroq manager
    manager = AutoGroqManager(
        api_key=api_key,
        default_model=args.model,
        langsmith_project=config.get("integrations", {}).get("langsmith", {}).get("default_project"),
    )
    
    # If a task is provided, execute a dynamic team workflow
    if args.task:
        logger.info(f"Executing task: {args.task}")
        workflow = DynamicTeamWorkflow(
            task=args.task,
            team_size=args.team_size,
            model=args.model,
        )
        
        result = manager.execute_workflow(workflow)
        print("\n=== Workflow Result ===")
        print(f"Task: {args.task}")
        print(f"Success: {result.success}")
        if result.success:
            print("\nFinal Output:")
            print(result.final_output)
        else:
            print(f"\nError: {result.error}")
    else:
        logger.info("No task provided. Use --task to specify a task.")
        print("AutoGroq initialized successfully. Use --task to specify a task to execute.")

if __name__ == "__main__":
    main()
