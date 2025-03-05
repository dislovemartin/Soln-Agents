"""
Token counting utilities for different LLM models
"""

import re
import json


def estimate_tokens_chars(text, chars_per_token=4):
    """
    Estimate token count from text using a simple character-based approximation.
    
    Args:
        text (str): The text to estimate tokens for
        chars_per_token (int): The approximate number of characters per token
        
    Returns:
        int: Estimated token count
    """
    if not text:
        return 0
    return len(text) // chars_per_token


def estimate_tokens_claude(text):
    """
    Estimate token count for Claude models. 
    This is a very approximate algorithm based on Claude documentation.
    
    Args:
        text (str): The text to estimate tokens for
        
    Returns:
        int: Estimated token count
    """
    if not text:
        return 0
    
    # Split text into words, including punctuation as separate tokens
    tokens = re.findall(r'\w+|[^\w\s]', text)
    
    # Count the number of tokens
    return len(tokens)


def estimate_tokens_openai(text):
    """
    Estimate token count for OpenAI models.
    This is an approximate algorithm based on GPT tokenization patterns.
    
    Args:
        text (str): The text to estimate tokens for
        
    Returns:
        int: Estimated token count
    """
    if not text:
        return 0
    
    # Split on whitespace and punctuation
    tokens = re.findall(r'\w+|[^\w\s]', text)
    
    # Adjust for subword tokenization
    token_count = 0
    for token in tokens:
        # Longer words are often split into subwords
        if len(token) <= 2:
            token_count += 1
        elif len(token) <= 5:
            token_count += 1
        else:
            # Estimate subwords for longer tokens
            token_count += (len(token) + 3) // 4
    
    return token_count


def count_tokens_in_jsonl(jsonl_file):
    """
    Count tokens in a JSONL file containing Goose/LLM interactions.
    
    Args:
        jsonl_file (str): Path to the JSONL file
        
    Returns:
        dict: Token statistics including total, user, assistant, and system
    """
    stats = {
        "total": 0,
        "user": 0,
        "assistant": 0,
        "system": 0,
        "other": 0,
        "messages": 0
    }
    
    try:
        with open(jsonl_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                try:
                    message = json.loads(line)
                    stats["messages"] += 1
                    
                    content = message.get("content", "")
                    role = message.get("role", "other")
                    
                    # Estimate tokens using simple character-based method
                    tokens = estimate_tokens_chars(content)
                    stats["total"] += tokens
                    
                    # Add to role-specific counters
                    if role in stats:
                        stats[role] += tokens
                    else:
                        stats["other"] += tokens
                except json.JSONDecodeError:
                    continue
                    
        return stats
    except Exception:
        return stats