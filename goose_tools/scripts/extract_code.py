#!/usr/bin/env python3
"""
Extract key components from code files while minimizing token usage.

This module provides functionality to extract important parts of code files
in a format optimized for LLM context, with options to filter by function,
remove boilerplate, and focus on the most relevant sections.
"""

import os
import sys
import argparse
import re
from pathlib import Path

from goose_tools.utils.file_utils import safe_write_file, ensure_directory, get_user_dirs
from goose_tools.utils.token_counter import estimate_tokens_chars


def detect_language(file_path):
    """Detect the programming language from a file extension.
    
    Args:
        file_path: Path to the code file.
        
    Returns:
        str: The detected language or 'text' if unknown.
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    language_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.jsx': 'javascript',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cc': 'cpp',
        '.h': 'c',
        '.hpp': 'cpp',
        '.cs': 'csharp',
        '.go': 'go',
        '.rb': 'ruby',
        '.php': 'php',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.m': 'objective-c',
        '.mm': 'objective-c',
        '.pl': 'perl',
        '.sh': 'bash',
        '.bash': 'bash',
        '.r': 'r',
        '.json': 'json',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.sql': 'sql',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.md': 'markdown',
    }
    
    return language_map.get(ext, 'text')


def extract_imports(content, language):
    """Extract import statements from the code.
    
    Args:
        content: The code content.
        language: The programming language.
        
    Returns:
        list: Lines containing import statements.
    """
    import_patterns = {
        'python': r'^\s*(import|from)\s+.+',
        'javascript': r'^\s*(import|require).+',
        'typescript': r'^\s*(import|require).+',
        'java': r'^\s*(import|package)\s+.+',
        'rust': r'^\s*(use|extern\s+crate)\s+.+',
        'go': r'^\s*(import|package)\s+.+',
    }
    
    pattern = import_patterns.get(language, r'^\s*(import|include|require|use|#include)')
    regex = re.compile(pattern)
    
    lines = content.splitlines()
    imports = []
    
    for line in lines:
        if regex.match(line):
            imports.append(line)
    
    return imports


def extract_functions(content, language, full_functions=False, pattern=None):
    """Extract function or class definitions.
    
    Args:
        content: The code content.
        language: The programming language.
        full_functions: Whether to include full function bodies.
        pattern: Optional pattern to filter functions.
        
    Returns:
        list: Lines containing function definitions.
    """
    lines = content.splitlines()
    
    # Language-specific function patterns
    func_patterns = {
        'python': r'^\s*(def|class)\s+\w+.*:',
        'javascript': r'^\s*(function|class|const\s+\w+\s*=\s*(\(\)|function|async|.*=>))',
        'typescript': r'^\s*(function|class|interface|const\s+\w+\s*=\s*(\(\)|function|async|.*=>))',
        'java': r'^\s*(public|private|protected|static|final)?\s*\w+(\s+\w+)*\s+\w+\s*\(.*\)\s*\{?',
        'rust': r'^\s*(pub|fn|struct|enum|impl|trait)\s+\w+.*',
        'go': r'^\s*(func|type)\s+\w+.*',
    }
    
    pattern_str = func_patterns.get(language, r'^\s*\w+\s+\w+\s*\(')
    if pattern:
        pattern_str = pattern
    
    regex = re.compile(pattern_str)
    
    functions = []
    in_function = False
    func_start = 0
    brace_count = 0
    
    for i, line in enumerate(lines):
        # Check if line is a function definition
        if regex.match(line):
            if full_functions:
                in_function = True
                func_start = i
                brace_count = line.count('{') - line.count('}')
                functions.append(line)
            else:
                functions.append(line)
        
        # If collecting full functions, handle braces to find the end
        elif full_functions and in_function:
            brace_count += line.count('{') - line.count('}')
            functions.append(line)
            
            # Check for function end based on language
            if language in ['python']:
                # For Python, check for dedentation
                if i + 1 < len(lines) and not lines[i + 1].startswith(' ') and lines[i]:
                    in_function = False
                    functions.append('')
            elif brace_count <= 0 and '}' in line:
                in_function = False
                functions.append('')
    
    return functions


def extract_comments(content, language):
    """Extract important comments from the code.
    
    Args:
        content: The code content.
        language: The programming language.
        
    Returns:
        list: Lines containing significant comments.
    """
    comment_patterns = {
        'python': r'^\s*#\s*(?!.*?\bignore\b|.*?\blint\b).*',
        'javascript': r'^\s*(//|/\*\*?)\s*(?!.*?\bignore\b|.*?\beslint\b).*',
        'typescript': r'^\s*(//|/\*\*?)\s*(?!.*?\bignore\b|.*?\beslint\b).*',
        'java': r'^\s*(//|/\*\*?)\s*(?!.*?\bignore\b).*',
        'rust': r'^\s*(//|/\*)\s*(?!.*?\bignore\b).*',
        'go': r'^\s*(//|/\*)\s*(?!.*?\bignore\b).*',
    }
    
    pattern = comment_patterns.get(language, r'^\s*(//|#|/\*)')
    regex = re.compile(pattern)
    
    lines = content.splitlines()
    comments = []
    in_multiline = False
    
    for line in lines:
        if in_multiline:
            comments.append(line)
            if '*/' in line:
                in_multiline = False
                comments.append('')
        elif regex.match(line):
            if '/*' in line and '*/' not in line:
                in_multiline = True
            comments.append(line)
        elif '/**' in line or '/*' in line:
            in_multiline = True
            comments.append(line)
    
    return comments


def extract_sample_lines(content, max_lines=50):
    """Extract a sample of lines from the code.
    
    Args:
        content: The code content.
        max_lines: Maximum number of lines to extract.
        
    Returns:
        list: A sample of lines from the code.
    """
    lines = content.splitlines()
    total_lines = len(lines)
    
    if total_lines <= max_lines:
        return lines
    
    # Take lines from the beginning, middle, and end
    begin_lines = max_lines // 3
    middle_lines = max_lines // 3
    end_lines = max_lines - begin_lines - middle_lines
    
    sample = []
    
    # Beginning
    sample.extend(lines[:begin_lines])
    sample.append('...')
    
    # Middle
    middle_start = (total_lines - middle_lines) // 2
    sample.extend(lines[middle_start:middle_start + middle_lines])
    sample.append('...')
    
    # End
    sample.extend(lines[-end_lines:])
    
    return sample


def main():
    """Main entry point for the extract_code tool."""
    parser = argparse.ArgumentParser(
        description="Extract key components from code files while minimizing token usage"
    )
    parser.add_argument("file_path", help="File path to extract content from")
    parser.add_argument("output_file", nargs="?", help="Output file (optional)")
    parser.add_argument("--lang", help="Force a specific language (auto-detected by default)")
    parser.add_argument("--no-imports", action="store_true", help="Skip importing/dependency section")
    parser.add_argument("--no-functions", action="store_true", help="Skip function/class definitions section")
    parser.add_argument("--no-comments", action="store_true", help="Skip important comments section")
    parser.add_argument("--no-sample", action="store_true", help="Skip sample lines section")
    parser.add_argument("--pattern", help="Add a custom extraction pattern")
    parser.add_argument("--full-functions", action="store_true", help="Extract complete function bodies, not just signatures")
    parser.add_argument("--max-lines", type=int, default=50, help="Maximum number of lines to extract")
    
    # Handle the case when called from shell script
    if len(sys.argv) > 1 and sys.argv[1].startswith('--'):
        # The first argument is an option, not a file path
        args = parser.parse_args(["/tmp/example.py"] + sys.argv[1:])
        if args.file_path == "/tmp/example.py":
            print("Error: No file path specified")
            parser.print_help()
            sys.exit(1)
    else:
        args = parser.parse_args()
    
    try:
        with open(args.file_path, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        sys.exit(1)
    
    # Detect language or use the specified one
    language = args.lang or detect_language(args.file_path)
    
    # Default output file if not specified
    output_file = args.output_file or f"{os.path.splitext(os.path.basename(args.file_path))[0]}_extract.txt"
    
    # Get user directories
    user_dirs = get_user_dirs()
    temp_dir = Path(user_dirs["temp_dir"])
    
    # Create necessary directories
    ensure_directory(temp_dir)
    
    print(f"Extracting code from {args.file_path} to {output_file}...")
    
    # Extract components
    output = [
        f"# Code Extraction - {os.path.basename(args.file_path)}",
        f"# Language: {language}",
        f"# Date: {os.path.getmtime(args.file_path)}",
        f"# File size: {os.path.getsize(args.file_path)} bytes",
        ""
    ]
    
    # Add imports section
    if not args.no_imports:
        imports = extract_imports(content, language)
        if imports:
            output.append("## Imports and Dependencies")
            output.extend(imports)
            output.append("")
    
    # Add functions section
    if not args.no_functions:
        functions = extract_functions(content, language, args.full_functions, args.pattern)
        if functions:
            output.append("## Function and Class Definitions")
            output.extend(functions)
            output.append("")
    
    # Add comments section
    if not args.no_comments:
        comments = extract_comments(content, language)
        if comments:
            output.append("## Important Comments")
            output.extend(comments)
            output.append("")
    
    # Add sample lines
    if not args.no_sample:
        sample = extract_sample_lines(content, args.max_lines)
        if sample:
            output.append("## Code Sample")
            output.extend(sample)
            output.append("")
    
    # Write to file
    final_content = '\n'.join(output)
    safe_write_file(output_file, final_content)
    
    # Get token estimation
    token_estimate = estimate_tokens_chars(final_content)
    
    print("Extraction complete.")
    print(f"Estimated tokens: ~{token_estimate}")
    print(f"File saved to: {output_file}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 