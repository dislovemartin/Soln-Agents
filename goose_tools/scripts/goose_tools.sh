#!/bin/bash
# goose_tools.sh - Unified CLI for Goose context management tools
# Usage: ./goose_tools.sh <command> [options]
# 
# Commands:
#   web <URL> [options]          Extract content from a web page
#   code <file_path> [options]   Extract key components from a code file
#   session [options] [name]     Start or manage a Goose session
#   clean [options]              Manage and clean up session files
#   convert <file> [format]      Convert content to a different format
#   help [command]               Show help for a specific command
#   version                      Show version information

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_DIR="$(cd "${PACKAGE_DIR}/.." && pwd)"

# Show version info
function show_version() {
  echo "Goose Context Management Tools v$VERSION"
  echo "Part of the SolnAI Architecture"
  echo "https://github.com/solnai/goose-tools"
}

# Show main help
function show_help() {
  cat << EOF
Goose Context Management Tools - v$VERSION

USAGE:
  goose-tools <command> [options]

COMMANDS:
  web <URL> [options]          Extract content from a web page
  code <file_path> [options]   Extract key components from a code file
  session [options] [name]     Start or manage a Goose session
  clean [options]              Manage and clean up session files
  convert <file> [format]      Convert content to a different format
  help [command]               Show help for a specific command
  version                      Show version information

Run 'goose-tools help <command>' for more information about a specific command.
EOF
}

# Show command-specific help
function show_command_help() {
  case "$1" in
    web)
      cat << EOF
goose-tools web - Extract relevant text from web pages

USAGE:
  goose-tools web <URL> [output_file] [options]

OPTIONS:
  --max-lines <num>    Maximum number of lines to extract (default: 500)
  --no-links           Remove all links from the output (default: true)
  --with-images        Include image descriptions (default: false)
  --with-tables        Try to preserve table formatting (default: false)
  --selector "<css>"   Extract only content matching CSS selector
  --render-js          Use headless browser to render JavaScript
  --filter "<regex>"   Only include lines matching this pattern
  --exclude "<regex>"  Exclude lines matching this pattern
  --summary            Generate a brief summary at the beginning

EXAMPLES:
  goose-tools web https://example.com output.txt
  goose-tools web https://example.com --render-js --summary
EOF
      ;;
      
    code)
      cat << EOF
goose-tools code - Extract relevant parts of code files

USAGE:
  goose-tools code <file_path> [output_file] [options]

OPTIONS:
  --lang <language>   Force a specific language (auto-detected by default)
  --no-imports        Skip importing/dependency section
  --no-functions      Skip function/class definitions section
  --no-comments       Skip important comments section
  --no-sample         Skip sample lines section
  --pattern "<regex>" Add a custom extraction pattern
  --full-functions    Extract complete function bodies, not just signatures
  --max-lines <num>   Maximum number of lines to extract (default: 50)

EXAMPLES:
  goose-tools code src/main.py code_extract.txt
  goose-tools code src/main.py --full-functions --pattern "def process_"
EOF
      ;;
      
    session)
      cat << EOF
goose-tools session - Create and manage Goose sessions

USAGE:
  goose-tools session [options] [task_name]

OPTIONS:
  --tags "tag1,tag2"    Add tags to the session for better organization
  --resume <session>    Resume an existing session (by name or ID)
  --list                List available sessions with their tags and sizes
  --export <file>       Export the session to a file after completion
  --description "text"  Add a descriptive text to the session
  --search "keyword"    Search sessions for specific content
  --model <model>       Specify the model to use

EXAMPLES:
  goose-tools session project_name
  goose-tools session --tags "important,documentation" project_name
  goose-tools session --resume 20250305_project
  goose-tools session --list
EOF
      ;;
      
    clean)
      cat << EOF
goose-tools clean - Maintain and organize Goose session files

USAGE:
  goose-tools clean [options]

