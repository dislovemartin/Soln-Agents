# SolnAI Agent Configuration

This directory contains configuration utilities for SolnAI agents.

## Configuration Settings

The `settings.py` module provides a `Settings` class for loading and managing configuration settings from environment variables and configuration files.

### Usage

```python
from shared.config.settings import settings

# Get a configuration setting
api_port = settings.get("api_port", 8080)  # Default value is 8080

# Get a configuration setting using dictionary syntax
api_token = settings["api_bearer_token"]  # Raises KeyError if not found

# Check if a configuration key exists
if "supabase_url" in settings:
    # Do something with the Supabase URL
    pass

# Get all configuration settings as a dictionary
config_dict = settings.to_dict()
```

### Configuration Sources

Configuration settings are loaded from the following sources, in order of precedence:

1. Environment variables
2. Configuration file (if provided)

### Environment Variables

The following environment variables are supported:

#### API Settings
- `API_BEARER_TOKEN`: API bearer token for authentication
- `API_PORT`: API port (default: 8080)
- `API_HOST`: API host (default: 0.0.0.0)
- `API_DEBUG`: API debug mode (default: false)

#### Supabase Settings
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `SUPABASE_TABLE`: Supabase table name (default: messages)

#### LLM Settings
- `LLM_PROVIDER`: LLM provider (default: openai)
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: OpenAI model (default: gpt-4o)
- `ANTHROPIC_API_KEY`: Anthropic API key
- `ANTHROPIC_MODEL`: Anthropic model (default: claude-3-sonnet-20240229)

#### YouTube API Settings
- `YOUTUBE_API_KEY`: YouTube API key

### Configuration File

Configuration settings can also be loaded from a JSON configuration file. See `config.example.json` for an example.

To load settings from a configuration file:

```python
from shared.config.settings import Settings

# Create a new settings instance with a configuration file
settings = Settings(config_path="path/to/config.json")
```

## Creating a Custom Configuration

To create a custom configuration for your agent:

1. Copy `config.example.json` to a new file (e.g., `config.json`)
2. Modify the settings as needed
3. Load the configuration file in your agent:

```python
from shared.config.settings import Settings

# Create a new settings instance with your custom configuration file
settings = Settings(config_path="path/to/config.json")
```
