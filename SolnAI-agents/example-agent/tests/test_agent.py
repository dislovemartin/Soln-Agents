"""
Tests for the example agent.

This module demonstrates how to use the AgentTester utility to test
agent functionality.
"""

import os
import sys
import pytest
import asyncio
from dotenv import load_dotenv

# Add parent directories to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.testing.agent_tester import AgentTester

# Load environment variables
load_dotenv()

# Test cases
TEST_CASES = [
    {
        "query": "Hello, how are you?",
        "expected": {
            "success": True
        }
    },
    {
        "query": "What is the capital of France?",
        "expected": {
            "success": True
        }
    },
    {
        "query": "Tell me a joke",
        "expected": {
            "success": True
        }
    }
]

@pytest.mark.asyncio
async def test_agent_health():
    """Test the agent's health endpoint."""
    # Skip test if agent is not running
    if not is_agent_running():
        pytest.skip("Agent is not running")
    
    tester = AgentTester()
    response = await tester.test_health()
    
    assert response["status"] == "healthy"

@pytest.mark.asyncio
async def test_agent_info():
    """Test the agent's info endpoint."""
    # Skip test if agent is not running
    if not is_agent_running():
        pytest.skip("Agent is not running")
    
    tester = AgentTester()
    response = await tester.test_info()
    
    assert "name" in response
    assert "version" in response
    assert "status" in response
    assert response["status"] == "running"

@pytest.mark.asyncio
async def test_agent_process():
    """Test the agent's process endpoint with various queries."""
    # Skip test if agent is not running
    if not is_agent_running():
        pytest.skip("Agent is not running")
    
    tester = AgentTester()
    results = await tester.run_test_suite(TEST_CASES)
    
    # Print results for debugging
    tester.print_test_results(results)
    
    # Check if all tests passed
    assert all(result["passed"] for result in results)

def is_agent_running():
    """Check if the agent is running."""
    import httpx
    
    try:
        response = httpx.get("http://localhost:8001/health", timeout=2)
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    # Run tests
    asyncio.run(test_agent_health())
    asyncio.run(test_agent_info())
    asyncio.run(test_agent_process())
