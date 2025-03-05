"""
Text processing utilities for Goose Tools
"""

import re
import html
from typing import List, Dict, Any, Optional


def clean_html(text: str) -> str:
    """
    Clean HTML content to plain text.
    
    Args:
        text: HTML text to clean
        
    Returns:
        Plain text content
    """
    # Replace common HTML entities
    text = html.unescape(text)
    
    # Remove scripts and style blocks
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    
    # Replace breaks with newlines
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'</?p>', '\n', text)
    
    # Replace other HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    
    # Remove extra spaces and normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Restore some paragraph breaks
    text = re.sub(r'(\.) ([A-Z])', r'.\n\1', text)
    
    return text.strip()


def extract_code_blocks(text: str) -> List[Dict[str, Any]]:
    """
    Extract code blocks from markdown text.
    
    Args:
        text: Markdown text
        
    Returns:
        List of dictionaries with language and code
    """
    # Match code blocks with language specification
    code_blocks = []
    pattern = r'```([a-zA-Z0-9_]*)\n(.*?)```'
    matches = re.finditer(pattern, text, re.DOTALL)
    
    for match in matches:
        language = match.group(1) or 'text'
        code = match.group(2).strip()
        code_blocks.append({
            'language': language,
            'code': code
        })
    
    return code_blocks


def extract_links(text: str) -> List[Dict[str, str]]:
    """
    Extract links from markdown or HTML text.
    
    Args:
        text: Text containing links
        
    Returns:
        List of dictionaries with url and text
    """
    links = []
    
    # Extract markdown links [text](url)
    markdown_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    for match in re.finditer(markdown_pattern, text):
        link_text = match.group(1)
        url = match.group(2)
        links.append({
            'text': link_text,
            'url': url
        })
    
    # Extract HTML links <a href="url">text</a>
    html_pattern = r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>'
    for match in re.finditer(html_pattern, text):
        url = match.group(1)
        link_text = match.group(2)
        links.append({
            'text': link_text,
            'url': url
        })
    
    return links


def summarize_text(text: str, max_length: int = 200) -> str:
    """
    Create a summary of the text.
    
    Args:
        text: Text to summarize
        max_length: Maximum length of the summary
        
    Returns:
        Summarized text
    """
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    if len(text) <= max_length:
        return text
    
    # Try to find a good cutoff point (at a sentence end)
    cutoff = max_length
    while cutoff > max_length // 2:
        if text[cutoff] in '.!?' and text[cutoff-1] not in '.!?':
            return text[:cutoff+1] + '...'
        cutoff -= 1
    
    # If no good cutoff found, just cut at max_length
    return text[:max_length] + '...'


def extract_sections(text: str, section_pattern: Optional[str] = None) -> Dict[str, str]:
    """
    Extract sections from text based on headings.
    
    Args:
        text: Text to process
        section_pattern: Regex pattern for section headings (default detects markdown headings)
        
    Returns:
        Dictionary of section name to content
    """
    if section_pattern is None:
        # Default to markdown heading pattern
        section_pattern = r'^#{1,6}\s+(.*?)$'
    
    sections = {}
    current_section = "default"
    current_content = []
    
    for line in text.split('\n'):
        heading_match = re.match(section_pattern, line)
        if heading_match:
            # Save previous section
            if current_content:
                sections[current_section] = '\n'.join(current_content).strip()
                current_content = []
            current_section = heading_match.group(1).strip()
        else:
            current_content.append(line)
    
    # Save the last section
    if current_content:
        sections[current_section] = '\n'.join(current_content).strip()
    
    return sections