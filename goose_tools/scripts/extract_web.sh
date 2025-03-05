#!/bin/bash
# Extract content from a web page while minimizing token usage
# Updated to use Python module implementation

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PACKAGE_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Use Python module directly
python -m goose_tools.scripts.extract_web "$@"

exit $?