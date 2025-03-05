#!/usr/bin/env python3
"""Test script for verifying Goose Tools package structure"""

import os
import sys
import importlib.util

# Add the parent directory to the path so we can import goose_tools
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def check_import(module_name):
    """Check if a module can be imported"""
    try:
        importlib.import_module(module_name)
        print(f"✓ {module_name} imported successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to import {module_name}: {str(e)}")
        return False

def main():
    """Main function to verify package structure"""
    print("Testing Goose Tools Package Structure")
    print("====================================")
    
    # Check main package
    if not check_import('goose_tools'):
        print("ERROR: Main package import failed. Check your PYTHONPATH or package structure.")
        return 1
    
    # Check submodules
    modules = [
        'goose_tools.api',
        'goose_tools.utils',
        'goose_tools.utils.file_utils',
        'goose_tools.utils.token_counter',
        'goose_tools.utils.text_processing',
    ]
    
    all_passed = True
    for module in modules:
        if not check_import(module):
            all_passed = False
    
    # Try some utility functions
    try:
        from goose_tools.utils import format_token_count, estimate_tokens, clean_html
        
        # Test token formatting
        token_count = 12345
        formatted = format_token_count(token_count)
        print(f"✓ format_token_count: {token_count} -> {formatted}")
        
        # Test token estimation
        text = "This is a sample text to estimate tokens."
        estimated = estimate_tokens(text)
        print(f"✓ estimate_tokens: '{text}' -> {estimated} tokens")
        
        # Test HTML cleaning
        html = "<h1>Title</h1><p>This is <b>some</b> HTML.</p>"
        cleaned = clean_html(html)
        print(f"✓ clean_html: '{html}' -> '{cleaned}'")
        
    except Exception as e:
        print(f"✗ Error testing utility functions: {str(e)}")
        all_passed = False
    
    if all_passed:
        print("\nAll package structure tests passed!")
        return 0
    else:
        print("\nSome package structure tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())