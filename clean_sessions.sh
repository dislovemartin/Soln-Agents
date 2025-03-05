#!/bin/bash
# clean_sessions.sh - Maintain and organize Goose session files
# Usage: ./clean_sessions.sh [options]
# 
# Options:
#   --max-days <days>         Maximum age of sessions to keep (default: 7)
#   --max-size <MB>           Maximum size of sessions to keep (default: 10)
#   --backup                  Create a backup before deleting sessions
#   --backup-dir <directory>  Directory to store backups (default: ~/goose_backups)
#   --auto-schedule           Set up a cron job for automatic cleanup
#   --schedule-days <days>    Days between scheduled runs (default: 7)
#   --preserve-tags <tags>    Comma-separated list of tags to preserve
#   --preview                 Preview what would be deleted without actually deleting
#   --force                   Delete without confirmation prompts

# Parse command line arguments
MAX_DAYS=7
MAX_SIZE_MB=10
CREATE_BACKUP=false
BACKUP_DIR=~/goose_backups
AUTO_SCHEDULE=false
SCHEDULE_DAYS=7
PRESERVE_TAGS=""
PREVIEW_ONLY=false
FORCE_DELETE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --max-days)
      MAX_DAYS="$2"
      shift 2
      ;;
    --max-size)
      MAX_SIZE_MB="$2"
      shift 2
      ;;
    --backup)
      CREATE_BACKUP=true
      shift
      ;;
    --backup-dir)
      BACKUP_DIR="$2"
      shift 2
      ;;
    --auto-schedule)
      AUTO_SCHEDULE=true
      shift
      ;;
    --schedule-days)
      SCHEDULE_DAYS="$2"
      shift 2
      ;;
    --preserve-tags)
      PRESERVE_TAGS="$2"
      shift 2
      ;;
    --preview)
      PREVIEW_ONLY=true
      shift
      ;;
    --force)
      FORCE_DELETE=true
      shift
      ;;
    *)
      echo "Error: Unknown parameter: $1"
      exit 1
      ;;
  esac
done

# Settings
SESSIONS_DIR=~/.local/share/goose/sessions
SESSION_META_DIR=~/.local/share/goose/session_meta

# Ensure directories exist
mkdir -p "$SESSIONS_DIR" "$SESSION_META_DIR"

# Set up automatic scheduling if requested
if [ "$AUTO_SCHEDULE" = true ]; then
  echo "Setting up automatic cleanup schedule (every $SCHEDULE_DAYS days)..."
  
  # Create a temporary crontab file
  TEMP_CRONTAB=$(mktemp)
  crontab -l > "$TEMP_CRONTAB" 2>/dev/null
  
  # Check if the cron job already exists
  if grep -q "clean_sessions.sh" "$TEMP_CRONTAB"; then
    echo "Cleanup task already scheduled. Updating..."
    sed -i '/clean_sessions.sh/d' "$TEMP_CRONTAB"
  fi
  
  # Add the new cron job (run at midnight)
  script_path=$(realpath "$0")
  options=""
  [ "$CREATE_BACKUP" = true ] && options="$options --backup"
  [ -n "$BACKUP_DIR" ] && options="$options --backup-dir $BACKUP_DIR"
  [ -n "$PRESERVE_TAGS" ] && options="$options --preserve-tags \"$PRESERVE_TAGS\""
  [ "$FORCE_DELETE" = true ] && options="$options --force"
  
  echo "0 0 */$SCHEDULE_DAYS * * $script_path --max-days $MAX_DAYS --max-size $MAX_SIZE_MB $options" >> "$TEMP_CRONTAB"
  
  # Install the new crontab
  crontab "$TEMP_CRONTAB"
  rm "$TEMP_CRONTAB"
  
  echo "Automatic cleanup scheduled to run every $SCHEDULE_DAYS days at midnight."
  echo "Using parameters: --max-days $MAX_DAYS --max-size $MAX_SIZE_MB $options"
  
  exit 0
fi

echo "Goose Session Cleaner"
echo "====================="
echo "Sessions directory: $SESSIONS_DIR"
echo "Current session statistics:"
echo "  Total sessions: $(ls -1 $SESSIONS_DIR/*.jsonl 2>/dev/null | wc -l)"
echo "  Total size: $(du -sh $SESSIONS_DIR 2>/dev/null | cut -f1)"
echo ""

