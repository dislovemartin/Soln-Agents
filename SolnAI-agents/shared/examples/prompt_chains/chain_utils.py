"""
Prompt Chain Utilities

This module provides common utilities and components for building prompt chains,
including output parsers, prompt templates, and chain evaluation metrics.
"""

import re
import json
import time
from typing import Dict, Any, List, Optional, Union, Callable, TypeVar, Generic, cast
from enum import Enum

T = TypeVar('T')

class OutputFormat(Enum):
    """Enumeration of supported output formats."""
    FREE_TEXT = "free_text"
    JSON = "json"
    YAML = "yaml"
    MARKDOWN = "markdown"
    CSV = "csv"

class ParseError(Exception):
    """Exception raised when parsing output fails."""
    pass

class OutputParser(Generic[T]):
    """Base class for output parsers that convert LLM text output to structured data."""
    
    def parse(self, text: str) -> T:
        """
        Parse the text output from an LLM into a structured format.
        
        Args:
            text: The raw text output from the LLM
            
        Returns:
            Parsed output in the target format
            
        Raises:
            ParseError: If parsing fails
        """
        raise NotImplementedError("Subclasses must implement parse()")
    
    def get_format_instructions(self) -> str:
        """
        Get instructions for the LLM on how to format its output.
        
        Returns:
            String with formatting instructions
        """
        raise NotImplementedError("Subclasses must implement get_format_instructions()")

class JsonOutputParser(OutputParser[Dict[str, Any]]):
    """Parser for JSON formatted output."""
    
    def __init__(self, schema: Optional[Dict[str, Any]] = None):
        """
        Initialize the JSON output parser.
        
        Args:
            schema: Optional JSON schema to validate against
        """
        self.schema = schema
    
    def parse(self, text: str) -> Dict[str, Any]:
        """
        Parse JSON from text output.
        
        Args:
            text: Text containing JSON
            
        Returns:
            Parsed JSON as a dictionary
            
        Raises:
            ParseError: If JSON parsing fails
        """
        # Try to find JSON in the text
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Look for JSON objects without code blocks
            json_match = re.search(r'(\{[\s\S]*\})', text)
            if json_match:
                json_str = json_match.group(1)
            else:
                raise ParseError("Could not find JSON in the output")
        
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError as e:
            raise ParseError(f"Failed to parse JSON: {str(e)}")
    
    def get_format_instructions(self) -> str:
        """
        Get instructions for formatting JSON output.
        
        Returns:
            String with JSON formatting instructions
        """
        instructions = "Respond with a JSON object in the following format:\n\n```json\n{\n"
        
        if self.schema and "properties" in self.schema:
            for prop, details in self.schema["properties"].items():
                prop_type = details.get("type", "string")
                description = details.get("description", "")
                instructions += f'  "{prop}": {{"type": "{prop_type}"}}  // {description}\n'
        else:
            instructions += '  "key1": "value1",\n  "key2": "value2"\n'
        
        instructions += "}\n```"
        return instructions

class ListOutputParser(OutputParser[List[str]]):
    """Parser for list formatted output."""
    
    def __init__(self, item_pattern: str = r'^\s*[-*]\s+(.+)$'):
        """
        Initialize the list output parser.
        
        Args:
            item_pattern: Regex pattern to match list items
        """
        self.item_pattern = item_pattern
    
    def parse(self, text: str) -> List[str]:
        """
        Parse a list from text output.
        
        Args:
            text: Text containing a list
            
        Returns:
            List of extracted items
            
        Raises:
            ParseError: If list parsing fails
        """
        items = []
        for line in text.split('\n'):
            match = re.match(self.item_pattern, line)
            if match:
                items.append(match.group(1).strip())
        
        if not items:
            # Try to find a numbered list
            numbered_pattern = r'^\s*\d+\.\s+(.+)$'
            for line in text.split('\n'):
                match = re.match(numbered_pattern, line)
                if match:
                    items.append(match.group(1).strip())
        
        if not items:
            raise ParseError("Could not find a list in the output")
        
        return items
    
    def get_format_instructions(self) -> str:
        """
        Get instructions for formatting list output.
        
        Returns:
            String with list formatting instructions
        """
        return "Respond with a bullet-point list, with each item on a new line starting with '- ' or '* '."

