"""
Common API type definitions for SolnAI agents.

This module provides standardized Pydantic models for request/response handling
across different agent implementations to ensure consistent API interfaces.
"""

import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, Dict, Any, List, Union, Literal

class MessageType(str, Enum):
    """Enumeration of message types."""
    HUMAN = "human"
    AI = "ai"
    SYSTEM = "system"

class AgentRequest(BaseModel):
    """
    Standard request model for all SolnAI agents.
    
    Attributes:
        query: The user's question or command
        user_id: Unique identifier for the user
        request_id: Request tracking ID (auto-generated if not provided)
        session_id: Current conversation session identifier
        parameters: Optional additional parameters specific to the agent
    """
    query: str = Field(..., description="User's question or command", min_length=1, max_length=32000)
    user_id: str = Field(..., description="Unique identifier for the user")
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Request tracking ID")
    session_id: str = Field(..., description="Current conversation session identifier")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Optional agent-specific parameters")
    
    @validator('query')
    def validate_query(cls, v):
        """Validate that the query is not empty."""
        v = v.strip()
        if not v:
            raise ValueError("Query cannot be empty")
        return v
    
    @validator('user_id', 'session_id')
    def validate_ids(cls, v):
        """Validate ID fields."""
        v = v.strip()
        if not v:
            raise ValueError("ID fields cannot be empty")
        return v

class AgentResponse(BaseModel):
    """
    Standard response model for all SolnAI agents.
    
    Attributes:
        success: Whether the request was processed successfully
        output: The main response content
        error: Optional error message if success is False
        data: Optional additional data returned by the agent
        response_id: Unique identifier for the response (auto-generated)
        timestamp: Response timestamp (auto-generated)
    """
    success: bool = Field(..., description="Whether the request was processed successfully")
    output: str = Field(..., description="Main response content")
    error: Optional[str] = Field(None, description="Error message if success is False")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data returned by the agent")
    response_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique response identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    @root_validator
    def validate_error_if_not_success(cls, values):
        """Validate that error is provided if success is False."""
        success = values.get('success')
        error = values.get('error')
        
        if success is False and not error:
            values['error'] = "An error occurred but no error message was provided"
        
        return values

class Message(BaseModel):
    """
    Message model for conversation history.
    
    Attributes:
        type: Message type (human, ai, system)
        content: Message content
        data: Optional additional data associated with the message
        timestamp: Message timestamp (auto-generated)
    """
    type: MessageType = Field(..., description="Message type (human, ai, system)")
    content: str = Field(..., description="Message content")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data associated with the message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    
    @validator('content')
    def validate_content(cls, v):
        """Validate that the content is not empty."""
        v = v.strip()
        if not v:
            raise ValueError("Message content cannot be empty")
        return v

class ConversationMessage(BaseModel):
    """
    Database representation of a conversation message.
    
    Attributes:
        id: Unique message identifier
        created_at: Timestamp when the message was created
        session_id: Session identifier
        message: The message object
    """
    id: str = Field(..., description="Unique message identifier")
    created_at: str = Field(..., description="Timestamp when the message was created")
    session_id: str = Field(..., description="Session identifier")
    message: Message = Field(..., description="Message object")
    
    class Config:
        """Pydantic configuration."""
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "created_at": "2023-01-01T12:00:00Z",
                "session_id": "user-session-123",
                "message": {
                    "type": "human",
                    "content": "What's the weather like today?",
                    "data": None,
                    "timestamp": "2023-01-01T12:00:00Z"
                }
            }
        }

class YouTubeVideoInfo(BaseModel):
    """
    YouTube video information model.
    
    Attributes:
        video_id: YouTube video ID
        title: Video title
        description: Video description
        channel_title: Channel title
        published_at: Publication date
        thumbnail_url: URL to video thumbnail
        duration: Video duration
        view_count: Number of views
        like_count: Number of likes
        comment_count: Number of comments
    """
    video_id: str = Field(..., description="YouTube video ID")
    title: str = Field(..., description="Video title")
    description: Optional[str] = Field(None, description="Video description")
    channel_title: Optional[str] = Field(None, description="Channel title")
    published_at: Optional[str] = Field(None, description="Publication date")
    thumbnail_url: Optional[str] = Field(None, description="URL to video thumbnail")
    duration: Optional[str] = Field(None, description="Video duration")
    view_count: Optional[int] = Field(None, description="Number of views")
    like_count: Optional[int] = Field(None, description="Number of likes")
    comment_count: Optional[int] = Field(None, description="Number of comments")
    
    @validator('video_id')
    def validate_video_id(cls, v):
        """Validate YouTube video ID format."""
        v = v.strip()
        if not v:
            raise ValueError("Video ID cannot be empty")
        return v

class LLMRole(str, Enum):
    """Enumeration of LLM message roles."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class LLMMessage(BaseModel):
    """
    Message format for LLM providers.
    
    Attributes:
        role: Message role (user, assistant, system)
        content: Message content
        name: Optional name for the message sender
    """
    role: LLMRole = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")
    name: Optional[str] = Field(None, description="Optional name for the message sender")
    
    @validator('content')
    def validate_content(cls, v):
        """Validate that the content is not empty."""
        v = v.strip()
        if not v:
            raise ValueError("Message content cannot be empty")
        return v
    
    class Config:
        """Pydantic configuration."""
        schema_extra = {
            "example": {
                "role": "user",
                "content": "What's the weather like today?"
            }
        }
