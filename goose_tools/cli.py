#!/usr/bin/env python3
"""
CLI interface for Goose Context Management Tools.

This module provides a command-line interface to access all Goose Tools
functionality, including launching the API server, extracting web content,
cleaning sessions, and more.
"""

import argparse
import os
import sys
import subprocess
from pathlib import Path

def launch_api(args):
    """Launch the API server with the specified options."""
    from goose_tools.api.app import create_app, run_app
    app = create_app()
    run_app(app, host=args.host, port=args.port, debug=args.debug)

def extract_web(args):
    """Extract content from a web page."""
    # Import here to avoid circular imports
    from goose_tools.scripts.extract_web import main as extract_web_main
    sys.argv = [sys.argv[0]] + args.args
    extract_web_main()

def extract_code(args):
    """Extract code from a file."""
    from goose_tools.scripts.extract_code import main as extract_code_main
    sys.argv = [sys.argv[0]] + args.args
    extract_code_main()

def clean_sessions(args):
    """Clean old or large sessions."""
    from goose_tools.scripts.clean_sessions import main as clean_sessions_main
    sys.argv = [sys.argv[0]] + args.args
    clean_sessions_main()

def convert_content(args):
    """Convert content between formats."""
    from goose_tools.scripts.convert_content import main as convert_content_main
    sys.argv = [sys.argv[0]] + args.args
    convert_content_main()

def version(_):
    """Show the version information."""
    from goose_tools import __version__
    print(f"Goose Context Management Tools v{__version__}")

def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="Goose Context Management Tools"
    )
    parser.add_argument(
        "--version", action="store_true", help="Show version information"
    )

    subparsers = parser.add_subparsers(
        title="commands", dest="command", help="Command to run"
    )

    # API server command
    api_parser = subparsers.add_parser(
        "serve", help="Start the API server"
    )
    api_parser.add_argument(
        "--host", type=str, default="127.0.0.1", help="Host to bind to"
    )
    api_parser.add_argument(
        "--port", type=int, default=5000, help="Port to bind to"
    )
    api_parser.add_argument(
        "--debug", action="store_true", help="Enable debug mode"
    )
    api_parser.add_argument(
        "--no-browser", action="store_true", help="Don't open browser"
    )
    api_parser.set_defaults(func=launch_api)

    # Extract web command
    web_parser = subparsers.add_parser(
        "extract-web", help="Extract content from a webpage"
    )
    web_parser.add_argument(
        "args", nargs="*", help="Arguments to pass to the extract_web script"
    )
    web_parser.set_defaults(func=extract_web)

    # Extract code command
    code_parser = subparsers.add_parser(
        "extract-code", help="Extract code from a file"
    )
    code_parser.add_argument(
        "args", nargs="*", help="Arguments to pass to the extract_code script"
    )
    code_parser.set_defaults(func=extract_code)

    # Clean sessions command
    clean_parser = subparsers.add_parser(
        "clean", help="Clean old or large sessions"
    )
    clean_parser.add_argument(
        "args", nargs="*", help="Arguments to pass to the clean_sessions script"
    )
    clean_parser.set_defaults(func=clean_sessions)

    # Convert content command
    convert_parser = subparsers.add_parser(
        "convert", help="Convert content between formats"
    )
    convert_parser.add_argument(
        "args", nargs="*", help="Arguments to pass to the convert_content script"
    )
    convert_parser.set_defaults(func=convert_content)

    # Parse arguments
    args = parser.parse_args()

    # Show version if requested
    if args.version:
        version(args)
        return

    # No command specified, show help
    if not hasattr(args, "func"):
        parser.print_help()
        return

    # Run the appropriate function
    args.func(args)


if __name__ == "__main__":
    main()