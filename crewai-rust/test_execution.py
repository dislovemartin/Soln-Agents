#!/usr/bin/env python3
import logging
import asyncio
import crewai_rust

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_sequential_execution():
    logger.info("Testing sequential execution...")
    
    try:
        # Create an agent
        agent = crewai_rust.Agent(name="Alice", role="Researcher", expertise="AI")
        
        # Create tasks
        task1 = crewai_rust.Task(
            id=1, 
            description="Research task 1", 
            expected_output="Report 1", 
            agent_name="Alice"
        )
        
        task2 = crewai_rust.Task(
            id=2, 
            description="Research task 2", 
            expected_output="Report 2", 
            agent_name="Alice"
        )
        
        # Create a crew
        crew = crewai_rust.Crew(name="Research Team", process="sequential")
        crew.add_agent(agent)
        crew.add_task(task1)
        crew.add_task(task2)
        
        # Execute tasks sequentially
        logger.info("Executing tasks sequentially...")
        crew.execute_sequential()
        logger.info("Sequential execution completed!")
        
        return True
    except Exception as e:
        logger.error(f"Error in sequential execution test: {e}")
        return False

def test_parallel_execution():
    logger.info("Testing parallel execution...")
    
    try:
        # Create an agent
        agent = crewai_rust.Agent(name="Bob", role="Developer", expertise="Rust")
        
        # Create tasks
        task1 = crewai_rust.Task(
            id=1, 
            description="Development task 1", 
            expected_output="Code 1", 
            agent_name="Bob"
        )
        
        task2 = crewai_rust.Task(
            id=2, 
            description="Development task 2", 
            expected_output="Code 2", 
            agent_name="Bob"
        )
        
        # Create a crew
        crew = crewai_rust.Crew(name="Development Team", process="parallel")
        crew.add_agent(agent)
        crew.add_task(task1)
        crew.add_task(task2)
        
        # Execute tasks in parallel
        logger.info("Executing tasks in parallel...")
        crew.execute_parallel_rayon()
        logger.info("Parallel execution completed!")
        
        return True
    except Exception as e:
        logger.error(f"Error in parallel execution test: {e}")
        return False

async def test_async_execution():
    logger.info("Testing async execution...")
    
    try:
        # Create an agent
        agent = crewai_rust.Agent(name="Charlie", role="Designer", expertise="UI/UX")
        
        # Create tasks
        task1 = crewai_rust.Task(
            id=1, 
            description="Design task 1", 
            expected_output="Design 1", 
            agent_name="Charlie"
        )
        
        task2 = crewai_rust.Task(
            id=2, 
            description="Design task 2", 
            expected_output="Design 2", 
            agent_name="Charlie"
        )
        
        # Create a crew
        crew = crewai_rust.Crew(name="Design Team", process="async")
        crew.add_agent(agent)
        crew.add_task(task1)
        crew.add_task(task2)
        
        # Execute tasks asynchronously
        logger.info("Executing tasks asynchronously...")
        await crew.execute_concurrent_tokio_async()
        logger.info("Async execution completed!")
        
        return True
    except Exception as e:
        logger.error(f"Error in async execution test: {e}")
        return False

def test_benchmarking():
    logger.info("Testing benchmarking...")
    
    try:
        # Create an agent
        agent = crewai_rust.Agent(name="Dave", role="Analyst", expertise="Data")
        
        # Create tasks
        task = crewai_rust.Task(
            id=1, 
            description="Analysis task", 
            expected_output="Analysis report", 
            agent_name="Dave"
        )
        
        # Create a crew
        crew = crewai_rust.Crew(name="Analysis Team", process="sequential")
        crew.add_agent(agent)
        crew.add_task(task)
        
        # Benchmark execution
        logger.info("Benchmarking sequential execution...")
        execution_time = crew.benchmark_sequential_tasks()
        logger.info(f"Execution time: {execution_time:.4f} seconds")
        
        # Get memory usage
        memory_usage = crew.get_memory_usage()
        logger.info(f"Memory usage: {memory_usage / 1024 / 1024:.2f} MB")
        
        return True
    except Exception as e:
        logger.error(f"Error in benchmarking test: {e}")
        return False

async def run_all_tests():
    logger.info("Running all tests...")
    
    # Run sequential execution test
    sequential_result = test_sequential_execution()
    
    # Run parallel execution test
    parallel_result = test_parallel_execution()
    
    # Run async execution test
    async_result = await test_async_execution()
    
    # Run benchmarking test
    benchmark_result = test_benchmarking()
    
    # Print summary
    logger.info("Test results:")
    logger.info(f"Sequential execution: {'PASSED' if sequential_result else 'FAILED'}")
    logger.info(f"Parallel execution: {'PASSED' if parallel_result else 'FAILED'}")
    logger.info(f"Async execution: {'PASSED' if async_result else 'FAILED'}")
    logger.info(f"Benchmarking: {'PASSED' if benchmark_result else 'FAILED'}")
    
    return sequential_result and parallel_result and async_result and benchmark_result

if __name__ == "__main__":
    logger.info("Starting execution tests...")
    asyncio.run(run_all_tests())
    logger.info("All tests completed!") 