# Goose Tools Reorganization

The Goose Tools project has been reorganized to follow a more structured and maintainable Python package layout. This document outlines the changes made and the new directory structure.

## New Directory Structure

```
goose_tools/
├── __init__.py                # Package initialization
├── api/                       # API components
│   ├── __init__.py
│   ├── app.py                 # Flask application
│   ├── static/                # Static resources
│   │   └── version.json
│   └── templates/             # HTML templates
│       ├── 404.html           # Error pages
│       ├── 500.html
│       ├── base.html          # Base template
│       ├── dashboard.html     # Web dashboard
│       └── error.html         # Generic error template
├── cli.py                     # Command-line interface
├── docs/                      # Documentation
│   ├── __init__.py
│   ├── API_README.md
│   └── prompt_template.md
├── launch_goose_tools.sh      # Script to launch the API server
├── README.md                  # Package documentation
├── requirements.txt           # Package dependencies
├── scripts/                   # Shell scripts
│   ├── __init__.py
│   ├── clean_sessions.sh
│   ├── extract_code.sh
│   ├── extract_web.sh
│   ├── goose_session.sh
│   └── goose_tools.sh
├── tests/                     # Test suite
│   ├── __init__.py
│   └── test_package.py        # Package structure test
└── utils/                     # Utility functions
    ├── __init__.py
    ├── file_utils.py          # File operations
    ├── text_processing.py     # Text manipulation utilities
    └── token_counter.py       # Token counting utilities
```

## Key Changes

1. **Proper Package Structure**: Code is now organized into a proper Python package with appropriate module structure.

2. **Separation of Concerns**: Functionality is separated into distinct modules:
   - `api`: Web API and server components
   - `scripts`: Shell scripts for command-line operation
   - `utils`: Reusable utility functions
   - `tests`: Test suite

3. **Improved API**: The Flask API has been enhanced with:
   - Better error handling
   - Template support
   - CORS support
   - Health and analytics endpoints

4. **Utility Modules**: Common functionality is now available in utility modules:
   - `file_utils.py`: File and path handling
   - `token_counter.py`: Token estimation and counting
   - `text_processing.py`: Text manipulation utilities

5. **CLI Improvements**: Command-line interface updated to work with the new structure.

6. **Testing**: Added basic test infrastructure to verify package structure.

## Usage

### Running from Command Line

```bash
# Through the CLI interface
python -m goose_tools.cli web https://example.com

# Using the shell scripts directly
./goose_tools/scripts/extract_web.sh https://example.com
```

### Starting the API Server

```bash
# Using the launch script
./goose_tools/launch_goose_tools.sh --port 5000
```

### Importing as a Library

```python
# Import utility functions
from goose_tools.utils import clean_html, estimate_tokens

# Process text
text = clean_html("<p>Some HTML content</p>")
tokens = estimate_tokens(text)
```

## Next Steps

1. **Authentication**: Add user authentication to the API
2. **Test Coverage**: Expand test suite with unit and integration tests
3. **Continuous Integration**: Add CI/CD pipeline for testing and deployment
4. **Documentation**: Complete comprehensive documentation
5. **Multi-provider Support**: Add support for different LLM providers