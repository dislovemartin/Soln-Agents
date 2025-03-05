# YouTube Summary Agent Implementation Guide

## Name
youtube-summary-agent

## Description
The YouTube Summary Agent is a specialized agent that fetches and summarizes YouTube videos. It provides rich metadata including view counts, upload dates, top comments, and generates AI-powered summaries using GPT-4. The agent supports multiple YouTube URL formats including full video URLs, short URLs, direct video IDs, and playlist URLs. It grounds the summary on the video's metadata and transcript to provide accurate and contextually relevant summaries.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The YouTube Summary Agent uses llm-chain concepts to orchestrate the workflow of video processing and summarization:

```python
from llm_chain import Chain, Step

def youtube_summary_chain(youtube_url):
    """
    Create a chain for processing and summarizing YouTube videos.
    
    Args:
        youtube_url: URL or ID of the YouTube video to summarize
        
    Returns:
        A configured Chain object
    """
    chain = Chain.new()
    
    # Step 1: Extract video or playlist ID from URL
    chain.step(Step.new("extract_id", extract_youtube_id))
    
    # Step 2: Process video or playlist based on ID type
    chain.step(Step.new("process_content", process_content_by_type, 
                       depends_on=["extract_id"]))
    
    # Step 3: Fetch video metadata
    chain.step(Step.new("fetch_metadata", fetch_video_metadata, 
                       depends_on=["process_content"]))
    
    # Step 4: Fetch video transcript
    chain.step(Step.new("fetch_transcript", fetch_video_transcript, 
                       depends_on=["process_content"]))
    
    # Step 5: Fetch top comments
    chain.step(Step.new("fetch_comments", fetch_top_comments, 
                       depends_on=["process_content"]))
    
    # Step 6: Summarize video content
    chain.step(Step.new("generate_summary", generate_video_summary, 
                       depends_on=["fetch_metadata", "fetch_transcript", "fetch_comments"]))
    
    # Step 7: Format the final response
    chain.step(Step.new("format_response", format_final_response, 
                       depends_on=["generate_summary"]))
    
    return chain

# Implementation in the actual agent
def process_request(request: AgentRequest):
    """Process a YouTube URL request and generate a summary."""
    try:
        # Extract YouTube ID from the query
        id_type, youtube_id = extract_youtube_id(request.query)
        
        # Process video or playlist based on ID type
        if id_type == "video":
            result = process_video(youtube_id)
        elif id_type == "playlist":
            result = process_playlist(youtube_id)
        else:
            return AgentResponse(
                success=False,
                error="Could not identify a valid YouTube video or playlist ID",
                response="I couldn't identify a valid YouTube video or playlist ID in your query. Please provide a valid YouTube URL or ID."
            )
        
        # Format the response
        response = format_response(result)
        
        # Store the conversation in Supabase
        store_message(request.session_id, "user", request.query)
        store_message(request.session_id, "assistant", response)
        
        return AgentResponse(success=True, response=response)
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return AgentResponse(
            success=False,
            error=str(e),
            response=f"I encountered an error while processing your request: {str(e)}"
        )
```

#### llguidance Integration
The agent uses llguidance concepts to ensure structured outputs for video summaries:

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

# Define structured schema for video metadata
class VideoMetadata(BaseModel):
    video_id: str = Field(..., description="YouTube video ID")
    title: str = Field(..., description="Video title")
    channel_name: str = Field(..., description="Channel name")
    channel_id: str = Field(..., description="Channel ID")
    publish_date: str = Field(..., description="Video publish date")
    view_count: int = Field(..., description="View count")
    like_count: Optional[int] = Field(None, description="Like count")
    comment_count: Optional[int] = Field(None, description="Comment count")
    duration: str = Field(..., description="Video duration")
    description: str = Field(..., description="Video description")
    tags: List[str] = Field(default_factory=list, description="Video tags")
    topics: List[str] = Field(default_factory=list, description="Video topics")
    has_captions: bool = Field(..., description="Whether the video has captions")

# Define structured schema for video comments
class Comment(BaseModel):
    author: str = Field(..., description="Comment author")
    text: str = Field(..., description="Comment text")
    like_count: int = Field(..., description="Comment like count")
    published_at: str = Field(..., description="Comment publish date")

