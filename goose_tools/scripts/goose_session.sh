#!/bin/bash
# goose_session.sh - Create and manage Goose sessions with tags and resumption capabilities
# Usage: ./goose_session.sh [options] [task_name]
# 
# Options:
#   --tags "tag1,tag2"    Add tags to the session for better organization
#   --resume <session>    Resume an existing session (by name or ID)
#   --list                List available sessions with their tags and sizes
#   --export <file>       Export the session to a file after completion
#   --description "text"  Add a descriptive text to the session
#   --search "keyword"    Search sessions for specific content
#   --model <model>       Specify the model to use (if Goose supports model selection)

# Parse command line arguments
TASK_NAME=""
TAGS=""
RESUME_SESSION=""
LIST_SESSIONS=false
EXPORT_FILE=""
DESCRIPTION=""
SEARCH_TERM=""
MODEL=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --tags)
      TAGS="$2"
      shift 2
      ;;
    --resume)
      RESUME_SESSION="$2"
      shift 2
      ;;
    --list)
      LIST_SESSIONS=true
      shift
      ;;
    --export)
      EXPORT_FILE="$2"
      shift 2
      ;;
    --description)
      DESCRIPTION="$2"
      shift 2
      ;;
    --search)
      SEARCH_TERM="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    *)
      if [ -z "$TASK_NAME" ]; then
        TASK_NAME="$1"
      else
        echo "Error: Unknown parameter: $1"
        exit 1
      fi
      shift
      ;;
  esac
done

# Settings
SESSIONS_DIR=~/.local/share/goose/sessions
SESSION_META_DIR=~/.local/share/goose/session_meta

# Ensure directories exist
mkdir -p "$SESSIONS_DIR" "$SESSION_META_DIR"

