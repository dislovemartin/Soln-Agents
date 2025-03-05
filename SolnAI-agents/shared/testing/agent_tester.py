"""
Agent testing utilities for SolnAI agents.

This module provides tools for testing agent implementations to ensure
they meet the required standards and functionality.
"""

import os
import json
import httpx
import pytest
from typing import Dict, Any, List, Optional
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class AgentTester:
    """
    Utility class for testing SolnAI agents.
    
    This class provides methods for sending test requests to agents
    and validating their responses.
    
    Attributes:
        base_url: Base URL of the agent API
        api_token: API token for authentication
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:8001",
        api_token: Optional[str] = None
    ):
        """
        Initialize the agent tester.
        
        Args:
            base_url: Base URL of the agent API
            api_token: API token for authentication
        """
        self.base_url = base_url
        self.api_token = api_token or os.getenv("API_BEARER_TOKEN")
        
        if not self.api_token:
            raise ValueError("API_BEARER_TOKEN environment variable not set")
    
    async def test_health(self) -> Dict[str, Any]:
        """
        Test the agent's health endpoint.
        
        Returns:
            Dict[str, Any]: The health check response
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/health")
            return response.json()
    
    async def test_info(self) -> Dict[str, Any]:
        """
        Test the agent's info endpoint.
        
        Returns:
            Dict[str, Any]: The agent info response
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/")
            return response.json()
    
    async def send_request(
        self,
        query: str,
        user_id: str = "test_user",
        request_id: str = "test_request",
        session_id: str = "test_session",
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send a test request to the agent.
        
        Args:
            query: The query to send
            user_id: User ID
            request_id: Request ID
            session_id: Session ID
            parameters: Optional additional parameters
            
        Returns:
            Dict[str, Any]: The agent response
        """
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query": query,
            "user_id": user_id,
            "request_id": request_id,
            "session_id": session_id
        }
        
        if parameters:
            payload["parameters"] = parameters
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/process",
                headers=headers,
                json=payload
            )
            
            return response.json()
    
    async def run_test_suite(
        self,
        test_cases: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Run a suite of test cases against the agent.
        
        Args:
            test_cases: List of test case objects with 'query' and optional 'expected' fields
            
        Returns:
            List[Dict[str, Any]]: Test results for each test case
        """
        results = []
        
        for i, test_case in enumerate(test_cases):
            query = test_case["query"]
            expected = test_case.get("expected")
            parameters = test_case.get("parameters")
            
            logger.info(f"Running test case {i+1}/{len(test_cases)}: {query}")
            
            try:
                response = await self.send_request(
                    query=query,
                    session_id=f"test_session_{i}",
                    parameters=parameters
                )
                
                # Check if response matches expected output if provided
                passed = True
                reason = None
                
                if expected:
                    if isinstance(expected, dict):
                        # Check if expected keys match
                        for key, value in expected.items():
                            if key not in response or response[key] != value:
                                passed = False
                                reason = f"Expected {key}={value}, got {response.get(key)}"
                                break
                    else:
                        # Assume expected is a string to match against output
                        if response.get("output") != expected:
                            passed = False
                            reason = f"Expected output '{expected}', got '{response.get('output')}'"
                
                results.append({
                    "test_case": test_case,
                    "response": response,
                    "passed": passed,
                    "reason": reason
                })
                
            except Exception as e:
                results.append({
                    "test_case": test_case,
                    "error": str(e),
                    "passed": False,
                    "reason": f"Exception: {str(e)}"
                })
        
        return results
    
    def print_test_results(self, results: List[Dict[str, Any]]):
        """
        Print test results in a readable format.
        
        Args:
            results: List of test results from run_test_suite
        """
        total = len(results)
        passed = sum(1 for r in results if r["passed"])
        
        print(f"\n=== Test Results: {passed}/{total} passed ===\n")
        
        for i, result in enumerate(results):
            status = "✅ PASSED" if result["passed"] else "❌ FAILED"
            query = result["test_case"]["query"]
            
            print(f"Test {i+1}: {status}")
            print(f"Query: {query}")
            
            if not result["passed"]:
                if "error" in result:
                    print(f"Error: {result['error']}")
                elif "reason" in result:
                    print(f"Reason: {result['reason']}")
            
            print("")
