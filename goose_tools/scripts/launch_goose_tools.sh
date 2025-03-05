#!/bin/bash
# Launch Goose Tools API server and related services

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PACKAGE_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Default settings
HOST="127.0.0.1"
PORT="5000"
DEBUG=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --host)
      HOST="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --debug)
      DEBUG="--debug"
      shift
      ;;
    *)
      echo "Error: Unknown parameter: $1"
      echo "Usage: $0 [--host HOST] [--port PORT] [--debug]"
      exit 1
      ;;
  esac
done

# Create necessary directories
LOG_DIR="${HOME}/.local/share/goose/logs"
mkdir -p "$LOG_DIR"

echo "Starting Goose Tools server on $HOST:$PORT..."

# Start the API server
python -m goose_tools.cli serve --host "$HOST" --port "$PORT" $DEBUG > "${LOG_DIR}/api.log" 2>&1 &
API_PID=$!

echo "API server started with PID $API_PID"
echo "Logs available at ${LOG_DIR}/api.log"
echo "API accessible at http://$HOST:$PORT/"

# Create a PID file for the API server
echo $API_PID > "${LOG_DIR}/api.pid"

echo "Goose Tools started successfully!"
echo "To stop: kill $API_PID" 