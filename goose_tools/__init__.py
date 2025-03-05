"""
Goose Context Management Tools for optimizing LLM sessions.

This package provides tools to manage, clean, and optimize context for 
large language model interactions, especially for the Goose CLI.
"""

__version__ = "0.1.0"

from goose_tools.utils.file_utils import (
    ensure_directory,
    get_user_dirs,
    get_metadata,
    sanitize_filename,
    bytes_to_human_readable,
    read_json_file,
    write_json_file,
    safe_write_file,
    format_token_count,
    parse_date
)

from goose_tools.utils.token_counter import (
    estimate_tokens_chars,
    estimate_tokens_claude,
    estimate_tokens_openai,
    count_tokens_in_jsonl
)

from goose_tools.utils.text_processing import (
    clean_html,
    extract_code_blocks,
    extract_links,
    summarize_text,
    extract_sections
)

# API creation function - commented out to avoid circular import
# from goose_tools.api.app import create_app

__all__ = [
    # Version
    "__version__",
    
    # File utils
    "ensure_directory",
    "get_user_dirs",
    "get_metadata",
    "sanitize_filename",
    "bytes_to_human_readable",
    "read_json_file",
    "write_json_file",
    "safe_write_file",
    "format_token_count",
    "parse_date",
    
    # Token counting
    "estimate_tokens_chars",
    "estimate_tokens_claude",
    "estimate_tokens_openai",
    "count_tokens_in_jsonl"
]