"""
Configuration settings for SolnAI agents.

This module provides utilities for loading and managing configuration settings
from environment variables and configuration files.
"""

import os
import json
import logging
from typing import Any, Dict, Optional, Union
from pathlib import Path
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class Settings:
    """
    Configuration settings manager for SolnAI agents.
    
    This class provides utilities for loading and accessing configuration settings
    from environment variables and configuration files.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the settings manager.
        
        Args:
            config_path: Optional path to a JSON configuration file
        """
        self._config: Dict[str, Any] = {}
        
        # Load settings from environment variables
        self._load_from_env()
        
        # Load settings from configuration file if provided
        if config_path:
            self._load_from_file(config_path)
    
    def _load_from_env(self) -> None:
        """Load settings from environment variables."""
        # API settings
        self._config["api_bearer_token"] = os.getenv("API_BEARER_TOKEN")
        self._config["api_port"] = int(os.getenv("API_PORT", "8080"))
        self._config["api_host"] = os.getenv("API_HOST", "0.0.0.0")
        self._config["api_debug"] = os.getenv("API_DEBUG", "false").lower() == "true"
        
        # Supabase settings
        self._config["supabase_url"] = os.getenv("SUPABASE_URL")
        self._config["supabase_key"] = os.getenv("SUPABASE_KEY")
        self._config["supabase_table"] = os.getenv("SUPABASE_TABLE", "messages")
        
        # LLM settings
        self._config["llm_provider"] = os.getenv("LLM_PROVIDER", "openai")
        self._config["openai_api_key"] = os.getenv("OPENAI_API_KEY")
        self._config["openai_model"] = os.getenv("OPENAI_MODEL", "gpt-4o")
        self._config["anthropic_api_key"] = os.getenv("ANTHROPIC_API_KEY")
        self._config["anthropic_model"] = os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229")
        
        # YouTube API settings
        self._config["youtube_api_key"] = os.getenv("YOUTUBE_API_KEY")
    
    def _load_from_file(self, config_path: str) -> None:
        """
        Load settings from a JSON configuration file.
        
        Args:
            config_path: Path to the JSON configuration file
        """
        try:
            with open(config_path, "r") as f:
                file_config = json.load(f)
                
                # Update config with file settings (environment variables take precedence)
                for key, value in file_config.items():
                    if key not in self._config or self._config[key] is None:
                        self._config[key] = value
                        
            logger.info(f"Loaded configuration from {config_path}")
            
        except Exception as e:
            logger.error(f"Error loading configuration from {config_path}: {str(e)}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration setting.
        
        Args:
            key: The configuration key
            default: Default value if the key is not found
            
        Returns:
            The configuration value or the default value
        """
        return self._config.get(key, default)
    
    def __getitem__(self, key: str) -> Any:
        """
        Get a configuration setting using dictionary syntax.
        
        Args:
            key: The configuration key
            
        Returns:
            The configuration value
            
        Raises:
            KeyError: If the key is not found
        """
        if key in self._config:
            return self._config[key]
        raise KeyError(f"Configuration key '{key}' not found")
    
    def __contains__(self, key: str) -> bool:
        """
        Check if a configuration key exists.
        
        Args:
            key: The configuration key
            
        Returns:
            True if the key exists, False otherwise
        """
        return key in self._config
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Get all configuration settings as a dictionary.
        
        Returns:
            A dictionary of all configuration settings
        """
        return self._config.copy()

# Create a singleton instance
settings = Settings()

def get_settings() -> Settings:
    """
    Get the settings instance.
    
    Returns:
        The settings instance
    """
    return settings
