"""
Tests for the AgentTester utility.

This module contains tests for the AgentTester utility to ensure it functions correctly.
"""

import os
import sys
import pytest
import asyncio
import httpx
from unittest.mock import patch, AsyncMock

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from testing.agent_tester import AgentTester

@pytest.fixture
def agent_tester():
    """Create an AgentTester instance."""
    return AgentTester(
        base_url="http://localhost:8080",
        api_token="test_token"
    )

@pytest.mark.asyncio
async def test_send_request(agent_tester):
    """Test the send_request method."""
    # Mock the httpx.AsyncClient.post method
    with patch("httpx.AsyncClient.post") as mock_post:
        # Set up the mock response
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": True,
            "output": "Test response",
            "data": {"test_key": "test_value"}
        }
        mock_post.return_value = mock_response
        
        # Call the send_request method
        response = await agent_tester.send_request(
            query="Test query",
            user_id="test_user",
            session_id="test_session"
        )
        
        # Check that the post method was called with the correct arguments
        mock_post.assert_called_once()
        call_args = mock_post.call_args[1]
        
        assert call_args["url"] == "http://localhost:8080/process"
        assert call_args["headers"]["Authorization"] == "Bearer test_token"
        assert call_args["json"]["query"] == "Test query"
        assert call_args["json"]["user_id"] == "test_user"
        assert call_args["json"]["session_id"] == "test_session"
        
        # Check the response
        assert response["success"] is True
        assert response["output"] == "Test response"
        assert response["data"]["test_key"] == "test_value"

@pytest.mark.asyncio
async def test_send_request_error(agent_tester):
    """Test the send_request method with an error response."""
    # Mock the httpx.AsyncClient.post method
    with patch("httpx.AsyncClient.post") as mock_post:
        # Set up the mock response for an error
        mock_response = AsyncMock()
        mock_response.status_code = 500
        mock_response.json.return_value = {
            "success": False,
            "output": "Error message",
            "error": "Test error"
        }
        mock_post.return_value = mock_response
        
        # Call the send_request method
        response = await agent_tester.send_request("Test query")
        
        # Check the response
        assert response["success"] is False
        assert response["output"] == "Error message"
        assert response["error"] == "Test error"

@pytest.mark.asyncio
async def test_send_request_connection_error(agent_tester):
    """Test the send_request method with a connection error."""
    # Mock the httpx.AsyncClient.post method to raise an exception
    with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("Connection error")):
        # Call the send_request method
        response = await agent_tester.send_request("Test query")
        
        # Check the response
        assert response["success"] is False
        assert "Connection error" in response["error"]

@pytest.mark.asyncio
async def test_run_test_suite(agent_tester):
    """Test the run_test_suite method."""
    # Mock the send_request method
    with patch.object(agent_tester, "send_request") as mock_send_request:
        # Set up the mock responses
        mock_send_request.side_effect = [
            {"success": True, "output": "Response 1"},
            {"success": True, "output": "Response 2"},
            {"success": False, "output": "Error", "error": "Test error"}
        ]
        
        # Define test cases
        test_cases = [
            {"query": "Test query 1", "expected_contains": "Response"},
            {"query": "Test query 2", "expected_contains": "Response"},
            {"query": "Test query 3", "expected_contains": "Success"}  # This will fail
        ]
        
        # Run the test suite
        results = await agent_tester.run_test_suite(test_cases)
        
        # Check the results
        assert len(results) == 3
        assert results[0]["passed"] is True
        assert results[1]["passed"] is True
        assert results[2]["passed"] is False
        assert "Test error" in results[2]["error"]

if __name__ == "__main__":
    # Run tests
    pytest.main(["-xvs", __file__])