OPTIONS:
  --max-days <days>         Maximum age of sessions to keep (default: 7)
  --max-size <MB>           Maximum size of sessions to keep (default: 10)
  --backup                  Create a backup before deleting sessions
  --backup-dir <directory>  Directory to store backups (default: ~/goose_backups)
  --auto-schedule           Set up a cron job for automatic cleanup
  --schedule-days <days>    Days between scheduled runs (default: 7)
  --preserve-tags <tags>    Comma-separated list of tags to preserve
  --preview                 Preview what would be deleted without actually deleting
  --force                   Delete without confirmation prompts

EXAMPLES:
  goose-tools clean --max-days 14 --max-size 20
  goose-tools clean --backup --preview
  goose-tools clean --auto-schedule --schedule-days 14
EOF
      ;;
      
    convert)
      cat << EOF
goose-tools convert - Convert content to different formats

USAGE:
  goose-tools convert <input_file> <output_format> [output_file]

FORMATS:
  markdown, html, text, json

EXAMPLES:
  goose-tools convert extracted_code.txt html code.html
  goose-tools convert session_export.jsonl markdown session.md
EOF
      ;;
      
    *)
      show_help
      ;;
  esac
}

# Check for commands
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

# Process commands
COMMAND="$1"
shift

case "$COMMAND" in
  web)
    "$SCRIPT_DIR/extract_web.sh" "$@"
    ;;
    
  code)
    "$SCRIPT_DIR/extract_code.sh" "$@"
    ;;
    
  session)
    "$SCRIPT_DIR/goose_session.sh" "$@"
    ;;
    
  clean)
    "$SCRIPT_DIR/clean_sessions.sh" "$@"
    ;;
    
  convert)
    if [ $# -lt 2 ]; then
      echo "Error: Missing arguments for convert command"
      show_command_help convert
      exit 1
    fi
    
    INPUT_FILE="$1"
    FORMAT="$2"
    OUTPUT_FILE="${3:-${INPUT_FILE%.*}.$FORMAT}"
    
    # Check if input file exists
    if [ ! -f "$INPUT_FILE" ]; then
      echo "Error: Input file does not exist: $INPUT_FILE"
      exit 1
    fi
    
    echo "Converting $INPUT_FILE to $FORMAT format..."
    
    case "$FORMAT" in
      markdown|md)
        # Convert to Markdown
        if [[ "$INPUT_FILE" == *.jsonl ]]; then
          # Convert jsonl session to markdown
          echo "# Goose Session Export" > "$OUTPUT_FILE"
          echo "Generated on: $(date)" >> "$OUTPUT_FILE"
          echo "" >> "$OUTPUT_FILE"
          
          # Process each line of the jsonl file
          cat "$INPUT_FILE" | while read -r line; do
            # Extract role and content using simple text processing
            role=$(echo "$line" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
            content=$(echo "$line" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
            
            # Replace escaped quotes and newlines for readability
            content=$(echo "$content" | sed 's/\\"/"/g' | sed 's/\\n/\n/g')
            
            # Format as markdown
            echo "## $role" >> "$OUTPUT_FILE"
            echo "$content" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
          done
        else
          # General text to markdown conversion (simple)
          echo "# $(basename "$INPUT_FILE")" > "$OUTPUT_FILE"
          echo "Converted from: $INPUT_FILE" >> "$OUTPUT_FILE"
          echo "Date: $(date)" >> "$OUTPUT_FILE"
          echo "" >> "$OUTPUT_FILE"
          echo "## Content" >> "$OUTPUT_FILE"
          echo "" >> "$OUTPUT_FILE"
          cat "$INPUT_FILE" >> "$OUTPUT_FILE"
        fi
        ;;
        
      html)
        # Convert to HTML
        echo "<!DOCTYPE html>" > "$OUTPUT_FILE"
        echo "<html><head><title>$(basename "$INPUT_FILE")</title>" >> "$OUTPUT_FILE"
        echo "<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6}</style>" >> "$OUTPUT_FILE"
        echo "</head><body>" >> "$OUTPUT_FILE"
        echo "<h1>$(basename "$INPUT_FILE")</h1>" >> "$OUTPUT_FILE"
        echo "<p>Converted from: $INPUT_FILE</p>" >> "$OUTPUT_FILE"
        echo "<p>Date: $(date)</p>" >> "$OUTPUT_FILE"
        echo "<hr>" >> "$OUTPUT_FILE"
        
        if [[ "$INPUT_FILE" == *.jsonl ]]; then
          # Convert jsonl session to HTML
          cat "$INPUT_FILE" | while read -r line; do
            # Extract role and content
            role=$(echo "$line" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
            content=$(echo "$line" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
            
            # Replace escaped quotes and newlines
            content=$(echo "$content" | sed 's/\\"/"/g' | sed 's/\\n/<br>/g')
            
            # Format as HTML
            echo "<div style='margin-top:20px;padding:10px;border:1px solid #ccc;border-radius:5px;'>" >> "$OUTPUT_FILE"
            echo "<h3>$role</h3>" >> "$OUTPUT_FILE"
            echo "<p>$content</p>" >> "$OUTPUT_FILE"
            echo "</div>" >> "$OUTPUT_FILE"
          done
        else
          # General text to HTML conversion
          echo "<pre>" >> "$OUTPUT_FILE"
          cat "$INPUT_FILE" | sed 's/&/\&amp;/g' | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g' >> "$OUTPUT_FILE"
          echo "</pre>" >> "$OUTPUT_FILE"
        fi
        
        echo "</body></html>" >> "$OUTPUT_FILE"
        ;;
        
      text|txt)
        # Convert to plain text
        if [[ "$INPUT_FILE" == *.jsonl ]]; then
          # Convert jsonl session to text
          echo "# Goose Session Export" > "$OUTPUT_FILE"
          echo "Generated on: $(date)" >> "$OUTPUT_FILE"
          echo "" >> "$OUTPUT_FILE"
          
          cat "$INPUT_FILE" | while read -r line; do
            # Extract role and content
            role=$(echo "$line" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
            content=$(echo "$line" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
            
            # Replace escaped quotes and newlines
            content=$(echo "$content" | sed 's/\\"/"/g' | sed 's/\\n/\n/g')
            
            # Format as text
            echo "=== $role ===" >> "$OUTPUT_FILE"
            echo "$content" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
          done
        else
          # Just copy the file
          cp "$INPUT_FILE" "$OUTPUT_FILE"
        fi
        ;;
        
      json)
        # Convert to JSON
        if [[ "$INPUT_FILE" == *.jsonl ]]; then
          # Already a JSONL file, just convert to regular JSON array
          echo "[" > "$OUTPUT_FILE"
          sed -e '$a\' "$INPUT_FILE" | sed '$!s/$/,/' >> "$OUTPUT_FILE"
          echo "]" >> "$OUTPUT_FILE"
        else
          # Convert text file to JSON
          echo "{" > "$OUTPUT_FILE"
          echo "  \"filename\": \"$(basename "$INPUT_FILE")\"," >> "$OUTPUT_FILE"
          echo "  \"converted_on\": \"$(date)\"," >> "$OUTPUT_FILE"
          echo "  \"content\": " >> "$OUTPUT_FILE"
          
          # Escape the content as a JSON string
          echo -n "  \"" >> "$OUTPUT_FILE"
          cat "$INPUT_FILE" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed 's/$/\\n/g' | tr -d '\n' >> "$OUTPUT_FILE"
          echo "\"" >> "$OUTPUT_FILE"
          
          echo "}" >> "$OUTPUT_FILE"
        fi
        ;;
        
      *)
        echo "Error: Unsupported format: $FORMAT"
        echo "Supported formats: markdown, html, text, json"
        exit 1
        ;;
    esac
    
    echo "Conversion complete. Output saved to: $OUTPUT_FILE"
    ;;
    
  help)
    if [ $# -eq 0 ]; then
      show_help
    else
      show_command_help "$1"
    fi
    ;;
    
  version)
    show_version
    ;;
    
  *)
    echo "Error: Unknown command: $COMMAND"
    show_help
    exit 1
    ;;
esac