class KeyValueOutputParser(OutputParser[Dict[str, str]]):
    """Parser for key-value formatted output."""
    
    def __init__(self, separator: str = ":"):
        """
        Initialize the key-value output parser.
        
        Args:
            separator: The separator between keys and values
        """
        self.separator = separator
    
    def parse(self, text: str) -> Dict[str, str]:
        """
        Parse key-value pairs from text output.
        
        Args:
            text: Text containing key-value pairs
            
        Returns:
            Dictionary of key-value pairs
            
        Raises:
            ParseError: If parsing fails
        """
        result = {}
        for line in text.split('\n'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            parts = line.split(self.separator, 1)
            if len(parts) == 2:
                key = parts[0].strip()
                value = parts[1].strip()
                result[key] = value
        
        if not result:
            raise ParseError("Could not find key-value pairs in the output")
        
        return result
    
    def get_format_instructions(self) -> str:
        """
        Get instructions for formatting key-value output.
        
        Returns:
            String with key-value formatting instructions
        """
        return f"Respond with key-value pairs, one per line, with keys and values separated by '{self.separator}'."

class PromptTemplate:
    """Template for generating prompts with variable substitution."""
    
    def __init__(self, template: str, input_variables: List[str]):
        """
        Initialize the prompt template.
        
        Args:
            template: The template string with {variable} placeholders
            input_variables: List of variable names expected in the template
        """
        self.template = template
        self.input_variables = input_variables
    
    def format(self, **kwargs: Any) -> str:
        """
        Format the template with the provided variables.
        
        Args:
            **kwargs: The variables to substitute in the template
            
        Returns:
            Formatted prompt string
            
        Raises:
            KeyError: If a required variable is missing
        """
        # Check that all required variables are provided
        missing_vars = set(self.input_variables) - set(kwargs.keys())
        if missing_vars:
            raise KeyError(f"Missing variables: {', '.join(missing_vars)}")
        
        # Format the template
        return self.template.format(**kwargs)

class ChainMetrics:
    """Utility for tracking and computing metrics for prompt chains."""
    
    def __init__(self):
        """Initialize the chain metrics tracker."""
        self.step_times: Dict[str, List[float]] = {}
        self.step_token_counts: Dict[str, List[int]] = {}
        self.current_step: Optional[str] = None
        self.step_start_time: Optional[float] = None
    
    def start_step(self, step_name: str) -> None:
        """
        Start timing a step.
        
        Args:
            step_name: Name of the step
        """
        self.current_step = step_name
        self.step_start_time = time.time()
    
    def end_step(self, token_count: Optional[int] = None) -> None:
        """
        End timing for the current step and record metrics.
        
        Args:
            token_count: Optional count of tokens used in this step
        """
        if self.current_step is None or self.step_start_time is None:
            return
        
        elapsed = time.time() - self.step_start_time
        
        if self.current_step not in self.step_times:
            self.step_times[self.current_step] = []
        self.step_times[self.current_step].append(elapsed)
        
        if token_count is not None:
            if self.current_step not in self.step_token_counts:
                self.step_token_counts[self.current_step] = []
            self.step_token_counts[self.current_step].append(token_count)
        
        self.current_step = None
        self.step_start_time = None
    
    def get_step_avg_time(self, step_name: str) -> Optional[float]:
        """
        Get the average time for a step.
        
        Args:
            step_name: Name of the step
            
        Returns:
            Average time in seconds, or None if no data
        """
        times = self.step_times.get(step_name, [])
        if not times:
            return None
        return sum(times) / len(times)
    
    def get_total_time(self) -> float:
        """
        Get the total time across all steps.
        
        Returns:
            Total time in seconds
        """
        return sum(sum(times) for times in self.step_times.values())
    
    def get_total_tokens(self) -> int:
        """
        Get the total token count across all steps.
        
        Returns:
            Total token count
        """
        return sum(sum(counts) for counts in self.step_token_counts.values())
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all metrics.
        
        Returns:
            Dictionary with metric summary
        """
        total_time = self.get_total_time()
        total_tokens = self.get_total_tokens()
        
        steps_summary = {}
        for step_name in self.step_times:
            avg_time = self.get_step_avg_time(step_name)
            avg_tokens = None
            if step_name in self.step_token_counts:
                tokens = self.step_token_counts[step_name]
                avg_tokens = sum(tokens) / len(tokens) if tokens else None
            
            steps_summary[step_name] = {
                "avg_time": avg_time,
                "avg_tokens": avg_tokens,
                "call_count": len(self.step_times[step_name])
            }
        
        return {
            "total_time": total_time,
            "total_tokens": total_tokens,
            "steps": steps_summary
        }

def create_chain_step(
    name: str,
    system_prompt: str,
    user_prompt_template: str,
    output_key: str,
    output_parser: Optional[OutputParser] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> Dict[str, Any]:
    """
    Create a standard chain step configuration.
    
    Args:
        name: Name of the step
        system_prompt: System prompt for the step
        user_prompt_template: Template for the user prompt
        output_key: Key to store the output under
        output_parser: Optional parser for the output
        temperature: Temperature for generation
        max_tokens: Maximum tokens for generation
        
    Returns:
        Step configuration dictionary
    """
    step = {
        "name": name,
        "system_prompt": system_prompt,
        "user_prompt_template": user_prompt_template,
        "output_key": output_key,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    if output_parser:
        # Add format instructions to the system prompt
        format_instructions = output_parser.get_format_instructions()
        step["system_prompt"] = f"{system_prompt}\n\n{format_instructions}"
        
        # Add the parser
        step["output_parser"] = output_parser
    
    return step
