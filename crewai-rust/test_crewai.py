import crewai_rust
import logging
import time
import sys
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_basic_functionality():
    try:
        logger.info("Creating agent...")
        agent = crewai_rust.Agent(name="Alice", role="Researcher", expertise="AI")
        
        logger.info("Creating task...")
        task = crewai_rust.Task(id=1, description="Research AI trends", 
                               expected_output="Report", agent_name="Alice")
        
        logger.info("Creating crew...")
        crew = crewai_rust.Crew(name="My Crew", process="sequential")

        crew.add_agent(agent)
        crew.add_task(task)

        logger.info(f"Agent name from Python: {agent.name}")
        agent.name = "Alice Updated"
        logger.info(f"Agent name after update: {agent.name}")
        logger.info(f"Agent role from Python: {agent.role}")
        logger.info(f"Agent expertise from Python: {agent.expertise}")
        logger.info(f"Agent description: {agent.describe_role()}")

        logger.info("\n--- Running tasks sequentially from Python ---")
        crew.execute_sequential()

        logger.info("\n--- Running tasks parallel Rayon from Python ---")
        crew.execute_parallel_rayon()

        logger.info("\n--- Running tasks concurrent Tokio from Python ---")
        crew.execute_concurrent_tokio()
        
        return True
    except Exception as e:
        logger.error(f"Error in basic functionality test: {e}")
        return False

async def test_async_functionality():
    try:
        logger.info("\n--- Testing async functionality ---")
        
        agent = crewai_rust.Agent(name="Bob", role="Developer", expertise="Rust")
        task = crewai_rust.Task(id=2, description="Develop async code", 
                               expected_output="Code", agent_name="Bob")
        crew = crewai_rust.Crew(name="Async Crew", process="async")
        
        crew.add_agent(agent)
        crew.add_task(task)
        
        logger.info("Running with execute_concurrent_tokio_async...")
        await crew.execute_concurrent_tokio_async()
        
        logger.info("Running with execute_async...")
        await crew.execute_async()
        
        return True
    except Exception as e:
        logger.error(f"Error in async functionality test: {e}")
        return False

def test_yaml_loading():
    try:
        logger.info("\n--- Loading Crew from YAML via Python ---")
        yaml_content = """
        name: "YAML Crew"
        agents:
          - name: "Yaml Agent"
            role: "Yaml Role"
        tasks:
          - id: 1
            description: "Yaml Task"
            expected_output: "Yaml Output"
            agent_name: "Yaml Agent"
        process: "sequential"
        """
        with open("test_config.yaml", "w") as f:
            f.write(yaml_content)
        
        # Pre-check YAML validity
        if not crewai_rust.is_valid_yaml(yaml_content):
            logger.error("Invalid YAML detected before loading")
            return False
            
        yaml_crew = crewai_rust.Crew.load_from_yaml("test_config.yaml")
        logger.info(f"Loaded crew from YAML successfully")
        return True
    except Exception as e:
        logger.error(f"Error in YAML loading test: {e}")
        return False

def test_error_handling():
    logger.info("\n--- Testing Error Handling ---")
    
    # Test invalid agent creation
    try:
        agent = crewai_rust.Agent(name="", role="Researcher", expertise="AI")
        logger.error("ERROR: Should have failed with empty name")
        return False
    except ValueError as e:
        logger.info(f"Correctly caught error: {e}")
    
    # Test invalid task creation
    try:
        task = crewai_rust.Task(id=1, description="", 
                               expected_output="Report", agent_name="Alice")
        logger.error("ERROR: Should have failed with empty description")
        return False
    except ValueError as e:
        logger.info(f"Correctly caught error: {e}")
    
    # Test invalid crew creation
    try:
        crew = crewai_rust.Crew(name="Test Crew", process="invalid_process")
        logger.error("ERROR: Should have failed with invalid process")
        return False
    except ValueError as e:
        logger.info(f"Correctly caught error: {e}")
    
    # Test invalid YAML
    try:
        invalid_yaml = """
        name: "Invalid Crew"
        agents:
          - name: "Agent 1"
            role: "Role 1"
        tasks:
          - id: 1
            description: "Task 1"
            expected_output: "Output"
            agent_name: "Non-existent Agent"  # This agent doesn't exist
        process: "sequential"
        """
        
        if crewai_rust.is_valid_yaml(invalid_yaml):
            logger.error("ERROR: is_valid_yaml should have returned False")
            return False
        else:
            logger.info("Correctly identified invalid YAML")
        
        with open("invalid_config.yaml", "w") as f:
            f.write(invalid_yaml)
            
        try:
            yaml_crew = crewai_rust.Crew.load_from_yaml("invalid_config.yaml")
            logger.error("ERROR: Should have failed with invalid YAML")
            return False
        except ValueError as e:
            logger.info(f"Correctly caught error: {e}")
    except Exception as e:
        logger.info(f"Correctly caught error: {e}")
    
    return True

def run_benchmarks():
    logger.info("\n--- Benchmarking Rust CrewAI from Python ---")
    
    agent = crewai_rust.Agent(name="Alice", role="Researcher", expertise="AI")
    
    # Create more tasks for meaningful benchmarking
    tasks = []
    for i in range(10):
        task = crewai_rust.Task(id=i, description=f"Task {i}", 
                               expected_output="Output", agent_name="Alice")
        tasks.append(task)
    
    crew = crewai_rust.Crew(name="Benchmark Crew", process="sequential")
    crew.add_agent(agent)
    
    for task in tasks:
        crew.add_task(task)
    
    start_time = time.time()
    execution_time_rust = crew.benchmark_sequential_tasks()
    end_time = time.time()
    python_overhead_time = end_time - start_time - execution_time_rust

    logger.info(f"Rust Task Execution Time: {execution_time_rust:.4f} seconds")
    logger.info(f"Python Overhead Time (estimated): {python_overhead_time:.4f} seconds")
    logger.info(f"Total Time (Python + Rust): {end_time - start_time:.4f} seconds")
    memory_usage_kb = crew.get_memory_usage()
    logger.info(f"Memory Usage: {memory_usage_kb / 1024:.2f} MB")
    
    return True

async def run_all_tests():
    success = True
    
    logger.info("=== Running Basic Functionality Test ===")
    success = test_basic_functionality() and success
    
    logger.info("\n=== Running Async Functionality Test ===")
    success = await test_async_functionality() and success
    
    logger.info("\n=== Running YAML Loading Test ===")
    success = test_yaml_loading() and success
    
    logger.info("\n=== Running Error Handling Test ===")
    success = test_error_handling() and success
    
    logger.info("\n=== Running Benchmarks ===")
    success = run_benchmarks() and success
    
    logger.info("\n=== Test Summary ===")
    logger.info("All tests passed!" if success else "Some tests failed!")
    
    return 0 if success else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(run_all_tests())
        sys.exit(exit_code)
    except Exception as e:
        logger.error(f"Error running tests: {e}")
        sys.exit(1) 