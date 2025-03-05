#!/usr/bin/env python3
"""
Text Processing Node for SolnAI Agent Builder

This node provides high-performance text processing capabilities using Rust extensions
when available, with fallback to Python implementations.
"""

import sys
import os
import json
from typing import Dict, Any, List, Optional, Union

# Add shared utils to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../shared/utils"))

# Import the text processor
from text_processor import TextProcessor


class TextProcessingNode:
    """Node for processing text with high-performance Rust extensions."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the text processing node.
        
        Args:
            config: Configuration for the node
        """
        self.config = config
        self.input_variable = config.get("inputVariable", "")
        self.operations = config.get("operations", ["count_tokens"])
        self.chunk_size = config.get("chunkSize", 1000)
        self.model_name = config.get("modelName", None)
        self.use_rust_extensions = config.get("useRustExtensions", True)
        self.result_variable = config.get("resultVariable", "")
    
    def process(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        """Process text based on the configured operations.
        
        Args:
            variables: Dictionary of variables from the flow
            
        Returns:
            Dict[str, Any]: Updated variables dictionary
        """
        # Check if input variable exists
        if not self.input_variable or self.input_variable not in variables:
            return variables
        
        input_text = variables[self.input_variable]
        
        # Skip processing if input is not a string
        if not isinstance(input_text, str):
            variables[self.result_variable] = input_text
            return variables
        
        result = {}
        
        # Process based on operations
        for operation in self.operations:
            if operation == "count_tokens":
                result["token_count"] = TextProcessor.count_tokens(input_text, self.model_name)
            
            elif operation == "chunk":
                result["chunks"] = TextProcessor.chunk_text(
                    input_text, 
                    self.chunk_size, 
                    self.model_name
                )
            
            elif operation == "lowercase":
                input_text = input_text.lower()
            
            elif operation == "uppercase":
                input_text = input_text.upper()
            
            elif operation == "trim":
                input_text = input_text.strip()
            
            elif operation == "remove_html":
                # Use Rust extension if available, otherwise use simple Python implementation
                if hasattr(TextProcessor, "remove_html") and self.use_rust_extensions:
                    input_text = TextProcessor.remove_html(input_text)
                else:
                    # Simple HTML tag removal (not comprehensive)
                    import re
                    input_text = re.sub(r'<[^>]*>', '', input_text)
            
            elif operation == "extract_keywords":
                # Use Rust extension if available, otherwise use simple Python implementation
                if hasattr(TextProcessor, "extract_keywords") and self.use_rust_extensions:
                    result["keywords"] = TextProcessor.extract_keywords(input_text)
                else:
                    # Simple keyword extraction (not comprehensive)
                    import re
                    from collections import Counter
                    words = re.findall(r'\w+', input_text.lower())
                    # Filter out common words
                    stopwords = {"the", "a", "an", "and", "or", "but", "is", "are", "was", "were"}
                    filtered_words = [word for word in words if word not in stopwords and len(word) > 3]
                    # Count occurrences
                    word_counts = Counter(filtered_words)
                    # Get top 10 keywords
                    result["keywords"] = [word for word, _ in word_counts.most_common(10)]
        
        # Set the processed text as the result
        result["text"] = input_text
        
        # Store the result in the specified variable
        if self.result_variable:
            variables[self.result_variable] = result
        
        return variables


# For testing
def test():
    """Test the text processing node."""
    # Sample configuration
    config = {
        "inputVariable": "input_text",
        "operations": ["count_tokens", "chunk", "lowercase"],
        "chunkSize": 50,
        "useRustExtensions": True,
        "resultVariable": "processed_text"
    }
    
    # Create node
    node = TextProcessingNode(config)
    
    # Sample variables
    variables = {
        "input_text": "This is a sample text for testing the text processing node. " * 10
    }
    
    # Process
    result_variables = node.process(variables)
    
    # Print results
    print(json.dumps(result_variables, indent=2))


if __name__ == "__main__":
    test()
