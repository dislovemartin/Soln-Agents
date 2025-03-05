"""
Testing utilities for SolnAI agents.

This module provides tools for testing agent implementations, including
mocking dependencies, simulating requests, and validating responses.
"""

import json
import asyncio
import logging
from typing import Dict, Any, Optional, List, Union, Callable, Type
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from pydantic import BaseModel

from ..types.api import AgentRequest, AgentResponse, Message, LLMMessage
from .error_handling import AgentError
from .base_agent import BaseAgent

# Configure logging
logger = logging.getLogger(__name__)

class MockLLMResponse:
    """Mock response from an LLM provider."""
    
    def __init__(self, content: str, model: str = "mock-model"):
        """
        Initialize the mock LLM response.
        
        Args:
            content: Response content
            model: Model name
        """
        self.content = content
        self.model = model
        self.choices = [
            {
                "message": {
                    "role": "assistant",
                    "content": content
                }
            }
        ]

class MockSupabaseClient:
    """Mock Supabase client for testing."""
    
    def __init__(self, messages: Optional[List[Dict[str, Any]]] = None):
        """
        Initialize the mock Supabase client.
        
        Args:
            messages: Optional list of messages to initialize with
        """
        self.messages = messages or []
        self.table = MagicMock()
        self.table.insert.return_value = MagicMock(execute=MagicMock(return_value=None))
        self.table.select.return_value = MagicMock(
            eq=MagicMock(
                return_value=MagicMock(
                    order=MagicMock(
                        return_value=MagicMock(
                            limit=MagicMock(
                                return_value=MagicMock(
                                    execute=MagicMock(
                                        return_value={"data": self.messages}
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    
    def from_(self, table_name: str):
        """Mock from_ method."""
        return self.table

class AgentTester:
    """
    Utility for testing SolnAI agents.
    
    This class provides methods for testing agent implementations, including
    mocking dependencies, simulating requests, and validating responses.
    """
    
    def __init__(
        self,
        agent_class: Type[BaseAgent],
        agent_params: Optional[Dict[str, Any]] = None,
        mock_llm_responses: Optional[Dict[str, str]] = None,
        mock_messages: Optional[List[Dict[str, Any]]] = None
    ):
        """
        Initialize the agent tester.
        
        Args:
            agent_class: Agent class to test
            agent_params: Optional parameters to pass to the agent constructor
            mock_llm_responses: Optional mapping of queries to mock LLM responses
            mock_messages: Optional list of messages to initialize the mock Supabase client with
        """
        self.agent_class = agent_class
        self.agent_params = agent_params or {}
        self.mock_llm_responses = mock_llm_responses or {}
        self.mock_messages = mock_messages or []
        
        # Create agent instance
        self.agent = agent_class(**self.agent_params)
        
        # Create test client
        self.client = TestClient(self.agent.app)
        
        # Set up mocks
        self._setup_mocks()
    
    def _setup_mocks(self):
        """Set up mocks for dependencies."""
        # Mock Supabase client
        self.mock_supabase_client = MockSupabaseClient(self.mock_messages)
        
        # Mock LLM provider
        self.mock_llm = MagicMock()
        self.mock_llm.generate.side_effect = self._mock_llm_generate
        
        # Apply patches
        self.patches = [
            patch("shared.utils.db.get_supabase_client", return_value=self.mock_supabase_client),
            patch("shared.utils.llm.get_llm_provider", return_value=self.mock_llm)
        ]
        
        for p in self.patches:
            p.start()
    
    def _mock_llm_generate(self, messages: List[LLMMessage], **kwargs):
        """
        Mock LLM generate method.
        
        Args:
            messages: List of messages
            **kwargs: Additional arguments
            
        Returns:
            MockLLMResponse: Mock response
        """
        # Get the last user message
        user_messages = [m for m in messages if m.role == "user"]
        if not user_messages:
            return MockLLMResponse("I don't understand your request.")
        
        last_user_message = user_messages[-1].content
        
        # Check if we have a mock response for this query
        for query, response in self.mock_llm_responses.items():
            if query.lower() in last_user_message.lower():
                return MockLLMResponse(response)
        
        # Default response
        return MockLLMResponse("This is a mock response from the LLM provider.")
    
    def cleanup(self):
        """Clean up patches."""
        for p in self.patches:
            p.stop()
    
    def create_request(
        self,
        query: str,
        user_id: str = "test-user",
        session_id: Optional[str] = None,
        request_id: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> AgentRequest:
        """
        Create a test request.
        
        Args:
            query: User query
            user_id: User ID
            session_id: Session ID (defaults to user_id if not provided)
            request_id: Request ID
            parameters: Optional parameters
            
        Returns:
            AgentRequest: Test request
        """
        return AgentRequest(
            query=query,
            user_id=user_id,
            request_id=request_id or "test-request",
            session_id=session_id or user_id,
            parameters=parameters
        )
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a request directly through the agent.
        
        Args:
            request: Agent request
            
        Returns:
            AgentResponse: Agent response
        """
        return await self.agent.process_request(request)
    
    def test_endpoint(
        self,
        endpoint: str,
        method: str = "GET",
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Any:
        """
        Test an endpoint directly.
        
        Args:
            endpoint: Endpoint to test
            method: HTTP method
            json_data: JSON data to send
            headers: HTTP headers
            
        Returns:
            Any: Response from the endpoint
        """
        headers = headers or {"Authorization": "Bearer test-token"}
        
        if method.upper() == "GET":
            return self.client.get(endpoint, headers=headers)
        elif method.upper() == "POST":
            return self.client.post(endpoint, json=json_data, headers=headers)
        elif method.upper() == "PUT":
            return self.client.put(endpoint, json=json_data, headers=headers)
        elif method.upper() == "DELETE":
            return self.client.delete(endpoint, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
    
    def test_process_endpoint(self, request: AgentRequest) -> AgentResponse:
        """
        Test the /process endpoint.
        
        Args:
            request: Agent request
            
        Returns:
            AgentResponse: Agent response
        """
        response = self.client.post(
            "/process",
            json=request.dict(),
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Check if the response is valid
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}: {response.text}"
        
        # Parse the response
        return AgentResponse(**response.json())
    
    def run_test_case(
        self,
        query: str,
        expected_contains: Optional[List[str]] = None,
        expected_not_contains: Optional[List[str]] = None,
        expected_success: bool = True,
        parameters: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        Run a test case.
        
        Args:
            query: User query
            expected_contains: List of strings that should be in the response
            expected_not_contains: List of strings that should not be in the response
            expected_success: Whether the response should be successful
            parameters: Optional parameters
            
        Returns:
            AgentResponse: Agent response
        """
        # Create request
        request = self.create_request(query, parameters=parameters)
        
        # Process request
        response = self.test_process_endpoint(request)
        
        # Validate response
        assert response.success == expected_success, f"Expected success={expected_success}, got {response.success}"
        
        if expected_contains:
            for text in expected_contains:
                assert text.lower() in response.output.lower(), f"Expected response to contain '{text}', but got: {response.output}"
        
        if expected_not_contains:
            for text in expected_not_contains:
                assert text.lower() not in response.output.lower(), f"Expected response not to contain '{text}', but got: {response.output}"
        
        return response
    
    def run_test_suite(self, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Run a test suite.
        
        Args:
            test_cases: List of test cases
            
        Returns:
            Dict[str, Any]: Test results
        """
        results = {
            "total": len(test_cases),
            "passed": 0,
            "failed": 0,
            "details": []
        }
        
        for i, test_case in enumerate(test_cases):
            try:
                # Extract test case parameters
                query = test_case["query"]
                expected_contains = test_case.get("expected_contains")
                expected_not_contains = test_case.get("expected_not_contains")
                expected_success = test_case.get("expected_success", True)
                parameters = test_case.get("parameters")
                
                # Run test case
                response = self.run_test_case(
                    query,
                    expected_contains,
                    expected_not_contains,
                    expected_success,
                    parameters
                )
                
                # Record success
                results["passed"] += 1
                results["details"].append({
                    "test_case": i + 1,
                    "query": query,
                    "status": "passed",
                    "response": response.dict()
                })
                
            except Exception as e:
                # Record failure
                results["failed"] += 1
                results["details"].append({
                    "test_case": i + 1,
                    "query": test_case["query"],
                    "status": "failed",
                    "error": str(e)
                })
        
        return results


# Example usage
if __name__ == "__main__":
    # This is just an example and won't be executed when importing the module
    from shared.utils.base_agent import BaseAgent
    
    class TestAgent(BaseAgent):
        async def process_request(self, request: AgentRequest) -> AgentResponse:
            return AgentResponse(
                success=True,
                output=f"Processed: {request.query}",
                data={"processed": True}
            )
    
    # Create tester
    tester = AgentTester(
        agent_class=TestAgent,
        agent_params={"name": "Test Agent", "description": "Test agent for testing"},
        mock_llm_responses={
            "hello": "Hello, how can I help you?",
            "weather": "The weather is sunny today."
        }
    )
    
    # Run test cases
    results = tester.run_test_suite([
        {
            "query": "Hello, agent!",
            "expected_contains": ["Processed", "Hello"]
        },
        {
            "query": "What's the weather like?",
            "expected_contains": ["Processed", "weather"]
        }
    ])
    
    print(json.dumps(results, indent=2))
    
    # Clean up
    tester.cleanup()
