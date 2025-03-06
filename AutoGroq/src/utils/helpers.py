"""
Helper utilities for AutoGroq.
"""

import os
import json
import yaml
from typing import Any, Dict, List, Optional, Union
from loguru import logger


def load_config(config_path: str) -> Dict[str, Any]:
    """
    Load configuration from a file.

    Args:
        config_path: Path to the configuration file (JSON or YAML)

    Returns:
        Configuration dictionary
    """
    if not os.path.exists(config_path):
        logger.error(f"Configuration file not found: {config_path}")
        return {}
        
    try:
        file_ext = os.path.splitext(config_path)[1].lower()
        
        if file_ext in ['.yaml', '.yml']:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        elif file_ext == '.json':
            with open(config_path, 'r') as f:
                return json.load(f)
        else:
            logger.error(f"Unsupported configuration file format: {file_ext}")
            return {}
            
    except Exception as e:
        logger.exception(f"Error loading configuration: {str(e)}")
        return {}


def save_config(config: Dict[str, Any], config_path: str) -> bool:
    """
    Save configuration to a file.

    Args:
        config: Configuration dictionary
        config_path: Path to save the configuration file

    Returns:
        True if successful, False otherwise
    """
    try:
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        file_ext = os.path.splitext(config_path)[1].lower()
        
        if file_ext in ['.yaml', '.yml']:
            with open(config_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
        elif file_ext == '.json':
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
        else:
            logger.error(f"Unsupported configuration file format: {file_ext}")
            return False
            
        logger.info(f"Configuration saved to: {config_path}")
        return True
        
    except Exception as e:
        logger.exception(f"Error saving configuration: {str(e)}")
        return False


def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 200) -> List[str]:
    """
    Split text into chunks of specified size with overlap.

    Args:
        text: Text to split
        chunk_size: Maximum size of each chunk
        overlap: Overlap between chunks

    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]
        
    chunks = []
    start = 0
    
    while start < len(text):
        end = min(start + chunk_size, len(text))
        
        # Try to find a good break point
        if end < len(text):
            # Look for newline or period near the end
            for i in range(end - 1, max(start + chunk_size // 2, start), -1):
                if text[i] in ['\n', '.', '\!', '?']:
                    end = i + 1
                    break
        
        chunks.append(text[start:end])
        start = end - overlap
    
    return chunks


def format_agent_prompt(
    system_prompt: str,
    user_prompt: str,
    context: Optional[Dict[str, Any]] = None,
    tools: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Format a prompt for an agent.

    Args:
        system_prompt: System prompt
        user_prompt: User prompt
        context: Optional context dictionary
        tools: Optional tools list

    Returns:
        Formatted prompt dictionary
    """
    prompt = {
        "system": system_prompt,
        "user": user_prompt,
    }
    
    if context:
        # Add context to system prompt if provided
        context_str = "\nContext:\n"
        for key, value in context.items():
            context_str += f"- {key}: {value}\n"
        prompt["system"] += context_str
    
    if tools:
        # Add tools to prompt if provided
        tool_str = "\nTools available:\n"
        for tool in tools:
            tool_str += f"- {tool['name']}: {tool['description']}\n"
        prompt["system"] += tool_str
        prompt["tools"] = tools
    
    return prompt
