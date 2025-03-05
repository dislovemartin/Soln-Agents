"""
YouTube utilities for SolnAI agents.

This module provides standardized functions for interacting with the YouTube API
and processing YouTube content across different agent implementations.
"""

import os
import re
from typing import Dict, Any, List, Tuple, Optional, Union
import logging
import googleapiclient.discovery
import googleapiclient.errors
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_youtube_client():
    """
    Create and return a YouTube API client.
    
    Returns:
        googleapiclient.discovery.Resource: A configured YouTube API client
        
    Raises:
        ValueError: If the YouTube API key is not set
    """
    api_key = os.getenv("YOUTUBE_API_KEY")
    
    if not api_key:
        raise ValueError("YOUTUBE_API_KEY environment variable not set")
    
    return googleapiclient.discovery.build(
        "youtube", 
        "v3", 
        developerKey=api_key
    )

def extract_youtube_id(url_or_id: str) -> Tuple[str, str]:
    """
    Extract video or playlist ID from various YouTube URL formats.
    
    Args:
        url_or_id: YouTube URL or ID
        
    Returns:
        Tuple[str, str]: A tuple of (id_type, id) where id_type is 'video' or 'playlist'
        
    Raises:
        ValueError: If the URL format is not recognized
    """
    # Check if it's already an ID (no slashes or dots)
    if re.match(r'^[a-zA-Z0-9_-]+$', url_or_id) and '/' not in url_or_id and '.' not in url_or_id:
        # Assume it's a video ID if 11 characters, otherwise a playlist ID
        if len(url_or_id) == 11:
            return 'video', url_or_id
        else:
            return 'playlist', url_or_id
    
    # Video ID patterns
    video_patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com/embed/([a-zA-Z0-9_-]{11})',
        r'youtube\.com/v/([a-zA-Z0-9_-]{11})',
    ]
    
    # Playlist ID patterns
    playlist_patterns = [
        r'youtube\.com/playlist\?list=([a-zA-Z0-9_-]+)',
        r'youtube\.com/watch\?.*list=([a-zA-Z0-9_-]+)',
    ]
    
    # Check for video ID
    for pattern in video_patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return 'video', match.group(1)
    
    # Check for playlist ID
    for pattern in playlist_patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return 'playlist', match.group(1)
    
    raise ValueError(f"Could not extract YouTube ID from: {url_or_id}")

async def get_video_info(video_id: str) -> Dict[str, Any]:
    """
    Get information about a YouTube video.
    
    Args:
        video_id: YouTube video ID
        
    Returns:
        Dict[str, Any]: Video information including title, description, etc.
        
    Raises:
        Exception: If there's an error fetching the video information
    """
    try:
        youtube = get_youtube_client()
        
        request = youtube.videos().list(
            part="snippet,contentDetails,statistics",
            id=video_id
        )
        response = request.execute()
        
        if not response['items']:
            raise ValueError(f"No video found with ID: {video_id}")
        
        video_data = response['items'][0]
        snippet = video_data['snippet']
        
        return {
            'video_id': video_id,
            'title': snippet.get('title', ''),
            'description': snippet.get('description', ''),
            'channel_title': snippet.get('channelTitle', ''),
            'published_at': snippet.get('publishedAt', ''),
            'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
            'duration': video_data.get('contentDetails', {}).get('duration', ''),
            'view_count': video_data.get('statistics', {}).get('viewCount', '0'),
            'like_count': video_data.get('statistics', {}).get('likeCount', '0')
        }
        
    except Exception as e:
        logger.error(f"Error fetching video info: {str(e)}")
        raise

async def get_video_transcript(video_id: str, language_code: str = None) -> str:
    """
    Get the transcript of a YouTube video.
    
    Args:
        video_id: YouTube video ID
        language_code: Optional language code for transcript
        
    Returns:
        str: The video transcript as a single string
        
    Raises:
        Exception: If there's an error fetching the transcript
    """
    try:
        if language_code:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcript_list.find_transcript([language_code])
            transcript_data = transcript.fetch()
        else:
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Join transcript segments into a single string
        return ' '.join([item['text'] for item in transcript_data])
        
    except Exception as e:
        logger.error(f"Error fetching video transcript: {str(e)}")
        raise

async def get_latest_video_from_playlist(playlist_id: str) -> Dict[str, Any]:
    """
    Get the most recent video from a YouTube playlist.
    
    Args:
        playlist_id: YouTube playlist ID
        
    Returns:
        Dict[str, Any]: Information about the latest video
        
    Raises:
        Exception: If there's an error fetching the playlist or videos
    """
    try:
        youtube = get_youtube_client()
        
        # Get playlist items
        request = youtube.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=playlist_id,
            maxResults=10
        )
        response = request.execute()
        
        if not response['items']:
            raise ValueError(f"No videos found in playlist: {playlist_id}")
        
        # Get the most recent video (first item in the playlist)
        latest_video = response['items'][0]
        video_id = latest_video['contentDetails']['videoId']
        
        # Get detailed video information
        return await get_video_info(video_id)
        
    except Exception as e:
        logger.error(f"Error fetching latest video from playlist: {str(e)}")
        raise
