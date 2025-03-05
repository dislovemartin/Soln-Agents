# Contributing to SolnAI Agent Utilities

Thank you for your interest in contributing to the SolnAI Agent Utilities! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

- A clear, descriptive title
- A detailed description of the issue
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots or code snippets (if applicable)
- Environment information (OS, Python version, etc.)

### Suggesting Enhancements

If you have an idea for an enhancement, please create an issue with the following information:

- A clear, descriptive title
- A detailed description of the enhancement
- Why this enhancement would be useful
- Any relevant examples or mockups

### Pull Requests

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Write tests for your changes
5. Ensure all tests pass
6. Update documentation as needed
7. Submit a pull request

## Development Setup

1. Clone the repository
2. Install the package in development mode:

```bash
pip install -e ".[dev]"
```

3. Run the tests to ensure everything is working:

```bash
pytest
```

## Coding Standards

### Python Style Guide

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use [Black](https://black.readthedocs.io/en/stable/) for code formatting
- Use [isort](https://pycqa.github.io/isort/) for import sorting
- Use [mypy](https://mypy.readthedocs.io/en/stable/) for type checking

### Documentation

- Use docstrings for all functions, classes, and modules
- Follow the [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings) for docstrings
- Keep documentation up-to-date with code changes

### Testing

- Write tests for all new functionality
- Ensure all tests pass before submitting a pull request
- Aim for high test coverage

## Adding New Utilities

When adding a new utility:

1. Create a new file in the appropriate directory
2. Add proper documentation
3. Write tests for the new utility
4. Update the README.md to include the new utility
5. Add the new utility to the examples directory if applicable

## Versioning

We use [Semantic Versioning](https://semver.org/) for versioning. For the versions available, see the tags on this repository.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.
