"""
Test framework for testing custom agents.

This module provides common utilities and base classes for testing custom agents.
"""

import os
import sys
import pytest
import asyncio
from typing import Dict, Any, Optional
from pydantic import BaseModel

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_agent import BaseAgent
from types.api import AgentRequest, AgentResponse

class AgentTestCase:
    """Base class for agent tests."""
    
    def __init__(self, agent_class: type, agent_params: Dict[str, Any] = None):
        """
        Initialize the test case with the agent class to test.
        
        Args:
            agent_class: The agent class to test
            agent_params: Optional parameters to pass to the agent constructor
        """
        self.agent_class = agent_class
        self.agent_params = agent_params or {}
        self.agent = None
        
    def setup(self):
        """Set up the test environment."""
        self.agent = self.agent_class(**self.agent_params)
        
    def teardown(self):
        """Clean up the test environment."""
        self.agent = None
        
    async def test_process_request(self, request_data: Dict[str, Any]) -> AgentResponse:
        """
        Test the agent's process_request method.
        
        Args:
            request_data: The request data to send to the agent
            
        Returns:
            AgentResponse: The response from the agent
        """
        if not self.agent:
            self.setup()
            
        request = AgentRequest(**request_data)
        response = await self.agent.process_request(request)
        return response
    
    async def run_test_case(self, test_case_name: str, request_data: Dict[str, Any], 
                           expected_output: Optional[str] = None, 
                           expected_success: bool = True,
                           expected_data: Optional[Dict[str, Any]] = None) -> bool:
        """
        Run a test case and check if the response matches the expected output.
        
        Args:
            test_case_name: Name of the test case
            request_data: The request data to send to the agent
            expected_output: Optional expected output string
            expected_success: Expected success state
            expected_data: Optional expected data dictionary
            
        Returns:
            bool: True if the test passed, False otherwise
        """
        print(f"Running test case: {test_case_name}")
        
        try:
            response = await self.test_process_request(request_data)
            
            # Check if success matches expected
            if response.success != expected_success:
                print(f"❌ Test failed: Expected success={expected_success}, got {response.success}")
                return False
                
            # Check if output matches expected (if provided)
            if expected_output is not None and response.output != expected_output:
                print(f"❌ Test failed: Expected output '{expected_output}', got '{response.output}'")
                return False
            
            # Check if data matches expected (if provided)
            if expected_data is not None:
                for key, value in expected_data.items():
                    if key not in response.data or response.data[key] != value:
                        print(f"❌ Test failed: Expected data[{key}]={value}, got {response.data.get(key, 'missing')}")
                        return False
            
            print(f"✅ Test passed: {test_case_name}")
            return True
            
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            return False
    
    async def run_all_test_cases(self, test_cases: Dict[str, Dict[str, Any]]) -> Dict[str, bool]:
        """
        Run all provided test cases.
        
        Args:
            test_cases: Dictionary of test cases to run
            
        Returns:
            Dict[str, bool]: Dictionary of test results
        """
        results = {}
        
        for name, case in test_cases.items():
            request_data = case.get('request_data', {})
            expected_output = case.get('expected_output')
            expected_success = case.get('expected_success', True)
            expected_data = case.get('expected_data')
            
            results[name] = await self.run_test_case(
                name, 
                request_data, 
                expected_output, 
                expected_success, 
                expected_data
            )
            
        # Summarize results
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        print(f"\nTest Summary: {passed}/{total} tests passed")
        
        return results

def run_agent_tests(agent_class: type, test_cases: Dict[str, Dict[str, Any]], 
                   agent_params: Dict[str, Any] = None) -> Dict[str, bool]:
    """
    Helper function to run agent tests.
    
    Args:
        agent_class: The agent class to test
        test_cases: Dictionary of test cases to run
        agent_params: Optional parameters to pass to the agent constructor
        
    Returns:
        Dict[str, bool]: Dictionary of test results
    """
    test_case = AgentTestCase(agent_class, agent_params)
    loop = asyncio.get_event_loop()
    results = loop.run_until_complete(test_case.run_all_test_cases(test_cases))
    test_case.teardown()
    return results

# Example usage
if __name__ == "__main__":
    # Example agent class for testing
    class TestAgent(BaseAgent):
        """Test agent for demonstration."""
        
        def __init__(self):
            """Initialize the test agent."""
            super().__init__(
                name="Test Agent",
                description="A test agent for demonstration",
                version="1.0.0"
            )
        
        async def process_request(self, request: AgentRequest) -> AgentResponse:
            """Process the request."""
            if request.query == "fail":
                return AgentResponse(
                    success=False,
                    output="Error: Test failure",
                    data={"error": "Test error"}
                )
                
            return AgentResponse(
                success=True,
                output=f"Processed: {request.query}",
                data={"request_id": request.request_id}
            )
    
    # Example test cases
    test_cases = {
        "successful_request": {
            "request_data": {
                "query": "hello",
                "user_id": "test_user",
                "request_id": "test_request",
                "session_id": "test_session"
            },
            "expected_output": "Processed: hello",
            "expected_data": {"request_id": "test_request"}
        },
        "failed_request": {
            "request_data": {
                "query": "fail",
                "user_id": "test_user",
                "request_id": "test_request",
                "session_id": "test_session"
            },
            "expected_success": False,
            "expected_output": "Error: Test failure",
            "expected_data": {"error": "Test error"}
        }
    }
    
    # Run the tests
    results = run_agent_tests(TestAgent, test_cases)