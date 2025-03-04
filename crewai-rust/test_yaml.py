#!/usr/bin/env python3
import logging
import crewai_rust

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_yaml_loading():
    logger.info("Testing YAML loading...")
    
    try:
        # Check if YAML is valid
        with open("crew_config.yaml", "r") as f:
            yaml_str = f.read()
        
        is_valid = crewai_rust.is_valid_yaml(yaml_str)
        logger.info(f"YAML validation: {'PASSED' if is_valid else 'FAILED'}")
        
        if not is_valid:
            return False
        
        # Load crew from YAML
        crew = crewai_rust.Crew.load_from_yaml("crew_config.yaml")
        logger.info(f"Loaded crew: {crew}")
        
        # Validate crew
        crew.validate()
        logger.info("Crew validation successful")
        
        # Execute tasks
        logger.info("Executing tasks from YAML configuration...")
        crew.execute_sequential()
        logger.info("Execution completed!")
        
        return True
    except Exception as e:
        logger.error(f"Error in YAML loading test: {e}")
        return False

def test_invalid_yaml():
    logger.info("Testing invalid YAML handling...")
    
    try:
        # Create invalid YAML
        invalid_yaml = """
        name: "Invalid Crew"
        agents:
          - name: "Missing Role"
        tasks:
          - id: 1
            description: "Invalid task"
        process: "sequential"
        """
        
        # Check if YAML is valid
        is_valid = crewai_rust.is_valid_yaml(invalid_yaml)
        logger.info(f"Invalid YAML validation: {'FAILED' if not is_valid else 'PASSED (should be invalid)'}")
        
        if is_valid:
            logger.error("ERROR: Invalid YAML was considered valid")
            return False
        
        logger.info("Invalid YAML handling test passed!")
        return True
    except Exception as e:
        logger.error(f"Error in invalid YAML test: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting YAML tests...")
    
    valid_yaml_result = test_yaml_loading()
    invalid_yaml_result = test_invalid_yaml()
    
    logger.info("Test results:")
    logger.info(f"Valid YAML loading: {'PASSED' if valid_yaml_result else 'FAILED'}")
    logger.info(f"Invalid YAML handling: {'PASSED' if invalid_yaml_result else 'FAILED'}")
    
    logger.info("YAML tests completed!") 