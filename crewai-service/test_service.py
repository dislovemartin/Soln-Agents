#!/usr/bin/env python3
import requests
import json
import time
import sys
from crewai_service_integration import CrewAIServiceIntegration

def test_crewai_service_direct():
    """Test the CrewAI service directly with HTTP requests."""
    print("Testing CrewAI service using direct HTTP requests...")
    
    # Health check
    try:
        response = requests.get("http://localhost:8001/")
        print(f"Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Error connecting to service: {str(e)}")
        return False
    
    # Prepare a simple workflow
    payload = {
        "name": "test-crew",
        "agents": [
            {
                "name": "Researcher",
                "role": "Research Assistant",
                "goal": "Find comprehensive information on the requested topic",
                "expertise": "Finding information",
                "backstory": "You are an expert researcher who can find and organize information effectively."
            },
            {
                "name": "Writer",
                "role": "Content Writer",
                "goal": "Create clear, concise summaries of complex information",
                "expertise": "Creating summaries",
                "backstory": "You are a talented writer who can create concise, accurate summaries."
            }
        ],
        "tasks": [
            {
                "id": 1,
                "description": "Research the latest developments in quantum computing and summarize key trends.",
                "expected_output": "A comprehensive list of recent quantum computing advancements.",
                "agent_name": "Researcher",
                "priority": 10
            },
            {
                "id": 2,
                "description": "Create a one-paragraph summary based on the research findings.",
                "expected_output": "A concise one-paragraph summary of quantum computing trends.",
                "agent_name": "Writer",
                "priority": 5,
                "dependencies": [1]
            }
        ],
        "execution_mode": "parallel"
    }
    
    # Execute the workflow
    try:
        print("\nSending workflow execution request...")
        start_time = time.time()
        response = requests.post("http://localhost:8001/execute_crew", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            execution_time = time.time() - start_time
            
            print(f"\nWorkflow execution successful! Took {execution_time:.2f} seconds")
            print(f"Reported execution time: {result.get('execution_time', 0):.2f} seconds")
            print(f"Memory usage: {result.get('memory_usage', 0):.2f} MB")
            
            print("\nResult:")
            # Pretty print the result with indentation
            print(json.dumps(result, indent=2))
            
            return True
        else:
            print(f"\nError executing workflow: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"\nError calling service: {str(e)}")
        return False

def test_crewai_service_integration():
    """Test the CrewAI service using the integration library."""
    print("Testing CrewAI service using integration library...")
    
    # Initialize the integration client with custom port
    client = CrewAIServiceIntegration(
        execution_mode="parallel",
        service_url="http://localhost:8001"
    )
    
    # Create agents
    researcher = client.create_agent(
        name="Researcher",
        role="Research Assistant",
        goal="Find comprehensive information on the requested topic",
        expertise="Finding information",
        backstory="You are an expert researcher who can find and organize information effectively."
    )
    
    writer = client.create_agent(
        name="Writer",
        role="Content Writer",
        goal="Create clear, concise summaries of complex information",
        expertise="Creating summaries",
        backstory="You are a talented writer who can create concise, accurate summaries."
    )
    
    # Create tasks
    research_task = client.create_task(
        id=1,
        description="Research the latest developments in quantum computing and summarize key trends.",
        expected_output="A comprehensive list of recent quantum computing advancements.",
        agent_name="Researcher",
        priority=10
    )
    
    summary_task = client.create_task(
        id=2,
        description="Create a one-paragraph summary based on the research findings.",
        expected_output="A concise one-paragraph summary of quantum computing trends.",
        agent_name="Writer",
        priority=5,
        dependencies=[1]
    )
    
    # Execute the workflow
    start_time = time.time()
    result = client.execute_crew(
        crew_name="test-crew-integration",
        agents=[researcher, writer],
        tasks=[research_task, summary_task]
    )
    
    execution_time = time.time() - start_time
    
    if result.get("success", False):
        print(f"\nWorkflow execution successful! Took {execution_time:.2f} seconds")
        print(f"Reported execution time: {result.get('execution_time', 0):.2f} seconds")
        
        print("\nResult:")
        # Pretty print the result with indentation
        print(json.dumps(result, indent=2))
        
        return True
    else:
        print(f"\nError executing workflow: {result.get('error', 'Unknown error')}")
        return False

if __name__ == "__main__":
    # Run both test methods
    print("=== Running direct service test ===")
    direct_success = test_crewai_service_direct()
    
    print("\n=== Running integration library test ===")
    integration_success = test_crewai_service_integration()
    
    # Exit with success if at least one test succeeded
    sys.exit(0 if (direct_success or integration_success) else 1)