# Define structured schema for video summary
class VideoSummary(BaseModel):
    key_points: List[str] = Field(..., description="Key points from the video")
    main_topics: List[str] = Field(..., description="Main topics covered in the video")
    summary_text: str = Field(..., description="Comprehensive summary of the video content")
    
# Define structured schema for complete video analysis
class VideoAnalysis(BaseModel):
    metadata: VideoMetadata = Field(..., description="Video metadata")
    top_comments: List[Comment] = Field(default_factory=list, description="Top comments on the video")
    summary: VideoSummary = Field(..., description="AI-generated summary of the video")

# Implementation in the summarize_text function
def summarize_text(text, video_data):
    """Summarizes the transcript using OpenAI GPT, with video metadata for context."""
    # Prepare the prompt with structured guidance
    prompt = f"""
    You are an expert YouTube video summarizer. Analyze the following video transcript and metadata to create a comprehensive summary.
    
    VIDEO METADATA:
    Title: {video_data['title']}
    Channel: {video_data['channel_name']}
    Published: {video_data['publish_date']}
    Views: {video_data['view_count']}
    Duration: {video_data['duration']}
    
    TRANSCRIPT:
    {text[:15000]}  # Truncate if needed
    
    Please provide a structured summary following this format:
    1. Key Points (bullet points of the most important information)
    2. Main Topics (list of main topics covered)
    3. Comprehensive Summary (a well-organized summary of the content)
    
    Your summary should be accurate, informative, and capture the essence of the video content.
    """
    
    # Generate the summary with structured output guidance
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert YouTube video summarizer."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=1000
    )
    
    return response.choices[0].message.content
```

#### aici Integration
The agent implements aici concepts through its dynamic handling of different YouTube URL formats:

```python
# Conceptual implementation of aici in YouTube summary context
async def extract_youtube_id(query: str):
    """
    Extract video or playlist ID from various YouTube URL formats.
    Returns tuple of (id_type, id) where id_type is 'video' or 'playlist'
    """
    # Check for direct video ID
    if len(query.strip()) == 11 and all(c in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in query.strip()):
        await aici.FixedTokens("Detected direct video ID...\n")
        return ("video", query.strip())
    
    # Check for direct playlist ID
    if query.strip().startswith('PL') and len(query.strip()) >= 13:
        await aici.FixedTokens("Detected direct playlist ID...\n")
        return ("playlist", query.strip())
    
    # Check for youtu.be short URL
    if 'youtu.be/' in query:
        await aici.FixedTokens("Detected youtu.be short URL...\n")
        video_id = query.split('youtu.be/')[1].split('?')[0].split('&')[0]
        return ("video", video_id)
    
    # Check for youtube.com/watch URL
    if 'youtube.com/watch' in query and 'v=' in query:
        await aici.FixedTokens("Detected youtube.com/watch URL...\n")
        video_id = query.split('v=')[1].split('&')[0].split('?')[0]
        return ("video", video_id)
    
    # Check for youtube.com/playlist URL
    if 'youtube.com/playlist' in query and 'list=' in query:
        await aici.FixedTokens("Detected youtube.com/playlist URL...\n")
        playlist_id = query.split('list=')[1].split('&')[0].split('?')[0]
        return ("playlist", playlist_id)
    
    # Check for embedded video URL
    if 'youtube.com/embed/' in query:
        await aici.FixedTokens("Detected youtube.com/embed URL...\n")
        video_id = query.split('youtube.com/embed/')[1].split('?')[0].split('&')[0]
        return ("video", video_id)
    
    # If no match found
    await aici.FixedTokens("Could not identify a valid YouTube URL format...\n")
    return (None, None)
```

### Architecture
The YouTube Summary Agent uses a single-agent architecture with the following components:

1. **URL Processor**: Extracts video or playlist IDs from various URL formats
2. **YouTube API Client**: Fetches video metadata and comments
3. **Transcript Fetcher**: Retrieves video transcripts when available
4. **Summary Generator**: Creates AI-powered summaries of video content
5. **Response Formatter**: Formats the results into a structured, readable response

### Code Structure
```python
# FastAPI setup
app = FastAPI()
security = HTTPBearer()

