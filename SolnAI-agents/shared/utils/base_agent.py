"""
Base agent class for SolnAI agents.

This module provides a standardized base class that can be extended by
specific agent implementations to ensure consistent behavior and interfaces.
"""

import os
import time
import logging
from typing import Dict, Any, Optional, List, Callable, Awaitable, Union
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.middleware.base import BaseHTTPMiddleware

from ..types.api import AgentRequest, AgentResponse
from ..config.config import get_config
from .auth import verify_token, security
from .db import get_supabase_client, store_message, fetch_conversation_history
from .error_handling import (
    setup_exception_handlers, 
    log_request, 
    log_response,
    AgentError,
    ConfigurationError,
    DatabaseError,
    LLMError
)

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging requests and responses."""
    
    async def dispatch(self, request: Request, call_next):
        # Log the request
        log_request(request)
        
        # Record start time
        start_time = time.time()
        
        # Process the request
        response = await call_next(request)
        
        # Calculate elapsed time
        elapsed_time = time.time() - start_time
        
        # Log the response
        log_response(request, response, elapsed_time)
        
        return response

class BaseAgent:
    """
    Base class for all SolnAI agents.
    
    This class provides common functionality for all agents, including:
    - FastAPI app setup with CORS and authentication
    - Database integration for conversation history
    - Standard request/response handling
    - Error handling and logging
    
    Attributes:
        app: FastAPI application instance
        name: Agent name
        description: Agent description
        version: Agent version
        config: Agent configuration
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        version: str = "1.0.0",
        enable_cors: bool = True,
        debug_mode: bool = False
    ):
        """
        Initialize the base agent.
        
        Args:
            name: Agent name
            description: Agent description
            version: Agent version
            enable_cors: Whether to enable CORS middleware
            debug_mode: Whether to include detailed error information
        """
        self.name = name
        self.description = description
        self.version = version
        self.debug_mode = debug_mode
        
        # Load configuration
        self.config = get_config()
        
        # Create FastAPI app
        self.app = FastAPI(
            title=name,
            description=description,
            version=version
        )
        
        # Configure CORS if enabled
        if enable_cors:
            self.app.add_middleware(
                CORSMiddleware,
                allow_origins=["*"],
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
        
        # Add request logging middleware
        self.app.add_middleware(RequestLoggingMiddleware)
        
        # Set up exception handlers
        setup_exception_handlers(self.app, debug_mode=debug_mode)
        
        # Register routes
        self._register_routes()
    
    def _register_routes(self):
        """Register standard API routes."""
        
        @self.app.get("/")
        async def root():
            """Root endpoint returning agent information."""
            return {
                "name": self.name,
                "description": self.description,
                "version": self.version,
                "status": "running"
            }
        
        @self.app.get("/health")
        async def health():
            """Health check endpoint."""
            return {"status": "healthy"}
        
        @self.app.post("/process", response_model=AgentResponse)
        async def process_request(
            request: AgentRequest,
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ):
            """
            Process an agent request.
            
            This endpoint handles authentication, stores the user message,
            processes the request, and stores the agent response.
            """
            # Verify authentication token
            verify_token(credentials)
            
            try:
                # Store user message
                try:
                    await store_message(
                        request.session_id,
                        "human",
                        request.query
                    )
                except Exception as db_error:
                    # Log the error but continue processing
                    logger.warning(f"Failed to store user message: {str(db_error)}")
                
                # Process the request
                response = await self.process_request(request)
                
                # Store agent response
                try:
                    await store_message(
                        request.session_id,
                        "ai",
                        response.output,
                        data=response.data
                    )
                except Exception as db_error:
                    # Log the error but return the response anyway
                    logger.warning(f"Failed to store agent response: {str(db_error)}")
                
                return response
                
            except AgentError as e:
                # Handle specific agent errors
                logger.error(f"Agent error processing request: {e.code} - {e.message}")
                
                # Create error response
                error_response = AgentResponse(
                    success=False,
                    output=f"Error: {e.message}",
                    error=e.message,
                    data={"error_code": e.code, "details": e.details}
                )
                
                # Store error response (best effort)
                try:
                    await store_message(
                        request.session_id,
                        "ai",
                        error_response.output,
                        data={"error": e.to_dict()}
                    )
                except Exception:
                    pass
                
                return error_response
                
            except Exception as e:
                # Handle generic exceptions
                logger.error(f"Unexpected error processing request: {str(e)}", exc_info=True)
                
                # Create error response
                error_response = AgentResponse(
                    success=False,
                    output=f"An unexpected error occurred. Please try again later.",
                    error=str(e) if self.debug_mode else "Internal server error"
                )
                
                # Store error response (best effort)
                try:
                    await store_message(
                        request.session_id,
                        "ai",
                        error_response.output,
                        data={"error": str(e)}
                    )
                except Exception:
                    pass
                
                return error_response
    
    async def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Process an agent request.
        
        This method should be implemented by subclasses to provide
        agent-specific request processing logic.
        
        Args:
            request: The agent request
            
        Returns:
            AgentResponse: The agent response
            
        Raises:
            NotImplementedError: If the method is not implemented by a subclass
        """
        raise NotImplementedError("Subclasses must implement process_request")
    
    async def get_conversation_history(
        self,
        session_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get conversation history for a session.
        
        Args:
            session_id: Session identifier
            limit: Maximum number of messages to retrieve
            
        Returns:
            List[Dict[str, Any]]: List of message objects
            
        Raises:
            DatabaseError: If there's an error fetching the conversation history
        """
        try:
            return await fetch_conversation_history(session_id, limit=limit)
        except Exception as e:
            raise DatabaseError(
                message=f"Failed to fetch conversation history: {str(e)}",
                details={"session_id": session_id, "limit": limit}
            )
    
    def run(self, host: Optional[str] = None, port: Optional[int] = None):
        """
        Run the agent server.
        
        Args:
            host: Host to bind to (defaults to config value)
            port: Port to listen on (defaults to config value)
        """
        import uvicorn
        
        # Use provided values or defaults from config
        host = host or self.config.api.host
        port = port or self.config.api.port
        
        logger.info(f"Starting {self.name} v{self.version} on {host}:{port}")
        uvicorn.run(self.app, host=host, port=port)
