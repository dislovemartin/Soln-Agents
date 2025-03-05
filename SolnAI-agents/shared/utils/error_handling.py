"""
Error handling utilities for SolnAI agents.

This module provides standardized error handling and logging functions
that can be used across different agent implementations to ensure consistent
error reporting and handling.
"""

import logging
import traceback
import sys
import json
from typing import Dict, Any, Optional, Union, List, Callable
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Create logger
logger = logging.getLogger("solnai")

class ErrorDetail(BaseModel):
    """Model for standardized error details."""
    
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    trace: Optional[str] = Field(None, description="Stack trace (only included in development)")

class AgentError(Exception):
    """
    Base exception class for SolnAI agent errors.
    
    This class provides a standardized way to raise and handle errors
    across different agent implementations.
    
    Attributes:
        code: Error code
        message: Error message
        details: Additional error details
        status_code: HTTP status code
    """
    
    def __init__(
        self,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500
    ):
        """
        Initialize the agent error.
        
        Args:
            code: Error code
            message: Error message
            details: Additional error details
            status_code: HTTP status code
        """
        self.code = code
        self.message = message
        self.details = details
        self.status_code = status_code
        super().__init__(message)
    
    def to_dict(self, include_trace: bool = False) -> Dict[str, Any]:
        """
        Convert the error to a dictionary.
        
        Args:
            include_trace: Whether to include the stack trace
            
        Returns:
            Dict[str, Any]: Error details as a dictionary
        """
        error_dict = {
            "code": self.code,
            "message": self.message,
            "details": self.details
        }
        
        if include_trace:
            error_dict["trace"] = traceback.format_exc()
            
        return error_dict

class ConfigurationError(AgentError):
    """Error raised when there's a configuration issue."""
    
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the configuration error.
        
        Args:
            message: Error message
            details: Additional error details
        """
        super().__init__(
            code="CONFIGURATION_ERROR",
            message=message,
            details=details,
            status_code=500
        )

class AuthenticationError(AgentError):
    """Error raised when there's an authentication issue."""
    
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the authentication error.
        
        Args:
            message: Error message
            details: Additional error details
        """
        super().__init__(
            code="AUTHENTICATION_ERROR",
            message=message,
            details=details,
            status_code=401
        )

class DatabaseError(AgentError):
    """Error raised when there's a database issue."""
    
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the database error.
        
        Args:
            message: Error message
            details: Additional error details
        """
        super().__init__(
            code="DATABASE_ERROR",
            message=message,
            details=details,
            status_code=500
        )

class LLMError(AgentError):
    """Error raised when there's an issue with the LLM provider."""
    
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the LLM error.
        
        Args:
            message: Error message
            details: Additional error details
        """
        super().__init__(
            code="LLM_ERROR",
            message=message,
            details=details,
            status_code=500
        )

class ValidationError(AgentError):
    """Error raised when there's a validation issue."""
    
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the validation error.
        
        Args:
            message: Error message
            details: Additional error details
        """
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            details=details,
            status_code=400
        )

def create_error_handler(debug_mode: bool = False) -> Callable:
    """
    Create an error handler for FastAPI applications.
    
    Args:
        debug_mode: Whether to include detailed error information
        
    Returns:
        Callable: Error handler function
    """
    async def handle_exception(request: Request, exc: Exception) -> JSONResponse:
        """
        Handle exceptions and return a standardized error response.
        
        Args:
            request: FastAPI request
            exc: Exception
            
        Returns:
            JSONResponse: Standardized error response
        """
        if isinstance(exc, AgentError):
            # Handle agent-specific errors
            status_code = exc.status_code
            content = exc.to_dict(include_trace=debug_mode)
        elif isinstance(exc, HTTPException):
            # Handle FastAPI HTTP exceptions
            status_code = exc.status_code
            content = {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "details": None
            }
            
            if debug_mode:
                content["trace"] = traceback.format_exc()
        else:
            # Handle generic exceptions
            status_code = 500
            content = {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {"error": str(exc)} if debug_mode else None
            }
            
            if debug_mode:
                content["trace"] = traceback.format_exc()
        
        # Log the error
        logger.error(
            f"Error handling request: {request.method} {request.url.path}",
            extra={
                "status_code": status_code,
                "error_code": content["code"],
                "error_message": content["message"],
                "request_id": request.headers.get("X-Request-ID"),
                "user_id": request.headers.get("X-User-ID")
            }
        )
        
        if debug_mode and "trace" in content:
            logger.error(content["trace"])
        
        return JSONResponse(
            status_code=status_code,
            content={"error": content}
        )
    
    return handle_exception

def setup_exception_handlers(app, debug_mode: bool = False) -> None:
    """
    Set up exception handlers for a FastAPI application.
    
    Args:
        app: FastAPI application
        debug_mode: Whether to include detailed error information
    """
    error_handler = create_error_handler(debug_mode)
    
    # Register handlers for different exception types
    app.add_exception_handler(AgentError, error_handler)
    app.add_exception_handler(HTTPException, error_handler)
    app.add_exception_handler(Exception, error_handler)

def log_request(request: Request) -> None:
    """
    Log an incoming request.
    
    Args:
        request: FastAPI request
    """
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "request_id": request.headers.get("X-Request-ID"),
            "user_id": request.headers.get("X-User-ID"),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("User-Agent")
        }
    )

def log_response(request: Request, response: Any, elapsed_time: float) -> None:
    """
    Log an outgoing response.
    
    Args:
        request: FastAPI request
        response: Response object
        elapsed_time: Request processing time in seconds
    """
    logger.info(
        f"Response: {request.method} {request.url.path} - {getattr(response, 'status_code', 200)} - {elapsed_time:.3f}s",
        extra={
            "request_id": request.headers.get("X-Request-ID"),
            "user_id": request.headers.get("X-User-ID"),
            "status_code": getattr(response, "status_code", 200),
            "elapsed_time": elapsed_time
        }
    )
