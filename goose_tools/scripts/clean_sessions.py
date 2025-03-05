#!/usr/bin/env python3
"""
Clean old or large session files to manage token usage and storage.

This module provides functionality to clean up session files based on
age, size, or other criteria, helping to manage storage and token usage
for LLM sessions.
"""

import os
import sys
import argparse
import json
import re
import shutil
from datetime import datetime, timedelta
from pathlib import Path

from goose_tools.utils.file_utils import get_user_dirs, ensure_directory, list_files_with_info, safe_write_file
from goose_tools.utils.token_counter import estimate_tokens_chars


def find_sessions(sessions_dir, pattern=None, recursive=True):
    """Find session files in the specified directory.
    
    Args:
        sessions_dir: The directory to search.
        pattern: Optional regex pattern to filter files.
        recursive: Whether to search subdirectories.
        
    Returns:
        list: Information about matched files (path, size, mtime).
    """
    # Compile regex pattern if provided
    regex = re.compile(pattern) if pattern else None
    
    # Get list of files with info
    files = list_files_with_info(sessions_dir, recursive=recursive)
    
    # Filter by pattern if provided
    if regex:
        files = [f for f in files if regex.search(f["path"].name)]
    
    return files


def analyze_session(file_path):
    """Analyze a session file to determine its content type and token usage.
    
    Args:
        file_path: Path to the session file.
        
    Returns:
        dict: Analysis information about the session.
    """
    result = {
        "path": file_path,
        "size": os.path.getsize(file_path),
        "mtime": datetime.fromtimestamp(os.path.getmtime(file_path)),
        "tokens": 0,
        "content_type": "unknown",
        "messages": 0
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Check if it's JSON
            try:
                data = json.loads(content)
                result["content_type"] = "json"
                
                # Check for common session structures
                if isinstance(data, list):
                    result["messages"] = len(data)
                elif isinstance(data, dict) and "messages" in data:
                    result["messages"] = len(data["messages"])
                
                # Estimate tokens for the entire content
                result["tokens"] = estimate_tokens_chars(content)
                
            except json.JSONDecodeError:
                # Not JSON, try to estimate tokens directly
                result["content_type"] = "text"
                result["tokens"] = estimate_tokens_chars(content)
    
    except Exception as e:
        print(f"Error analyzing {file_path}: {str(e)}")
    
    return result


def clean_sessions(sessions_dir, options):
    """Clean session files based on provided options.
    
    Args:
        sessions_dir: Directory containing session files.
        options: Dict with cleaning options.
        
    Returns:
        dict: Summary of cleaning actions taken.
    """
    # Find session files
    files = find_sessions(sessions_dir, options.get("pattern"), options.get("recursive", True))
    
    # Sort files by selected criterion
    if options.get("sort_by") == "size":
        files.sort(key=lambda x: x["size"], reverse=not options.get("sort_ascending", False))
    elif options.get("sort_by") == "name":
        files.sort(key=lambda x: x["path"].name, reverse=not options.get("sort_ascending", False))
    else:  # Default: sort by mtime
        files.sort(key=lambda x: x["mtime"], reverse=not options.get("sort_ascending", False))
    
    result = {
        "total_files": len(files),
        "deleted_files": 0,
        "archived_files": 0,
        "total_size_bytes": sum(f["size"] for f in files),
        "freed_space_bytes": 0,
        "errors": []
    }
    
    # Calculate cutoff date for age-based cleaning
    now = datetime.now()
    age_days = options.get("age_days")
    cutoff_date = now - timedelta(days=age_days) if age_days else None
    
    # Check size threshold
    max_size_mb = options.get("max_size_mb")
    size_threshold = max_size_mb * 1024 * 1024 if max_size_mb else None
    
    # Prepare archive directory if archiving
    archive_dir = None
    if options.get("archive"):
        archive_dir = Path(sessions_dir) / "archive"
        ensure_directory(archive_dir)
    
    # Process files based on options
    for file_info in files:
        file_path = file_info["path"]
        should_clean = False
        
        # Skip if file doesn't exist
        if not os.path.exists(file_path):
            continue
        
        # Check age criterion
        if cutoff_date and file_info["mtime"] < cutoff_date:
            should_clean = True
        
        # Check size criterion
        if size_threshold and file_info["size"] > size_threshold:
            should_clean = True
        
        # Check if we're cleaning a specific number of files
        if options.get("num_files") and result["deleted_files"] + result["archived_files"] < options.get("num_files"):
            should_clean = True
        
        # Skip if dry run
        if options.get("dry_run"):
            if should_clean:
                print(f"Would clean: {file_path} ({file_info['size'] / 1024 / 1024:.2f} MB, "
                      f"{(now - file_info['mtime']).days} days old)")
            continue
        
        # Clean the file if needed
        if should_clean:
            try:
                if archive_dir:
                    # Archive the file
                    target_path = archive_dir / file_path.name
                    i = 1
                    while target_path.exists():
                        target_path = archive_dir / f"{file_path.stem}_{i}{file_path.suffix}"
                        i += 1
                    
                    shutil.copy2(file_path, target_path)
                    os.remove(file_path)
                    result["archived_files"] += 1
                    print(f"Archived: {file_path} to {target_path}")
                else:
                    # Delete the file
                    os.remove(file_path)
                    result["deleted_files"] += 1
                    print(f"Deleted: {file_path}")
                
                result["freed_space_bytes"] += file_info["size"]
            
            except Exception as e:
                error_msg = f"Error cleaning {file_path}: {str(e)}"
                result["errors"].append(error_msg)
                print(error_msg)
    
    # Convert bytes to human-readable format for display
    result["total_size_mb"] = result["total_size_bytes"] / 1024 / 1024
    result["freed_space_mb"] = result["freed_space_bytes"] / 1024 / 1024
    
    return result


def main():
    """Main entry point for the clean_sessions tool."""
    parser = argparse.ArgumentParser(
        description="Clean old or large session files to manage token usage and storage"
    )
    
    parser.add_argument("--dir", help="Directory containing session files (default: user sessions directory)")
    parser.add_argument("--pattern", help="Regex pattern to match filenames")
    parser.add_argument("--age", type=int, help="Delete files older than this many days")
    parser.add_argument("--size", type=float, help="Delete files larger than this many MB")
    parser.add_argument("--num", type=int, help="Delete or archive this many files")
    parser.add_argument("--sort", choices=["date", "size", "name"], default="date", 
                        help="Sort criterion (default: date)")
    parser.add_argument("--archive", action="store_true", 
                        help="Archive files instead of deleting them")
    parser.add_argument("--dry-run", action="store_true", 
                        help="Show what would be deleted without actually deleting")
    parser.add_argument("--no-recursive", action="store_true", 
                        help="Don't search subdirectories")
    parser.add_argument("--ascending", action="store_true", 
                        help="Sort in ascending order (default: descending)")
    
    args = parser.parse_args()
    
    # Get user directories
    user_dirs = get_user_dirs()
    sessions_dir = Path(args.dir) if args.dir else Path(user_dirs["sessions_dir"])
    
    if not sessions_dir.exists():
        print(f"Error: Sessions directory {sessions_dir} does not exist.")
        return 1
    
    print(f"Cleaning sessions in {sessions_dir}...")
    
    # Build options dictionary
    options = {
        "pattern": args.pattern,
        "age_days": args.age,
        "max_size_mb": args.size,
        "num_files": args.num,
        "sort_by": args.sort,
        "sort_ascending": args.ascending,
        "archive": args.archive,
        "dry_run": args.dry_run,
        "recursive": not args.no_recursive
    }
    
    # Run cleaning
    result = clean_sessions(sessions_dir, options)
    
    # Print summary
    print("\nCleaning Summary:")
    print(f"Total session files scanned: {result['total_files']}")
    print(f"Total size of session files: {result['total_size_mb']:.2f} MB")
    
    if args.dry_run:
        print(f"Would clean: {result['deleted_files'] + result['archived_files']} files")
        print(f"Would free: {result['freed_space_mb']:.2f} MB")
    else:
        print(f"Cleaned: {result['deleted_files'] + result['archived_files']} files")
        if result['archived_files'] > 0:
            print(f"  - Archived: {result['archived_files']} files")
        if result['deleted_files'] > 0:
            print(f"  - Deleted: {result['deleted_files']} files")
        print(f"Freed space: {result['freed_space_mb']:.2f} MB")
    
    if result["errors"]:
        print(f"\nEncountered {len(result['errors'])} errors:")
        for error in result["errors"][:5]:  # Show only first 5 errors
            print(f"  - {error}")
        if len(result["errors"]) > 5:
            print(f"  - ... and {len(result['errors']) - 5} more errors")
    
    # Save metadata about this cleaning operation
    if not args.dry_run:
        metadata = {
            "date": datetime.now().isoformat(),
            "sessions_dir": str(sessions_dir),
            "options": options,
            "result": {k: v for k, v in result.items() if k != "errors"},
            "error_count": len(result["errors"])
        }
        
        # Get user directories
        metadata_dir = Path(user_dirs["data_dir"]) / "metadata"
        ensure_directory(metadata_dir)
        
        metadata_file = metadata_dir / f"clean_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        safe_write_file(metadata_file, json.dumps(metadata, indent=2))
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 