#!/usr/bin/env python3
"""
Simple Interpreted Programming Language

This file serves as the entry point for our interpreter.
"""

import sys
from interpreter.lexer.lexer import Lexer
from interpreter.parser.parser import Parser
from interpreter.interpreter.interpreter import Interpreter
from interpreter.interpreter.resolver import Resolver

def run_file(file_path):
    """Run the interpreter on a file."""
    with open(file_path, 'r') as file:
        source = file.read()
    run(source)

def run_prompt():
    """Run the interpreter in interactive mode."""
    interpreter = Interpreter()
    
    while True:
        try:
            line = input("> ")
            if not line:
                continue
            if line.lower() in ['exit', 'quit']:
                break
            run(line, interpreter)
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")

def run(source, interpreter=None):
    """Run the interpreter on a source string."""
    if interpreter is None:
        interpreter = Interpreter()
    
    # Tokenize the source code
    lexer = Lexer(source)
    tokens = lexer.scan_tokens()
    
    # Parse the tokens into an AST
    parser = Parser(tokens)
    statements = parser.parse()
    
    if not statements:
        return
    
    # Resolve variables
    resolver = Resolver(interpreter)
    resolver.resolve(statements)
    
    # Interpret the AST
    interpreter.interpret(statements)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_file(sys.argv[1])
    else:
        run_prompt()