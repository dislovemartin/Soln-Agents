"""
Authentication utilities for SolnAI agents.

This module provides standardized authentication functions that can be used
across different agent implementations to ensure consistent security practices.
"""

from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import os
from typing import Optional

# Initialize security
security = HTTPBearer()

def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
    token_env_var: str = "API_BEARER_TOKEN"
) -> bool:
    """
    Verify the bearer token against an environment variable.
    
    Args:
        credentials: The HTTP authorization credentials from the request
        token_env_var: The name of the environment variable containing the expected token
        
    Returns:
        bool: True if the token is valid
        
    Raises:
        HTTPException: If the token is missing or invalid
    """
    expected_token = os.getenv(token_env_var)
    
    if not expected_token:
        raise HTTPException(
            status_code=500,
            detail=f"{token_env_var} environment variable not set"
        )
        
    if credentials.credentials != expected_token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
        
    return True
