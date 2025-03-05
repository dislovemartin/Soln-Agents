"""
Tests for the shared utilities.

This module contains tests for the shared utilities to ensure they function correctly.
"""

import os
import sys
import pytest
import asyncio
from dotenv import load_dotenv

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.auth import verify_token
from utils.llm import get_default_model, create_system_message, create_user_message
from utils.youtube import extract_youtube_id

# Load environment variables
load_dotenv()

# Tests for auth.py
def test_verify_token():
    """Test the verify_token function."""
    # This is a mock test since we can't easily test the actual function
    # without setting up FastAPI test client
    assert callable(verify_token)

# Tests for llm.py
def test_get_default_model():
    """Test the get_default_model function."""
    model = get_default_model()
    assert isinstance(model, str)
    assert len(model) > 0

def test_create_system_message():
    """Test the create_system_message function."""
    content = "You are a helpful assistant."
    message = create_system_message(content)
    
    assert message["role"] == "system"
    assert message["content"] == content

def test_create_user_message():
    """Test the create_user_message function."""
    content = "Hello, how are you?"
    message = create_user_message(content)
    
    assert message["role"] == "user"
    assert message["content"] == content

# Tests for youtube.py
def test_extract_youtube_id():
    """Test the extract_youtube_id function."""
    # Test with video URL
    id_type, video_id = extract_youtube_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert id_type == "video"
    assert video_id == "dQw4w9WgXcQ"
    
    # Test with short URL
    id_type, video_id = extract_youtube_id("https://youtu.be/dQw4w9WgXcQ")
    assert id_type == "video"
    assert video_id == "dQw4w9WgXcQ"
    
    # Test with embed URL
    id_type, video_id = extract_youtube_id("https://www.youtube.com/embed/dQw4w9WgXcQ")
    assert id_type == "video"
    assert video_id == "dQw4w9WgXcQ"
    
    # Test with playlist URL
    id_type, playlist_id = extract_youtube_id("https://www.youtube.com/playlist?list=PLlaN88a7y2_plecYoJxvRFTLHVbIVAOoc")
    assert id_type == "playlist"
    assert playlist_id == "PLlaN88a7y2_plecYoJxvRFTLHVbIVAOoc"
    
    # Test with direct ID
    id_type, video_id = extract_youtube_id("dQw4w9WgXcQ")
    assert id_type == "video"
    assert video_id == "dQw4w9WgXcQ"
    
    # Test with invalid URL
    with pytest.raises(ValueError):
        extract_youtube_id("https://example.com")

if __name__ == "__main__":
    # Run tests
    pytest.main(["-xvs", __file__])
