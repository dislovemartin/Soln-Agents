#!/bin/bash
# Convert content between different formats for optimal LLM token usage
# Updated to use Python module implementation

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PACKAGE_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Use Python module directly
python -m goose_tools.scripts.convert_content "$@"

exit $? 