#!/bin/bash
# extract_code.sh - Extract relevant parts of code files to minimize token usage
# Usage: ./extract_code.sh <file_path> [output_file] [options]
# 
# Options:
#   --lang <language>   Force a specific language (auto-detected by default)
#   --no-imports        Skip importing/dependency section
#   --no-functions      Skip function/class definitions section
#   --no-comments       Skip important comments section
#   --no-sample         Skip sample lines section
#   --pattern "<regex>" Add a custom extraction pattern
#   --full-functions    Extract complete function bodies, not just signatures
#   --max-lines <num>   Maximum number of lines to extract (default: 50)

# Parse command line arguments
FILE_PATH=""
OUTPUT_FILE=""
FORCED_LANG=""
SKIP_IMPORTS=false
SKIP_FUNCTIONS=false
SKIP_COMMENTS=false
SKIP_SAMPLE=false
CUSTOM_PATTERN=""
FULL_FUNCTIONS=false
MAX_LINES=50

while [[ $# -gt 0 ]]; do
  case $1 in
    --lang)
      FORCED_LANG="$2"
      shift 2
      ;;
    --no-imports)
      SKIP_IMPORTS=true
      shift
      ;;
    --no-functions)
      SKIP_FUNCTIONS=true
      shift
      ;;
    --no-comments)
      SKIP_COMMENTS=true
      shift
      ;;
    --no-sample)
      SKIP_SAMPLE=true
      shift
      ;;
    --pattern)
      CUSTOM_PATTERN="$2"
      shift 2
      ;;
    --full-functions)
      FULL_FUNCTIONS=true
      shift
      ;;
    --max-lines)
      MAX_LINES="$2"
      shift 2
      ;;
    *)
      if [ -z "$FILE_PATH" ]; then
        FILE_PATH="$1"
      elif [ -z "$OUTPUT_FILE" ]; then
        OUTPUT_FILE="$1"
      else
        echo "Error: Unknown parameter: $1"
        exit 1
      fi
      shift
      ;;
  esac
done

# Default output file if not specified
if [ -z "$OUTPUT_FILE" ]; then
  OUTPUT_FILE="code_extract.txt"
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
  echo "Error: File does not exist: $FILE_PATH"
  exit 1
fi

echo "Extracting relevant parts from $FILE_PATH to $OUTPUT_FILE..."

# Detect language from file extension if not forced
if [ -z "$FORCED_LANG" ]; then
  case "$FILE_PATH" in
    *.py)
      LANG="python"
      ;;
    *.js)
      LANG="javascript"
      ;;
    *.ts)
      LANG="typescript"
      ;;
    *.jsx|*.tsx)
      LANG="react"
      ;;
    *.c|*.h)
      LANG="c"
      ;;
    *.cpp|*.hpp|*.cc|*.hh)
      LANG="cpp"
      ;;
    *.rs)
      LANG="rust"
      ;;
    *.go)
      LANG="go"
      ;;
    *.java)
      LANG="java"
      ;;
    *.rb)
      LANG="ruby"
      ;;
    *.php)
      LANG="php"
      ;;
    *.cs)
      LANG="csharp"
      ;;
    *.swift)
      LANG="swift"
      ;;
    *.kt|*.kts)
      LANG="kotlin"
      ;;
    *.sh|*.bash)
      LANG="bash"
      ;;
    *.pl)
      LANG="perl"
      ;;
    *.lua)
      LANG="lua"
      ;;
    *.R)
      LANG="r"
      ;;
    *.scala)
      LANG="scala"
      ;;
    *.sql)
      LANG="sql"
      ;;
    *.yaml|*.yml)
      LANG="yaml"
      ;;
    *.json)
      LANG="json"
      ;;
    *.xml)
      LANG="xml"
      ;;
    *.dart)
      LANG="dart"
      ;;
    *)
      LANG="unknown"
      ;;
  esac
else
  LANG="$FORCED_LANG"
fi

