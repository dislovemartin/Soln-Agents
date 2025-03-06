#!/bin/bash
# Quick launcher for SolnAI + AutoGen Studio integration

# Function to check if a command is available
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if tmux is installed
if ! command_exists tmux; then
  echo "tmux is not installed. Please install it or run the services manually."
  echo "See README_AUTOGEN_INTEGRATION.md for manual instructions."
  exit 1
fi

# Create a new tmux session
tmux new-session -d -s autogen-integration

# Start AutoGen Studio in the first window
tmux rename-window -t autogen-integration:0 'autogen-studio'
if [ -d "autogen-env" ]; then
  if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    tmux send-keys -t autogen-integration:0 'source autogen-env/bin/activate' C-m
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    tmux send-keys -t autogen-integration:0 'source autogen-env/Scripts/activate' C-m
  fi
  tmux send-keys -t autogen-integration:0 'autogenstudio ui --port 8081 --host 0.0.0.0' C-m
else
  tmux send-keys -t autogen-integration:0 'echo "Virtual environment not found. Please run setup-autogen-integration.sh first."' C-m
fi

# Create a window for the proxy server
tmux new-window -t autogen-integration:1 -n 'proxy'
if [ -d "proxy" ]; then
  tmux send-keys -t autogen-integration:1 'cd proxy && node autogen-proxy.js' C-m
else
  tmux send-keys -t autogen-integration:1 'echo "Proxy directory not found. Please run setup-autogen-integration.sh first."' C-m
fi

# Create a window for SolnAI
tmux new-window -t autogen-integration:2 -n 'solnai'
tmux send-keys -t autogen-integration:2 'echo "Start your SolnAI application here"' C-m
tmux send-keys -t autogen-integration:2 'echo "For example: npm run dev"' C-m

# Attach to the session
tmux attach-session -t autogen-integration

echo "All services started in tmux session 'autogen-integration'"
echo "Press Ctrl+B then D to detach from the session"
echo "To reattach, run: tmux attach-session -t autogen-integration"