# Model definitions
class AgentRequest(BaseModel):
    query: str
    user_id: str
    request_id: str
    session_id: str

class AgentResponse(BaseModel):
    response: str
    success: bool
    error: Optional[str] = None

# Main functions
def extract_youtube_id(query: str):
    """Extract video or playlist ID from various YouTube URL formats."""
    # Implementation details...

def process_video(video_id: str):
    """Process a single video by ID."""
    # Implementation details...

def process_playlist(playlist_id):
    """Process the latest video from a playlist."""
    # Implementation details...

def get_video_transcript(video_id):
    """Fetch transcript of the video, if available."""
    # Implementation details...

def summarize_text(text, video_data):
    """Summarize the transcript using OpenAI GPT, with video metadata for context."""
    # Implementation details...

def format_response(result):
    """Format the video information and summary into a readable response."""
    # Implementation details...

# API endpoint
@app.post("/agent")
async def process_request(
    request: AgentRequest,
    credentials: HTTPAuthorizationCredentials = Depends(verify_token)
):
    """Process a YouTube URL request and generate a summary."""
    # Implementation details...
```

### Performance Optimization
- **Transcript Chunking**: Breaking long transcripts into manageable chunks
- **Metadata Caching**: Caching video metadata to avoid redundant API calls
- **Parallel Processing**: Fetching metadata, transcripts, and comments in parallel
- **Response Formatting**: Optimizing response formatting for readability

### Ethical Considerations
- **Content Attribution**: Properly attributing content to YouTube creators
- **API Usage**: Respecting YouTube API usage limits and terms of service
- **Privacy**: Not storing personal user data beyond session management
- **Content Filtering**: Being aware of potentially sensitive content in videos

## Example Usage

### Basic YouTube Summary
```python
import requests
import json

def summarize_youtube_video(url, api_key):
    """
    Summarize a YouTube video using the YouTube Summary Agent.
    
    Args:
        url: URL of the YouTube video
        api_key: API key for authentication
        
    Returns:
        Formatted summary of the video
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": url,
        "user_id": "user123",
        "request_id": "req123",
        "session_id": "session123"
    }
    
    response = requests.post(
        "https://api.example.com/agent",
        headers=headers,
        data=json.dumps(payload)
    )
    
    if response.status_code == 200:
        result = response.json()
        if result["success"]:
            return result["response"]
        else:
            return f"Error: {result['error']}"
    else:
        return f"HTTP Error: {response.status_code}"

# Example usage
summary = summarize_youtube_video(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "your_api_key_here"
)
print(summary)
```

### Integration with FastAPI Client
```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import httpx

app = FastAPI()
security = HTTPBearer()

class SummaryRequest(BaseModel):
    youtube_url: str

class SummaryResponse(BaseModel):
    summary: str
    video_title: str
    channel_name: str
    publish_date: str
    view_count: int
    duration: str

@app.post("/summarize", response_model=SummaryResponse)
async def summarize_video(
    request: SummaryRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Summarize a YouTube video."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.example.com/agent",
            headers={
                "Authorization": f"Bearer {credentials.credentials}",
                "Content-Type": "application/json"
            },
            json={
                "query": request.youtube_url,
                "user_id": "user123",
                "request_id": "req123",
                "session_id": "session123"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error from YouTube Summary Agent")
        
        result = response.json()
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Parse the response to extract structured information
        # This is a simplified example; actual parsing would depend on the response format
        summary_data = parse_summary_response(result["response"])
        
        return SummaryResponse(
            summary=summary_data["summary"],
            video_title=summary_data["title"],
            channel_name=summary_data["channel"],
            publish_date=summary_data["publish_date"],
            view_count=summary_data["views"],
            duration=summary_data["duration"]
        )
```

## Testing
The agent includes comprehensive testing for:
- URL format detection and ID extraction
- API integration with YouTube Data API
- Transcript retrieval and processing
- Summary generation quality
- Error handling for various edge cases

Tests are automated and run against various YouTube video types to ensure consistent performance across different content formats and lengths.
