"""
Database utilities for SolnAI agents.

This module provides standardized database functions for working with Supabase
or other database backends across different agent implementations.
"""

from supabase import create_client, Client
from fastapi import HTTPException
import os
from typing import Dict, Any, List, Optional

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client using environment variables.
    
    Returns:
        Client: A configured Supabase client
        
    Raises:
        ValueError: If required environment variables are missing
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_KEY) must be set")
    
    return create_client(supabase_url, supabase_key)

async def fetch_conversation_history(
    session_id: str,
    table_name: str = "messages",
    limit: int = 10,
    supabase_client: Optional[Client] = None
) -> List[Dict[str, Any]]:
    """
    Fetch the most recent conversation history for a session.
    
    Args:
        session_id: The unique session identifier
        table_name: The name of the table containing messages
        limit: Maximum number of messages to retrieve
        supabase_client: Optional pre-configured Supabase client
        
    Returns:
        List[Dict[str, Any]]: List of message objects in chronological order
        
    Raises:
        HTTPException: If there's an error fetching the conversation history
    """
    try:
        client = supabase_client or get_supabase_client()
        
        response = client.table(table_name) \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        
        # Convert to list and reverse to get chronological order
        messages = response.data[::-1]
        return messages
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch conversation history: {str(e)}"
        )

async def store_message(
    session_id: str,
    message_type: str,
    content: str,
    table_name: str = "messages",
    data: Optional[Dict[str, Any]] = None,
    supabase_client: Optional[Client] = None
) -> Dict[str, Any]:
    """
    Store a message in the database.
    
    Args:
        session_id: The unique session identifier
        message_type: Type of message (e.g., 'human', 'ai')
        content: The message content
        table_name: The name of the table to store messages in
        data: Optional additional data to store with the message
        supabase_client: Optional pre-configured Supabase client
        
    Returns:
        Dict[str, Any]: The created message record
        
    Raises:
        HTTPException: If there's an error storing the message
    """
    try:
        client = supabase_client or get_supabase_client()
        
        message_obj = {
            "type": message_type,
            "content": content
        }
        
        if data:
            message_obj["data"] = data
            
        response = client.table(table_name).insert({
            "session_id": session_id,
            "message": message_obj
        }).execute()
        
        return response.data[0] if response.data else {}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store message: {str(e)}"
        )

def format_conversation_history(
    messages: List[Dict[str, Any]],
    format_type: str = "openai"
) -> List[Dict[str, str]]:
    """
    Format conversation history for use with different LLM providers.
    
    Args:
        messages: List of message objects from the database
        format_type: The format to convert to ('openai', 'anthropic', etc.)
        
    Returns:
        List[Dict[str, str]]: Formatted conversation history
    """
    formatted_messages = []
    
    for msg in messages:
        msg_data = msg["message"]
        msg_type = msg_data["type"]
        msg_content = msg_data["content"]
        
        if format_type == "openai":
            # Map 'human' -> 'user' and 'ai' -> 'assistant' for OpenAI format
            role = "user" if msg_type == "human" else "assistant"
            formatted_messages.append({
                "role": role,
                "content": msg_content
            })
        elif format_type == "anthropic":
            # Format for Anthropic's Claude
            formatted_messages.append({
                "role": msg_type,
                "content": msg_content
            })
        else:
            # Default format
            formatted_messages.append({
                "role": msg_type,
                "content": msg_content
            })
    
    return formatted_messages
