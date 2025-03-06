#!/usr/bin/env python3
"""
Simple test script to verify that CrewAI-Rust integration is working correctly.
"""

import os
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path to import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the optimized CrewAI integration
from src.integrations.optimized_crewai_integration import OptimizedCrewAIIntegration

def test_crewai_rust():
    """Test basic CrewAI-Rust functionality."""
    logger.info("Testing CrewAI-Rust integration")
    
    # Initialize the CrewAI-Rust integration
    integration = OptimizedCrewAIIntegration(
        execution_mode="parallel",
        enable_performance_monitoring=True
    )
    
    # Create a crew
    crew = integration.create_crew(name="Test Crew")
    
    # Create agents
    agent1 = integration.create_agent(
        name="Agent1",
        role="Researcher",
        expertise="Finding information"
    )
    
    agent2 = integration.create_agent(
        name="Agent2",
        role="Writer",
        expertise="Creating content"
    )
    
    # Create basic tasks without custom attributes
    task1 = integration.create_task(
        id=1,
        description="Research the topic",
        expected_output="Research notes",
        agent_name="Agent1"
    )
    
    task2 = integration.create_task(
        id=2,
        description="Write a summary",
        expected_output="Summary document",
        agent_name="Agent2"
    )
    
    # Execute the crew
    logger.info("Executing CrewAI-Rust crew")
    result = integration.execute_crew(
        crew=crew,
        tasks=[task1, task2],
        agents=[agent1, agent2]
    )
    
    # Log the results
    logger.info(f"Execution result: {result}")
    
    if "performance" in result:
        logger.info("Performance metrics:")
        perf = result["performance"]
        if "total_execution_time_seconds" in perf:
            logger.info(f"  Execution time: {perf['total_execution_time_seconds']:.4f} seconds")
        if "peak_memory_usage_mb" in perf:
            logger.info(f"  Peak memory usage: {perf['peak_memory_usage_mb']:.2f} MB")
            
    return result

if __name__ == "__main__":
    test_crewai_rust()