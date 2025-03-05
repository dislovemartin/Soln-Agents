"""
Tests for the BaseAgent class.

This module contains tests for the BaseAgent class to ensure it functions correctly.
"""

import os
import sys
import pytest
import asyncio
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_agent import BaseAgent
from types.api import AgentRequest, AgentResponse

class TestAgent(BaseAgent):
    """Test agent implementation for testing the BaseAgent class."""
    
    def __init__(self):
        """Initialize the test agent."""
        super().__init__(
            name="Test Agent",
            description="A test agent for testing the BaseAgent class",
            version="1.0.0",
            enable_cors=True
        )
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process a test request.
        
        Args:
            request: The agent request
            
        Returns:
            AgentResponse: The agent response
        """
        return AgentResponse(
            success=True,
            output=f"Processed: {request.query}",
            data={"request_id": request.request_id}
        )

@pytest.fixture
def test_agent():
    """Create a test agent instance."""
    return TestAgent()

@pytest.fixture
def test_client(test_agent):
    """Create a test client for the test agent."""
    return TestClient(test_agent.app)

def test_root_endpoint(test_client):
    """Test the root endpoint."""
    response = test_client.get("/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Test Agent"
    assert data["description"] == "A test agent for testing the BaseAgent class"
    assert data["version"] == "1.0.0"
    assert data["status"] == "running"

def test_health_endpoint(test_client):
    """Test the health endpoint."""
    response = test_client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"

def test_process_endpoint_unauthorized(test_client):
    """Test the process endpoint without authentication."""
    response = test_client.post(
        "/process",
        json={
            "query": "Test query",
            "user_id": "test_user",
            "request_id": "test_request",
            "session_id": "test_session"
        }
    )
    
    # Should return 403 Forbidden or 401 Unauthorized
    assert response.status_code in (401, 403)

def test_process_endpoint_with_auth(monkeypatch, test_client):
    """Test the process endpoint with authentication."""
    # Mock the verify_token function to always return True
    monkeypatch.setattr(
        "shared.utils.auth.verify_token",
        lambda credentials: True
    )
    
    # Mock the store_message function to do nothing
    monkeypatch.setattr(
        "shared.utils.db.store_message",
        lambda *args, **kwargs: None
    )
    
    response = test_client.post(
        "/process",
        json={
            "query": "Test query",
            "user_id": "test_user",
            "request_id": "test_request",
            "session_id": "test_session"
        },
        headers={"Authorization": "Bearer test_token"}
    )
    
    # Should return 200 OK
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["output"] == "Processed: Test query"
    assert data["data"]["request_id"] == "test_request"

if __name__ == "__main__":
    # Run tests
    pytest.main(["-xvs", __file__])
