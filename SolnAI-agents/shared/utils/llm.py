"""
LLM utilities for SolnAI agents.

This module provides standardized functions for interacting with various
LLM providers (OpenAI, Anthropic, etc.) across different agent implementations.
"""

import os
import json
from typing import List, Dict, Any, Optional, Union
import logging
import openai
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_llm_provider() -> str:
    """
    Get the configured LLM provider from environment variables.
    
    Returns:
        str: The LLM provider name ('openai', 'anthropic', etc.)
    """
    return os.getenv("LLM_PROVIDER", "openai").lower()

def get_default_model() -> str:
    """
    Get the default model for the configured LLM provider.
    
    Returns:
        str: The default model name
    """
    provider = get_llm_provider()
    
    if provider == "openai":
        return os.getenv("OPENAI_MODEL", "gpt-4o")
    elif provider == "anthropic":
        return os.getenv("ANTHROPIC_MODEL", "claude-3-opus-20240229")
    elif provider == "gemini":
        return os.getenv("GEMINI_MODEL", "gemini-pro")
    else:
        # Default to OpenAI's GPT-4o
        return "gpt-4o"

async def generate_completion(
    prompt: str,
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000,
    provider: Optional[str] = None
) -> str:
    """
    Generate a completion using the configured LLM provider.
    
    Args:
        prompt: The prompt to send to the LLM
        model: Optional model override
        temperature: Sampling temperature (0.0 to 1.0)
        max_tokens: Maximum tokens to generate
        provider: Optional provider override
        
    Returns:
        str: The generated completion
        
    Raises:
        Exception: If there's an error generating the completion
    """
    provider = provider or get_llm_provider()
    model = model or get_default_model()
    
    try:
        if provider == "openai":
            response = await openai.ChatCompletion.acreate(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        else:
            # Add support for other providers as needed
            raise NotImplementedError(f"Provider '{provider}' not implemented")
    
    except Exception as e:
        logger.error(f"Error generating completion: {str(e)}")
        raise

async def generate_chat_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000,
    provider: Optional[str] = None
) -> str:
    """
    Generate a chat completion using the configured LLM provider.
    
    Args:
        messages: List of message objects with 'role' and 'content'
        model: Optional model override
        temperature: Sampling temperature (0.0 to 1.0)
        max_tokens: Maximum tokens to generate
        provider: Optional provider override
        
    Returns:
        str: The generated completion
        
    Raises:
        Exception: If there's an error generating the completion
    """
    provider = provider or get_llm_provider()
    model = model or get_default_model()
    
    try:
        if provider == "openai":
            response = await openai.ChatCompletion.acreate(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        else:
            # Add support for other providers as needed
            raise NotImplementedError(f"Provider '{provider}' not implemented")
    
    except Exception as e:
        logger.error(f"Error generating chat completion: {str(e)}")
        raise

def create_system_message(content: str) -> Dict[str, str]:
    """
    Create a system message for chat completions.
    
    Args:
        content: The system message content
        
    Returns:
        Dict[str, str]: A formatted system message
    """
    return {"role": "system", "content": content}

def create_user_message(content: str) -> Dict[str, str]:
    """
    Create a user message for chat completions.
    
    Args:
        content: The user message content
        
    Returns:
        Dict[str, str]: A formatted user message
    """
    return {"role": "user", "content": content}

def create_assistant_message(content: str) -> Dict[str, str]:
    """
    Create an assistant message for chat completions.
    
    Args:
        content: The assistant message content
        
    Returns:
        Dict[str, str]: A formatted assistant message
    """
    return {"role": "assistant", "content": content}
