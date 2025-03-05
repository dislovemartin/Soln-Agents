"""
Middleware components for SolnAI agents.

This module provides middleware components that can be used to add
cross-cutting functionality to agent endpoints, such as request logging,
authentication, rate limiting, etc.
"""

import time
import uuid
import logging
from typing import Callable, Dict, Any, Optional, List, Union, Awaitable
from fastapi import Request, Response, FastAPI
from fastapi.middleware.base import BaseHTTPMiddleware

from ..utils.error_handling import log_request, log_response, AgentError, AuthenticationError
from ..config.config import get_config

# Configure logging
logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging requests and responses."""
    
    async def dispatch(self, request: Request, call_next):
        """
        Process the request and log details.
        
        Args:
            request: FastAPI request
            call_next: Next middleware or endpoint
            
        Returns:
            Response: FastAPI response
        """
        # Generate request ID if not present
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Add request ID to request state
        request.state.request_id = request_id
        
        # Log the request
        log_request(request)
        
        # Record start time
        start_time = time.time()
        
        # Process the request
        try:
            response = await call_next(request)
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
        except Exception as e:
            # Log the error
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            
            # Re-raise the exception to be handled by exception handlers
            raise
        
        finally:
            # Calculate elapsed time
            elapsed_time = time.time() - start_time
            
            # Add elapsed time to response headers
            if 'response' in locals():
                response.headers["X-Response-Time"] = f"{elapsed_time:.3f}s"
                
                # Log the response
                log_response(request, response, elapsed_time)
        
        return response

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""
    
    def __init__(
        self,
        app: FastAPI,
        rate_limit_per_minute: int = 60,
        rate_limit_window_seconds: int = 60,
        exclude_paths: Optional[List[str]] = None
    ):
        """
        Initialize the rate limiting middleware.
        
        Args:
            app: FastAPI application
            rate_limit_per_minute: Maximum number of requests per minute
            rate_limit_window_seconds: Window size in seconds
            exclude_paths: Paths to exclude from rate limiting
        """
        super().__init__(app)
        self.rate_limit_per_minute = rate_limit_per_minute
        self.rate_limit_window_seconds = rate_limit_window_seconds
        self.exclude_paths = exclude_paths or ["/health", "/metrics"]
        self.request_counts = {}
    
    async def dispatch(self, request: Request, call_next):
        """
        Process the request and apply rate limiting.
        
        Args:
            request: FastAPI request
            call_next: Next middleware or endpoint
            
        Returns:
            Response: FastAPI response
        """
        # Skip rate limiting for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        # Get client IP and user ID
        client_ip = request.client.host if request.client else "unknown"
        user_id = request.headers.get("X-User-ID", "anonymous")
        
        # Create a key for the client
        client_key = f"{user_id}:{client_ip}"
        
        # Get current time
        current_time = time.time()
        
        # Clean up old entries
        self._cleanup_old_entries(current_time)
        
        # Check if client has exceeded rate limit
        if self._is_rate_limited(client_key, current_time):
            # Return rate limit exceeded response
            return Response(
                content="Rate limit exceeded. Please try again later.",
                status_code=429,
                headers={
                    "X-RateLimit-Limit": str(self.rate_limit_per_minute),
                    "X-RateLimit-Reset": str(int(self._get_reset_time(current_time)))
                }
            )
        
        # Add request to count
        self._add_request(client_key, current_time)
        
        # Process the request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.rate_limit_per_minute - self._get_request_count(client_key, current_time)
        response.headers["X-RateLimit-Limit"] = str(self.rate_limit_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(self._get_reset_time(current_time)))
        
        return response
    
    def _cleanup_old_entries(self, current_time: float):
        """
        Clean up old entries from the request counts.
        
        Args:
            current_time: Current time
        """
        cutoff_time = current_time - self.rate_limit_window_seconds
        
        for client_key in list(self.request_counts.keys()):
            # Filter out timestamps older than the cutoff
            self.request_counts[client_key] = [
                ts for ts in self.request_counts[client_key] if ts > cutoff_time
            ]
            
            # Remove client if no requests
            if not self.request_counts[client_key]:
                del self.request_counts[client_key]
    
    def _is_rate_limited(self, client_key: str, current_time: float) -> bool:
        """
        Check if client has exceeded rate limit.
        
        Args:
            client_key: Client key
            current_time: Current time
            
        Returns:
            bool: Whether client has exceeded rate limit
        """
        return self._get_request_count(client_key, current_time) >= self.rate_limit_per_minute
    
    def _get_request_count(self, client_key: str, current_time: float) -> int:
        """
        Get request count for client.
        
        Args:
            client_key: Client key
            current_time: Current time
            
        Returns:
            int: Request count
        """
        if client_key not in self.request_counts:
            return 0
        
        cutoff_time = current_time - self.rate_limit_window_seconds
        return len([ts for ts in self.request_counts[client_key] if ts > cutoff_time])
    
    def _add_request(self, client_key: str, current_time: float):
        """
        Add request to count.
        
        Args:
            client_key: Client key
            current_time: Current time
        """
        if client_key not in self.request_counts:
            self.request_counts[client_key] = []
        
        self.request_counts[client_key].append(current_time)
    
    def _get_reset_time(self, current_time: float) -> float:
        """
        Get reset time.
        
        Args:
            current_time: Current time
            
        Returns:
            float: Reset time
        """
        return current_time + self.rate_limit_window_seconds

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Middleware for authenticating requests."""
    
    def __init__(
        self,
        app: FastAPI,
        exclude_paths: Optional[List[str]] = None,
        auth_header_name: str = "Authorization",
        auth_scheme: str = "Bearer"
    ):
        """
        Initialize the authentication middleware.
        
        Args:
            app: FastAPI application
            exclude_paths: Paths to exclude from authentication
            auth_header_name: Name of the authentication header
            auth_scheme: Authentication scheme
        """
        super().__init__(app)
        self.exclude_paths = exclude_paths or ["/health", "/metrics", "/"]
        self.auth_header_name = auth_header_name
        self.auth_scheme = auth_scheme
        self.config = get_config()
    
    async def dispatch(self, request: Request, call_next):
        """
        Process the request and authenticate.
        
        Args:
            request: FastAPI request
            call_next: Next middleware or endpoint
            
        Returns:
            Response: FastAPI response
        """
        # Skip authentication for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        # Get authentication header
        auth_header = request.headers.get(self.auth_header_name)
        
        # Check if authentication header is present
        if not auth_header:
            raise AuthenticationError(
                message="Authentication header is missing",
                details={"header_name": self.auth_header_name}
            )
        
        # Check if authentication header has correct scheme
        if not auth_header.startswith(f"{self.auth_scheme} "):
            raise AuthenticationError(
                message=f"Authentication header must start with '{self.auth_scheme}'",
                details={"header_name": self.auth_header_name, "scheme": self.auth_scheme}
            )
        
        # Extract token
        token = auth_header.replace(f"{self.auth_scheme} ", "")
        
        # Verify token
        try:
            self._verify_token(token)
        except Exception as e:
            raise AuthenticationError(
                message=f"Invalid authentication token: {str(e)}",
                details={"token": "***"}
            )
        
        # Process the request
        return await call_next(request)
    
    def _verify_token(self, token: str):
        """
        Verify authentication token.
        
        Args:
            token: Authentication token
            
        Raises:
            AuthenticationError: If token is invalid
        """
        # Simple token verification for now
        # In a real implementation, this would verify the token against a database or JWT
        if not token:
            raise AuthenticationError(
                message="Authentication token is missing",
                details={}
            )
        
        # Check if token is in allowed tokens
        allowed_tokens = self.config.auth.api_keys
        if token not in allowed_tokens:
            raise AuthenticationError(
                message="Invalid authentication token",
                details={}
            )

def setup_middleware(app: FastAPI, config=None):
    """
    Set up middleware for a FastAPI application.
    
    Args:
        app: FastAPI application
        config: Optional configuration
    """
    if config is None:
        config = get_config()
    
    # Add request logging middleware
    app.add_middleware(RequestLoggingMiddleware)
    
    # Add rate limiting middleware if enabled
    if config.api.rate_limiting_enabled:
        app.add_middleware(
            RateLimitingMiddleware,
            rate_limit_per_minute=config.api.rate_limit_per_minute,
            rate_limit_window_seconds=config.api.rate_limit_window_seconds,
            exclude_paths=config.api.rate_limit_exclude_paths
        )
    
    # Add authentication middleware if enabled
    if config.auth.enabled:
        app.add_middleware(
            AuthenticationMiddleware,
            exclude_paths=config.auth.exclude_paths,
            auth_header_name=config.auth.header_name,
            auth_scheme=config.auth.scheme
        )
