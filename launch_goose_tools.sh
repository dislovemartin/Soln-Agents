#!/bin/bash
# launch_goose_tools.sh - Start the Goose Context Management Tools
# Usage: ./launch_goose_tools.sh [--port PORT] [--no-browser] [--debug] [--host HOST]

# Default settings
PORT=5000
HOST="0.0.0.0"
OPEN_BROWSER=true
DEBUG=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port)
      PORT="$2"
      shift 2
      ;;
    --host)
      HOST="$2"
      shift 2
      ;;
    --no-browser)
      OPEN_BROWSER=false
      shift
      ;;
    --debug)
      DEBUG="--debug"
      shift
      ;;
    *)
      echo "Error: Unknown parameter: $1"
      echo "Usage: ./launch_goose_tools.sh [--port PORT] [--host HOST] [--no-browser] [--debug]"
      exit 1
      ;;
  esac
done

# Ensure all scripts are executable
chmod +x goose_tools.sh extract_web.sh extract_code.sh goose_session.sh clean_sessions.sh

# Check for required dependencies
echo "Checking dependencies..."

# Check for Python and Flask
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3."
    exit 1
fi

# Check if Flask is installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "Flask is required but not installed. Installing..."
    pip install flask
fi

# Check if Flask-CORS is installed
if ! python3 -c "import flask_cors" &> /dev/null; then
    echo "Flask-CORS is required but not installed. Installing..."
    pip install flask-cors
fi

# Create necessary directories
mkdir -p ~/.local/share/goose/sessions
mkdir -p ~/.local/share/goose/session_meta

# Start the API server
echo "Starting Goose Context Management Tools API on port $PORT..."
python3 goose_api.py --port $PORT --host $HOST $DEBUG &
API_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 2

# Check if the server started successfully
if ! ps -p $API_PID > /dev/null; then
    echo "Failed to start the API server. Check the logs for errors."
    exit 1
fi

# Open the dashboard in the default browser
if [ "$OPEN_BROWSER" = true ]; then
    echo "Opening dashboard in web browser..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://${HOST}:${PORT}/" &
    elif command -v open &> /dev/null; then
        open "http://${HOST}:${PORT}/" &
    elif command -v start &> /dev/null; then
        start "http://${HOST}:${PORT}/" &
    else
        echo "Could not open browser automatically. Please visit:"
        echo "http://${HOST}:${PORT}/"
    fi
else
    echo "Dashboard available at: http://${HOST}:${PORT}/"
fi

# Handle graceful shutdown
function cleanup {
    echo "Shutting down..."
    kill $API_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Goose Context Management Tools running."
echo "Press Ctrl+C to stop."

# Keep the script running and monitor the API process
while true; do
    if ! ps -p $API_PID > /dev/null; then
        echo "API server process has stopped. Exiting..."
        exit 1
    fi
    sleep 1
done