# If search is requested, search and exit
if [ -n "$SEARCH_TERM" ]; then
  echo "Searching sessions for: $SEARCH_TERM"
  found_sessions=$(grep -l "$SEARCH_TERM" "$SESSIONS_DIR"/*.jsonl 2>/dev/null)
  
  if [ -z "$found_sessions" ]; then
    echo "No sessions found containing '$SEARCH_TERM'"
  else
    echo "Found in sessions:"
    for session in $found_sessions; do
      basename=$(basename "$session" .jsonl)
      size=$(du -h "$session" | cut -f1)
      
      # Get metadata if available
      tags=""
      description=""
      if [ -f "$SESSION_META_DIR/$basename.meta" ]; then
        tags=$(grep "^tags:" "$SESSION_META_DIR/$basename.meta" | cut -d':' -f2- | sed 's/^ *//')
        description=$(grep "^description:" "$SESSION_META_DIR/$basename.meta" | cut -d':' -f2- | sed 's/^ *//')
      fi
      
      echo "- $basename (Size: $size)"
      [ -n "$tags" ] && echo "  Tags: $tags"
      [ -n "$description" ] && echo "  Description: $description"
      
      # Show matching lines (limited to 3 per session)
      echo "  Matches:"
      grep -n "$SEARCH_TERM" "$session" | head -3 | sed 's/^/    /'
      echo ""
    done
  fi
  exit 0
fi

# If list is requested, list sessions and exit
if [ "$LIST_SESSIONS" = true ]; then
  echo "Available Goose sessions:"
  echo "========================="
  
  # Get list of sessions sorted by date (newest first)
  sessions=$(ls -t "$SESSIONS_DIR"/*.jsonl 2>/dev/null)
  
  if [ -z "$sessions" ]; then
    echo "No sessions found."
  else
    for session in $sessions; do
      basename=$(basename "$session" .jsonl)
      date_created=$(date -r "$session" "+%Y-%m-%d %H:%M:%S")
      size=$(du -h "$session" | cut -f1)
      
      # Get metadata if available
      tags=""
      description=""
      if [ -f "$SESSION_META_DIR/$basename.meta" ]; then
        tags=$(grep "^tags:" "$SESSION_META_DIR/$basename.meta" | cut -d':' -f2- | sed 's/^ *//')
        description=$(grep "^description:" "$SESSION_META_DIR/$basename.meta" | cut -d':' -f2- | sed 's/^ *//')
      fi
      
      echo "[$date_created] $basename (Size: $size)"
      [ -n "$tags" ] && echo "  Tags: $tags"
      [ -n "$description" ] && echo "  Description: $description"
      echo ""
    done
  fi
  exit 0
fi

# Handle session resumption
if [ -n "$RESUME_SESSION" ]; then
  # Check if the session exists (with or without .jsonl extension)
  if [ -f "$SESSIONS_DIR/$RESUME_SESSION.jsonl" ]; then
    SESSION_NAME=$RESUME_SESSION
  elif [ -f "$SESSIONS_DIR/$RESUME_SESSION" ]; then
    SESSION_NAME=$(basename "$RESUME_SESSION" .jsonl)
  else
    # Try to find a session that matches part of the name
    matching_session=$(find "$SESSIONS_DIR" -name "*$RESUME_SESSION*.jsonl" | head -1)
    if [ -n "$matching_session" ]; then
      SESSION_NAME=$(basename "$matching_session" .jsonl)
    else
      echo "Error: Session not found: $RESUME_SESSION"
      echo "Available sessions:"
      ls -1 "$SESSIONS_DIR"/*.jsonl | sed 's/^.*\///' | sed 's/\.jsonl$//' | sort
      exit 1
    fi
  fi
  
  echo "Resuming session: $SESSION_NAME"
  # Update the metadata file timestamp
  touch "$SESSION_META_DIR/$SESSION_NAME.meta" 2>/dev/null
  
  # Run goose with the existing session
  goose session --name "$SESSION_NAME"
  
  # After session ends, show updated session size
  echo -e "\nSession completed. Updated session file size:"
  ls -lh "$SESSIONS_DIR/$SESSION_NAME.jsonl"
  
  # Export if requested
  if [ -n "$EXPORT_FILE" ]; then
    cp "$SESSIONS_DIR/$SESSION_NAME.jsonl" "$EXPORT_FILE"
    echo "Session exported to: $EXPORT_FILE"
  fi
  
  exit 0
fi

# Default task name is the current date/time if none provided
if [ -z "$TASK_NAME" ]; then
  TASK_NAME="task"
fi

# Create a session name with timestamp
SESSION_NAME=$(date +%Y%m%d_%H%M%S)_${TASK_NAME//[^a-zA-Z0-9_]/_}

# Show existing session info
echo "Existing Goose sessions:"
ls -lht "$SESSIONS_DIR/" | head -10

# Create metadata file
if [ -n "$TAGS" ] || [ -n "$DESCRIPTION" ]; then
  echo "# Metadata for $SESSION_NAME" > "$SESSION_META_DIR/$SESSION_NAME.meta"
  echo "created: $(date '+%Y-%m-%d %H:%M:%S')" >> "$SESSION_META_DIR/$SESSION_NAME.meta"
  
  if [ -n "$TAGS" ]; then
    echo "tags: $TAGS" >> "$SESSION_META_DIR/$SESSION_NAME.meta"
  fi
  
  if [ -n "$DESCRIPTION" ]; then
    echo "description: $DESCRIPTION" >> "$SESSION_META_DIR/$SESSION_NAME.meta"
  fi
  
  if [ -n "$MODEL" ]; then
    echo "model: $MODEL" >> "$SESSION_META_DIR/$SESSION_NAME.meta"
  fi
fi

# Start new session
echo -e "\nStarting new session: $SESSION_NAME"
if [ -n "$TAGS" ]; then
  echo "Tags: $TAGS"
fi
if [ -n "$DESCRIPTION" ]; then
  echo "Description: $DESCRIPTION"
fi

# Launch goose with the appropriate model if specified
if [ -n "$MODEL" ]; then
  echo "Using model: $MODEL"
  goose session --name "$SESSION_NAME" --model "$MODEL"
else
  goose session --name "$SESSION_NAME"
fi

# After session ends, show session size
echo -e "\nSession completed. Session file size:"
ls -lh "$SESSIONS_DIR/$SESSION_NAME.jsonl"

# Export if requested
if [ -n "$EXPORT_FILE" ]; then
  cp "$SESSIONS_DIR/$SESSION_NAME.jsonl" "$EXPORT_FILE"
  echo "Session exported to: $EXPORT_FILE"
fi