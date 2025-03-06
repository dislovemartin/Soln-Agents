#!/usr/bin/env python3
"""
Simple direct test of CrewAI-Rust functionality.
"""

import logging
import time
import crewai_rust

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Test basic CrewAI-Rust functionality directly."""
    logger.info("Testing CrewAI-Rust")
    
    # Create agents
    agent1 = crewai_rust.Agent(
        name="Researcher",
        role="Research Specialist",
        expertise="Finding information"
    )
    logger.info(f"Created agent: {agent1}")
    
    agent2 = crewai_rust.Agent(
        name="Writer",
        role="Content Creator",
        expertise="Creating content"
    )
    logger.info(f"Created agent: {agent2}")
    
    # Create tasks
    task1 = crewai_rust.Task(
        id=1,
        description="Research the topic",
        expected_output="Research notes",
        agent_name="Researcher"
    )
    logger.info(f"Created task: {task1}")
    
    task2 = crewai_rust.Task(
        id=2,
        description="Write a summary",
        expected_output="Summary document",
        agent_name="Writer"
    )
    logger.info(f"Created task: {task2}")
    
    # Create a crew
    crew = crewai_rust.Crew(name="Test Crew", process="parallel")
    logger.info(f"Created crew: {crew}")
    
    # Add agents to the crew
    crew.add_agent(agent1)
    crew.add_agent(agent2)
    
    # Add tasks to the crew
    crew.add_task(task1)
    crew.add_task(task2)
    
    # Execute the crew
    logger.info("Executing crew...")
    start_time = time.time()
    
    # Benchmark sequential tasks
    benchmark_time = crew.benchmark_sequential_tasks()
    logger.info(f"Sequential benchmark time: {benchmark_time}")
    
    # Execute parallel with Rayon
    crew.execute_parallel_rayon()
    
    # Get memory usage
    memory_usage = crew.get_memory_usage()
    logger.info(f"Memory usage: {memory_usage / 1024 / 1024:.2f} MB")
    
    execution_time = time.time() - start_time
    logger.info(f"Execution completed in {execution_time:.4f} seconds")
    
    return {
        "success": True,
        "execution_time": execution_time,
        "memory_usage": memory_usage / 1024 / 1024
    }

if __name__ == "__main__":
    main()