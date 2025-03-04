#!/usr/bin/env python3
import logging
import crewai_rust

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_basic_functionality():
    logger.info("Testing basic functionality...")
    
    # Create an agent
    try:
        agent = crewai_rust.Agent(name="Alice", role="Researcher", expertise="AI")
        logger.info(f"Created agent: {agent.name}, role: {agent.role}")
        
        # Create a task
        task = crewai_rust.Task(
            id=1, 
            description="Research latest AI trends", 
            expected_output="Report", 
            agent_name="Alice"
        )
        logger.info(f"Created task: {task.id}, description: {task.description}")
        
        # Create a crew
        crew = crewai_rust.Crew(name="Research Team", process="sequential")
        crew.add_agent(agent)
        crew.add_task(task)
        logger.info(f"Created crew: {crew}")
        
        # Validate crew
        crew.validate()
        logger.info("Crew validation successful")
        
        logger.info("Basic functionality test passed!")
        return True
    except Exception as e:
        logger.error(f"Error in basic functionality test: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting simple test...")
    test_basic_functionality()
    logger.info("Test completed!") 