# List largest sessions
echo "Largest sessions:"
du -h $SESSIONS_DIR/*.jsonl 2>/dev/null | sort -hr | head -5
echo ""

# List oldest sessions
echo "Oldest sessions:"
find $SESSIONS_DIR -type f -name "*.jsonl" -printf "%TY-%Tm-%Td %TH:%TM:%TS %p\n" 2>/dev/null | sort | head -5
echo ""

# Find old sessions
echo "Sessions older than $MAX_DAYS days:"
old_sessions=$(find $SESSIONS_DIR -type f -name "*.jsonl" -mtime +$MAX_DAYS -print 2>/dev/null)
if [ -z "$old_sessions" ]; then
    echo "  None found"
else
    echo "$old_sessions" | while read -r session; do
        filename=$(basename "$session")
        size=$(du -h "$session" | cut -f1)
        
        # Check if this session has preserved tags
        preserve=false
        if [ -n "$PRESERVE_TAGS" ] && [ -f "$SESSION_META_DIR/${filename%.jsonl}.meta" ]; then
            session_tags=$(grep "^tags:" "$SESSION_META_DIR/${filename%.jsonl}.meta" | cut -d':' -f2- | sed 's/^ *//')
            for tag in ${PRESERVE_TAGS//,/ }; do
                if [[ "$session_tags" == *"$tag"* ]]; then
                    preserve=true
                    break
                fi
            done
        fi
        
        if [ "$preserve" = true ]; then
            echo "  $filename (Size: $size) [PRESERVED due to tags]"
        else
            echo "  $filename (Size: $size)"
        fi
    done
fi
echo ""

# Find large sessions
echo "Sessions larger than $MAX_SIZE_MB MB:"
large_sessions=$(find $SESSIONS_DIR -type f -name "*.jsonl" -size +${MAX_SIZE_MB}M -print 2>/dev/null)
if [ -z "$large_sessions" ]; then
    echo "  None found"
else
    echo "$large_sessions" | while read -r session; do
        filename=$(basename "$session")
        size=$(du -h "$session" | cut -f1)
        
        # Check if this session has preserved tags
        preserve=false
        if [ -n "$PRESERVE_TAGS" ] && [ -f "$SESSION_META_DIR/${filename%.jsonl}.meta" ]; then
            session_tags=$(grep "^tags:" "$SESSION_META_DIR/${filename%.jsonl}.meta" | cut -d':' -f2- | sed 's/^ *//')
            for tag in ${PRESERVE_TAGS//,/ }; do
                if [[ "$session_tags" == *"$tag"* ]]; then
                    preserve=true
                    break
                fi
            done
        fi
        
        if [ "$preserve" = true ]; then
            echo "  $filename (Size: $size) [PRESERVED due to tags]"
        else
            echo "  $filename (Size: $size)"
        fi
    done
fi
echo ""

# If preview only, exit here
if [ "$PREVIEW_ONLY" = true ]; then
    echo "Preview mode: No sessions were deleted."
    exit 0
fi

# Create a backup if requested
if [ "$CREATE_BACKUP" = true ]; then
    backup_timestamp=$(date +%Y%m%d_%H%M%S)
    backup_path="$BACKUP_DIR/goose_sessions_$backup_timestamp"
    
    echo "Creating backup at: $backup_path"
    mkdir -p "$backup_path"
    
    # Copy all session files
    cp -a "$SESSIONS_DIR"/*.jsonl "$backup_path/" 2>/dev/null
    
    # Copy metadata if it exists
    if [ -d "$SESSION_META_DIR" ]; then
        mkdir -p "$backup_path/meta"
        cp -a "$SESSION_META_DIR"/*.meta "$backup_path/meta/" 2>/dev/null
    fi
    
    echo "Backup completed: $(du -sh "$backup_path" | cut -f1)"
    echo ""
fi

# Ask for confirmation if not forced
if [ "$FORCE_DELETE" = false ]; then
    read -p "Do you want to delete old (>$MAX_DAYS days) sessions? (y/n): " confirm_old
else
    confirm_old="y"
fi

# Remove old sessions
if [[ $confirm_old == [Yy]* ]]; then
    # Create a list of sessions to delete
    sessions_to_delete=""
    
    echo "$old_sessions" | while read -r session; do
        if [ -z "$session" ]; then
            continue
        fi
        
        filename=$(basename "$session")
        
        # Check if this session has preserved tags
        preserve=false
        if [ -n "$PRESERVE_TAGS" ] && [ -f "$SESSION_META_DIR/${filename%.jsonl}.meta" ]; then
            session_tags=$(grep "^tags:" "$SESSION_META_DIR/${filename%.jsonl}.meta" | cut -d':' -f2- | sed 's/^ *//')
            for tag in ${PRESERVE_TAGS//,/ }; do
                if [[ "$session_tags" == *"$tag"* ]]; then
                    preserve=true
                    break
                fi
            done
        fi
        
        if [ "$preserve" = false ]; then
            rm -f "$session"
            rm -f "$SESSION_META_DIR/${filename%.jsonl}.meta" 2>/dev/null
            echo "Deleted old session: $filename"
        else
            echo "Preserved session due to tags: $filename"
        fi
    done
    
    echo "Old sessions deleted (except those with preserved tags)."
fi

# Ask for confirmation if not forced
if [ "$FORCE_DELETE" = false ]; then
    read -p "Do you want to delete large (>$MAX_SIZE_MB MB) sessions? (y/n): " confirm_large
else
    confirm_large="y"
fi

# Remove large sessions
if [[ $confirm_large == [Yy]* ]]; then
    echo "$large_sessions" | while read -r session; do
        if [ -z "$session" ]; then
            continue
        fi
        
        filename=$(basename "$session")
        
        # Check if this session has preserved tags
        preserve=false
        if [ -n "$PRESERVE_TAGS" ] && [ -f "$SESSION_META_DIR/${filename%.jsonl}.meta" ]; then
            session_tags=$(grep "^tags:" "$SESSION_META_DIR/${filename%.jsonl}.meta" | cut -d':' -f2- | sed 's/^ *//')
            for tag in ${PRESERVE_TAGS//,/ }; do
                if [[ "$session_tags" == *"$tag"* ]]; then
                    preserve=true
                    break
                fi
            done
        fi
        
        if [ "$preserve" = false ]; then
            rm -f "$session"
            rm -f "$SESSION_META_DIR/${filename%.jsonl}.meta" 2>/dev/null
            echo "Deleted large session: $filename"
        else
            echo "Preserved session due to tags: $filename"
        fi
    done
    
    echo "Large sessions deleted (except those with preserved tags)."
fi

echo ""
echo "Cleanup complete."
echo "Current session statistics:"
echo "  Total sessions: $(ls -1 $SESSIONS_DIR/*.jsonl 2>/dev/null | wc -l)"
echo "  Total size: $(du -sh $SESSIONS_DIR 2>/dev/null | cut -f1)"