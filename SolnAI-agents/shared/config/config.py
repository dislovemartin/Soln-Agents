"""
Centralized configuration management for SolnAI agents.

This module provides a standardized way to load, validate, and access
configuration settings across different agent implementations.
"""

import os
from typing import Dict, Any, Optional, Union, List
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class LLMConfig(BaseModel):
    """Configuration for LLM providers."""
    
    provider: str = Field(
        default="openai",
        description="LLM provider (openai, anthropic, gemini, etc.)"
    )
    
    # OpenAI settings
    openai_api_key: Optional[str] = Field(
        default=None,
        description="OpenAI API key"
    )
    openai_model: str = Field(
        default="gpt-4o",
        description="OpenAI model to use"
    )
    
    # Anthropic settings
    anthropic_api_key: Optional[str] = Field(
        default=None,
        description="Anthropic API key"
    )
    anthropic_model: str = Field(
        default="claude-3-opus-20240229",
        description="Anthropic model to use"
    )
    
    # Gemini settings
    gemini_api_key: Optional[str] = Field(
        default=None,
        description="Google Gemini API key"
    )
    gemini_model: str = Field(
        default="gemini-pro",
        description="Gemini model to use"
    )
    
    @validator('provider')
    def validate_provider(cls, v):
        """Validate the provider value."""
        valid_providers = ['openai', 'anthropic', 'gemini']
        if v.lower() not in valid_providers:
            logger.warning(f"Unsupported LLM provider: {v}. Using default: openai")
            return 'openai'
        return v.lower()
    
    def get_api_key(self) -> Optional[str]:
        """Get the API key for the configured provider."""
        if self.provider == 'openai':
            return self.openai_api_key
        elif self.provider == 'anthropic':
            return self.anthropic_api_key
        elif self.provider == 'gemini':
            return self.gemini_api_key
        return None
    
    def get_model(self) -> str:
        """Get the model for the configured provider."""
        if self.provider == 'openai':
            return self.openai_model
        elif self.provider == 'anthropic':
            return self.anthropic_model
        elif self.provider == 'gemini':
            return self.gemini_model
        return "gpt-4o"  # Default fallback

class DatabaseConfig(BaseModel):
    """Configuration for database connections."""
    
    supabase_url: Optional[str] = Field(
        default=None,
        description="Supabase URL"
    )
    supabase_key: Optional[str] = Field(
        default=None,
        description="Supabase key"
    )
    table_name: str = Field(
        default="messages",
        description="Table name for storing messages"
    )

class APIConfig(BaseModel):
    """Configuration for API settings."""
    
    host: str = Field(
        default="0.0.0.0",
        description="Host to bind to"
    )
    port: int = Field(
        default=8001,
        description="Port to listen on"
    )
    enable_cors: bool = Field(
        default=True,
        description="Whether to enable CORS"
    )
    api_token: Optional[str] = Field(
        default=None,
        description="API bearer token for authentication"
    )

class Config(BaseModel):
    """Main configuration class for SolnAI agents."""
    
    llm: LLMConfig = Field(
        default_factory=LLMConfig,
        description="LLM configuration"
    )
    database: DatabaseConfig = Field(
        default_factory=DatabaseConfig,
        description="Database configuration"
    )
    api: APIConfig = Field(
        default_factory=APIConfig,
        description="API configuration"
    )
    
    @classmethod
    def from_env(cls) -> 'Config':
        """
        Load configuration from environment variables.
        
        Returns:
            Config: Loaded configuration
        """
        return cls(
            llm=LLMConfig(
                provider=os.getenv("LLM_PROVIDER", "openai"),
                openai_api_key=os.getenv("OPENAI_API_KEY"),
                openai_model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
                anthropic_model=os.getenv("ANTHROPIC_MODEL", "claude-3-opus-20240229"),
                gemini_api_key=os.getenv("GEMINI_API_KEY"),
                gemini_model=os.getenv("GEMINI_MODEL", "gemini-pro")
            ),
            database=DatabaseConfig(
                supabase_url=os.getenv("SUPABASE_URL"),
                supabase_key=os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY"),
                table_name=os.getenv("SUPABASE_TABLE", "messages")
            ),
            api=APIConfig(
                host=os.getenv("HOST", "0.0.0.0"),
                port=int(os.getenv("PORT", "8001")),
                enable_cors=os.getenv("ENABLE_CORS", "True").lower() == "true",
                api_token=os.getenv("API_BEARER_TOKEN")
            )
        )

# Singleton instance
_config_instance = None

def get_config() -> Config:
    """
    Get the configuration instance.
    
    Returns:
        Config: Configuration instance
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = Config.from_env()
    return _config_instance
