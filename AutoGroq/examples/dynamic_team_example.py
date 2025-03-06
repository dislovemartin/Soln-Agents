"""
Example using the Dynamic Team Workflow.
"""

import os
import sys
from dotenv import load_dotenv
from loguru import logger

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.core.manager import AutoGroqManager
from src.workflows.dynamic_team import DynamicTeamWorkflow
from src.integrations.crewai_rust_integration import CrewAIRustIntegration
from src.integrations.langsmith_integration import LangSmithIntegration

# Load environment variables
load_dotenv()

def main():
    """Run the example."""
    # Get API key from environment
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("ERROR: GROQ_API_KEY environment variable not set")
        sys.exit(1)
    
    # Initialize AutoGroq manager
    manager = AutoGroqManager(
        api_key=api_key,
        default_model="llama3-70b-8192",
        langsmith_project="autogroq-examples",
    )
    
    # Initialize LangSmith integration (if API key is available)
    langsmith_key = os.getenv("LANGCHAIN_API_KEY")
    if langsmith_key:
        langsmith = LangSmithIntegration(api_key=langsmith_key)
        langsmith.create_project("autogroq-examples", "Examples for AutoGroq workflows")
        print("LangSmith integration enabled")
    
    # Try to initialize CrewAI-Rust integration
    try:
        crewai_rust = CrewAIRustIntegration(execution_mode="parallel")
        print("CrewAI-Rust integration enabled")
        use_crewai = True
    except ImportError:
        print("CrewAI-Rust not available. Using standard execution.")
        use_crewai = False
    
    # Create a dynamic team workflow
    task = "Research and summarize the latest advancements in quantum computing"
    
    workflow = DynamicTeamWorkflow(
        task=task,
        team_size=3,
        model="llama3-70b-8192",
        name="quantum-research-team",
    )
    
    # Execute the workflow
    print(f"\nExecuting workflow for task: {task}")
    print("This is a demo with mock implementations\n")
    
    result = manager.execute_workflow(workflow)
    
    # Display results
    print("\n=== Workflow Result ===")
    print(f"Workflow: {result.workflow_name}")
    print(f"Success: {result.success}")
    
    print("\n=== Steps ===")
    for step in result.steps:
        print(f"- {step.step_name}: {'✓' if step.success else '✗'}")
    
    print("\n=== Final Output ===")
    print(result.final_output)
    
    if use_crewai:
        print("\n=== CrewAI-Rust Integration ===")
        print("Parallel execution capabilities enabled")
    
    print("\nNote: This example uses mock implementations. In a real setup,")
    print("it would make actual calls to the Groq API and other services.")

if __name__ == "__main__":
    main()
