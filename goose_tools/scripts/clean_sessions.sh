#!/bin/bash
# Clean old or large session files to manage token usage and storage
# Updated to use Python module implementation

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PACKAGE_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Use Python module directly
python -m goose_tools.scripts.clean_sessions "$@"

exit $?