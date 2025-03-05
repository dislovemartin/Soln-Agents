#!/usr/bin/env python3
"""
High-performance text processing utilities for agents using Rust extensions.

This module provides optimized text processing functions for token counting,
text chunking, and other operations using Rust extensions when available.
Falls back to Python implementations when Rust extensions are not available.
"""

import sys
import os
import time
from typing import List, Dict, Any, Optional, Union

# Try to import Rust extensions for performance optimization
try:
    # First try to import from the installed location
    try:
        from octotools_rs import octotools_rs
        RUST_EXTENSIONS_AVAILABLE = True
        print("✅ Using high-performance Rust extensions for text processing")
    except ImportError:
        # Try to import from the build directory
        sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                    "../../../octotools/rust_tools/octotools_rs/target/release"))
        import octotools_rs
        RUST_EXTENSIONS_AVAILABLE = True
        print("✅ Using high-performance Rust extensions from build directory")
    
    # Check if the expected classes are available
    if hasattr(octotools_rs, 'TokenCounter') and hasattr(octotools_rs, 'TextProcessor'):
        # Initialize token counter and text processor
        token_counter = octotools_rs.TokenCounter()
        text_processor = octotools_rs.TextProcessor()
    else:
        # Fall back to Python implementation
        RUST_EXTENSIONS_AVAILABLE = False
        print("⚠️ Rust extension loaded but required classes not found, falling back to Python implementation")
        print(f"Available attributes: {dir(octotools_rs)}")
except ImportError:
    RUST_EXTENSIONS_AVAILABLE = False
    print("⚠️ Rust extensions not available, falling back to Python implementation")


class TextProcessor:
    """High-performance text processing utilities for agents."""
    
    @staticmethod
    def count_tokens(text: str, model_name: Optional[str] = None) -> int:
        """Count tokens in text using optimized implementation.
        
        Args:
            text: The text to count tokens in
            model_name: Optional model name for model-specific token counting
            
        Returns:
            int: Number of tokens in the text
        """
        if RUST_EXTENSIONS_AVAILABLE and hasattr(token_counter, 'count'):
            return token_counter.count(text)
        else:
            # Simple fallback implementation
            # In a real implementation, you would use a proper tokenizer
            return len(text.split())
    
    @staticmethod
    def count_tokens_batch(texts: List[str], model_name: Optional[str] = None) -> List[int]:
        """Count tokens in multiple texts using optimized batch implementation.
        
        Args:
            texts: List of texts to count tokens in
            model_name: Optional model name for model-specific token counting
            
        Returns:
            List[int]: List of token counts for each text
        """
        if RUST_EXTENSIONS_AVAILABLE and hasattr(token_counter, 'count_batch'):
            return token_counter.count_batch(texts)
        else:
            # Simple fallback implementation
            return [len(text.split()) for text in texts]
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, model_name: Optional[str] = None) -> List[str]:
        """Split text into chunks of specified token size.
        
        Args:
            text: The text to split into chunks
            chunk_size: Maximum number of tokens per chunk
            model_name: Optional model name for model-specific chunking
            
        Returns:
            List[str]: List of text chunks
        """
        if RUST_EXTENSIONS_AVAILABLE and hasattr(text_processor, 'chunk_text'):
            return text_processor.chunk_text(text, chunk_size)
        else:
            # Simple fallback implementation
            words = text.split()
            chunks = []
            current_chunk = []
            current_count = 0
            
            for word in words:
                current_chunk.append(word)
                current_count += 1
                
                if current_count >= chunk_size:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_count = 0
                    
            if current_chunk:
                chunks.append(" ".join(current_chunk))
                
            return chunks
    
    @staticmethod
    def chunk_text_batch(texts: List[str], chunk_size: int = 1000, model_name: Optional[str] = None) -> List[List[str]]:
        """Split multiple texts into chunks of specified token size.
        
        Args:
            texts: List of texts to split into chunks
            chunk_size: Maximum number of tokens per chunk
            model_name: Optional model name for model-specific chunking
            
        Returns:
            List[List[str]]: List of lists of text chunks
        """
        if RUST_EXTENSIONS_AVAILABLE and hasattr(octotools_rs, 'chunk_text_batch'):
            return octotools_rs.chunk_text_batch(texts, chunk_size, model_name)
        else:
            # Simple fallback implementation
            return [TextProcessor.chunk_text(text, chunk_size, model_name) for text in texts]
    
    @staticmethod
    def process_text(text: str, operations: List[str]) -> str:
        """Process text with various operations.
        
        Args:
            text: The text to process
            operations: List of operations to apply (e.g., ["lowercase", "trim"])
            
        Returns:
            str: Processed text
        """
        if RUST_EXTENSIONS_AVAILABLE and hasattr(text_processor, 'process'):
            return text_processor.process(text, operations)
        else:
            # Simple fallback implementation
            result = text
            for op in operations:
                if op == "lowercase":
                    result = result.lower()
                elif op == "uppercase":
                    result = result.upper()
                elif op == "trim":
                    result = result.strip()
            return result
    
    @staticmethod
    def process_text_batch(texts: List[str], operations: List[str]) -> List[str]:
        """Process multiple texts with the same operations.
        
        Args:
            texts: List of texts to process
            operations: List of operations to apply to each text
            
        Returns:
            List[str]: List of processed texts
        """
        if RUST_EXTENSIONS_AVAILABLE and hasattr(text_processor, 'process_batch'):
            return text_processor.process_batch(texts, operations)
        else:
            # Simple fallback implementation
            return [TextProcessor.process_text(text, operations) for text in texts]


# Performance benchmark function
def benchmark_text_processing(text: str, iterations: int = 100):
    """Benchmark text processing performance.
    
    Args:
        text: Text to use for benchmarking
        iterations: Number of iterations for benchmarking
    """
    print("\n=== Text Processing Benchmark ===")
    
    # Benchmark token counting
    start_time = time.time()
    for _ in range(iterations):
        token_count = TextProcessor.count_tokens(text)
    token_count_time = time.time() - start_time
    
    print(f"Text length: {len(text)} characters")
    print(f"Token count: {token_count}")
    print(f"Token counting time: {token_count_time:.6f}s for {iterations} iterations")
    
    # Benchmark text chunking
    start_time = time.time()
    for _ in range(10):  # Fewer iterations for chunking as it's more expensive
        chunks = TextProcessor.chunk_text(text, 1000)
    chunk_time = time.time() - start_time
    
    print(f"Number of chunks: {len(chunks)}")
    print(f"Text chunking time: {chunk_time:.6f}s for 10 iterations")


# Simple test function
def test():
    """Test the text processor functionality."""
    text = "This is a test text for the high-performance text processor. " * 100
    
    # Test token counting
    token_count = TextProcessor.count_tokens(text)
    print(f"Token count: {token_count}")
    
    # Test text chunking
    chunks = TextProcessor.chunk_text(text, 50)
    print(f"Number of chunks: {len(chunks)}")
    print(f"First chunk: {chunks[0][:50]}...")
    
    # Test text processing
    processed = TextProcessor.process_text("  TEST TEXT  ", ["lowercase", "trim"])
    print(f"Processed text: '{processed}'")
    
    # Run benchmark
    benchmark_text_processing(text)


if __name__ == "__main__":
    test()