# Get file info
echo "# File: $FILE_PATH" > "$OUTPUT_FILE"
echo "# Language: $LANG" >> "$OUTPUT_FILE"
echo "# Size: $(du -h "$FILE_PATH" | cut -f1)" >> "$OUTPUT_FILE"
echo "# Lines: $(wc -l < "$FILE_PATH")" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Extract imports/includes if not skipped
if [ "$SKIP_IMPORTS" = false ]; then
  echo "## Imports/Dependencies:" >> "$OUTPUT_FILE"
  case "$LANG" in
    python)
      grep -E "^(import|from) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    javascript|typescript|react)
      grep -E "^(import|require|export) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    c|cpp)
      grep -E "^#include" "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    rust)
      grep -E "^(use|mod|extern crate) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    go)
      grep -E "^(import|package) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    java)
      grep -E "^(import|package) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    ruby)
      grep -E "^(require|include|extend|load|import) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    php)
      grep -E "^(require|include|require_once|include_once|use|namespace) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    csharp)
      grep -E "^(using|namespace) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    swift)
      grep -E "^(import) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    kotlin)
      grep -E "^(import|package) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    perl)
      grep -E "^(use|require|package) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    lua)
      grep -E "^(require) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    dart)
      grep -E "^(import|export|part|library) " "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
    *)
      echo "# Import detection not specialized for $LANG" >> "$OUTPUT_FILE"
      # Generic import pattern for other languages
      grep -E "(import|require|include|using)" "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
      ;;
  esac
  echo "" >> "$OUTPUT_FILE"
fi

# Extract class/function definitions if not skipped
if [ "$SKIP_FUNCTIONS" = false ]; then
  echo "## Function/Class Definitions:" >> "$OUTPUT_FILE"
  
  # Define language-specific patterns for function/class definitions
  case "$LANG" in
    python)
      PATTERN="^(def |class |async def )"
      ;;
    javascript|typescript|react)
      PATTERN="^(function |class |const.*= *function|const.*=>|let.*= *function|var.*= *function|async function )"
      ;;
    c|cpp)
      PATTERN="^([a-zA-Z_][a-zA-Z0-9_]*[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\(|class[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*|struct[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*|enum[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*)"
      ;;
    rust)
      PATTERN="^(fn |pub fn |struct |impl |trait |enum )"
      ;;
    go)
      PATTERN="^(func |type )"
      ;;
    java)
      PATTERN="^[[:space:]]*(public|private|protected|static|final|abstract|synchronized).*class.*|^[[:space:]]*(public|private|protected|static|final|abstract|synchronized).*[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\("
      ;;
    ruby)
      PATTERN="^[[:space:]]*(def |class |module )"
      ;;
    php)
      PATTERN="^[[:space:]]*(function |class |interface |trait )"
      ;;
    csharp)
      PATTERN="^[[:space:]]*(public|private|protected|internal|static|sealed|abstract|partial).*class.*|^[[:space:]]*(public|private|protected|internal|static|virtual|override|abstract).*[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\("
      ;;
    swift)
      PATTERN="^[[:space:]]*(func |class |struct |enum |protocol )"
      ;;
    kotlin)
      PATTERN="^[[:space:]]*(fun |class |interface |object |data class )"
      ;;
    *)
      # Generic pattern that works for many languages
      PATTERN="^[[:space:]]*(function |def |class |fn |func |void |int |char |bool |boolean |string |double |float )"
      ;;
  esac
  
  if [ "$FULL_FUNCTIONS" = true ]; then
    # This is more complex and would require a more sophisticated parsing
    # For simplicity, we're just grabbing lines that might be part of function bodies
    # A more accurate approach would use language-specific parsers
    grep -A5 -E "$PATTERN" "$FILE_PATH" | head -50 >> "$OUTPUT_FILE"
  else
    # Just grab the function signatures
    grep -E "$PATTERN" "$FILE_PATH" | head -30 >> "$OUTPUT_FILE"
  fi
  
  echo "" >> "$OUTPUT_FILE"
fi

# Extract comments containing important markers if not skipped
if [ "$SKIP_COMMENTS" = false ]; then
  echo "## Important Comments:" >> "$OUTPUT_FILE"
  grep -E "(TODO|FIXME|NOTE|IMPORTANT|BUG|HACK|REVIEW|OPTIMIZE|XXX)" "$FILE_PATH" | head -20 >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Apply custom pattern if provided
if [ -n "$CUSTOM_PATTERN" ]; then
  echo "## Custom Pattern ($CUSTOM_PATTERN):" >> "$OUTPUT_FILE"
  grep -E "$CUSTOM_PATTERN" "$FILE_PATH" | head -30 >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Extract a sample (first N lines) if not skipped
if [ "$SKIP_SAMPLE" = false ]; then
  echo "## First $MAX_LINES lines:" >> "$OUTPUT_FILE"
  head -$MAX_LINES "$FILE_PATH" >> "$OUTPUT_FILE"
fi

# Token estimation (roughly 4 chars per token)
file_size=$(stat -c%s "$OUTPUT_FILE")
token_estimate=$((file_size / 4))

echo "Extraction complete."
echo "Estimated tokens: ~$token_estimate"
echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "File saved to: $OUTPUT_FILE"