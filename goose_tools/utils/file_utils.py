"""
Utility functions for the Goose Tools package
"""

import os
import json
import re
import shutil
from datetime import datetime
from pathlib import Path


def format_token_count(token_count):
    """Format token count with commas and abbreviations"""
    if token_count < 1000:
        return str(token_count)
    elif token_count < 1000000:
        return f"{token_count/1000:.1f}K"
    else:
        return f"{token_count/1000000:.1f}M"


def estimate_tokens(text):
    """Estimate token count from text (rough approximation)"""
    if not text:
        return 0
    # Simple approximation: ~4 characters per token
    return len(text) // 4


def bytes_to_human_readable(size_bytes):
    """Convert bytes to human-readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


def get_metadata(meta_file):
    """Parse metadata file and return a dictionary"""
    metadata = {}
    
    if not os.path.exists(meta_file):
        return metadata
    
    try:
        # First, try to parse as JSON
        if meta_file.endswith('.json'):
            with open(meta_file, 'r') as f:
                metadata = json.load(f)
        # Otherwise, parse as key-value pairs
        else:
            with open(meta_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            key, value = parts
                            metadata[key.strip()] = value.strip()
    except Exception:
        # Return empty dict if there's an error parsing
        pass
    
    return metadata


def sanitize_filename(filename):
    """Sanitize filename to ensure it's valid across platforms"""
    # Replace invalid characters with underscores
    sanitized = re.sub(r'[^\w\-.]', '_', filename)
    # Ensure filename isn't too long (max 255 chars for most filesystems)
    if len(sanitized) > 255:
        base, ext = os.path.splitext(sanitized)
        sanitized = base[:255-len(ext)] + ext
    return sanitized


def get_user_dirs():
    """Get standard user directories for the application"""
    home_dir = Path.home()
    
    # Data dirs
    data_dir = home_dir / ".local" / "share" / "goose"
    sessions_dir = data_dir / "sessions"
    session_meta_dir = data_dir / "session_meta"
    
    # Cache dirs
    cache_dir = home_dir / ".cache" / "goose"
    web_cache_dir = cache_dir / "web"
    extract_cache_dir = cache_dir / "extract"
    temp_dir = cache_dir / "tmp"
    
    # Config dirs
    config_dir = home_dir / ".config" / "goose"
    
    # Log dirs
    log_dir = data_dir / "logs"
    
    # Ensure directories exist
    for directory in [sessions_dir, session_meta_dir, web_cache_dir, 
                     extract_cache_dir, config_dir, log_dir, temp_dir]:
        directory.mkdir(parents=True, exist_ok=True)
    
    return {
        "home_dir": home_dir,
        "data_dir": data_dir,
        "sessions_dir": sessions_dir,
        "session_meta_dir": session_meta_dir,
        "cache_dir": cache_dir,
        "web_cache_dir": web_cache_dir,
        "extract_cache_dir": extract_cache_dir,
        "temp_dir": temp_dir,
        "config_dir": config_dir,
        "log_dir": log_dir,
    }


def parse_date(date_str):
    """Parse date string in various formats to datetime object"""
    formats = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y%m%d",
        "%Y%m%d_%H%M%S",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    raise ValueError(f"Could not parse date: {date_str}")


def ensure_directory(directory_path):
    """
    Ensure that a directory exists, creating it if necessary.
    
    Args:
        directory_path: Path to the directory to ensure.
        
    Returns:
        Path: The path to the directory.
    """
    directory = Path(directory_path)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def safe_write_file(file_path, content, backup=False):
    """
    Safely write content to a file, optionally creating a backup.
    
    Args:
        file_path: Path to the file to write.
        content: Content to write to the file.
        backup: Whether to create a backup before writing.
        
    Returns:
        bool: True if the file was written successfully, False otherwise.
    """
    file_path = Path(file_path)
    
    # Create parent directory if it doesn't exist
    ensure_directory(file_path.parent)
    
    # Create a backup if requested
    if backup and file_path.exists():
        backup_path = f"{file_path}.bak"
        shutil.copy2(file_path, backup_path)
    
    try:
        # Use atomic write pattern
        temp_path = f"{file_path}.tmp"
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Rename to target file
        os.replace(temp_path, file_path)
        return True
    except Exception as e:
        print(f"Error writing to {file_path}: {str(e)}")
        return False


def list_files_with_info(directory, pattern=None, recursive=True):
    """
    List files in a directory with additional information.
    
    Args:
        directory: Directory to list files from.
        pattern: Optional regex pattern to filter files.
        recursive: Whether to search subdirectories recursively.
        
    Returns:
        list: List of dictionaries with file information.
    """
    directory = Path(directory)
    
    # Compile regex pattern if provided
    regex = re.compile(pattern) if pattern else None
    
    result = []
    
    if recursive:
        paths = directory.glob('**/*')
    else:
        paths = directory.glob('*')
    
    for path in paths:
        if path.is_file():
            # Skip if pattern is provided and doesn't match
            if regex and not regex.search(path.name):
                continue
            
            # Get file info
            stat = path.stat()
            
            # Add to result
            result.append({
                "path": path,
                "size": stat.st_size,
                "mtime": datetime.fromtimestamp(stat.st_mtime),
                "ctime": datetime.fromtimestamp(stat.st_ctime),
            })
    
    return result


def read_json_file(file_path, default=None):
    """
    Read a JSON file and return its contents.
    
    Args:
        file_path: Path to the JSON file.
        default: Default value to return if file doesn't exist or can't be parsed.
        
    Returns:
        dict: The JSON content as a dictionary, or the default value.
    """
    if default is None:
        default = {}
        
    file_path = Path(file_path)
    
    if not file_path.exists():
        return default
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error reading JSON file {file_path}: {str(e)}")
        return default


def write_json_file(file_path, data, indent=2, backup=False):
    """
    Write data to a JSON file.
    
    Args:
        file_path: Path to the JSON file.
        data: Data to write to the file.
        indent: Number of spaces for indentation in the output JSON.
        backup: Whether to create a backup before writing.
        
    Returns:
        bool: True if the file was written successfully, False otherwise.
    """
    file_path = Path(file_path)
    
    # Convert to JSON string
    try:
        json_str = json.dumps(data, indent=indent, ensure_ascii=False)
    except TypeError as e:
        print(f"Error serializing JSON for {file_path}: {str(e)}")
        return False
        
    # Use safe_write_file to handle the actual writing
    return safe_write_file(file_path, json_str, backup=backup)