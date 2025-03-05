#!/bin/bash
# extract_web.sh - Extract relevant text from web pages while minimizing token usage
# Usage: ./extract_web.sh <URL> [output_file] [options]
# 
# Options:
#   --max-lines <num>    Maximum number of lines to extract (default: 500)
#   --no-links           Remove all links from the output (default: true)
#   --with-images        Include image descriptions (default: false)
#   --with-tables        Try to preserve table formatting (default: false)
#   --selector "<css>"   Extract only content matching CSS selector
#   --render-js          Use headless browser to render JavaScript (requires chrome/chromium)
#   --filter "<regex>"   Only include lines matching this pattern
#   --exclude "<regex>"  Exclude lines matching this pattern
#   --summary            Generate a brief summary at the beginning

# Parse command line arguments
URL=""
OUTPUT_FILE=""
MAX_LINES=500
REMOVE_LINKS=true
INCLUDE_IMAGES=false
PRESERVE_TABLES=false
CSS_SELECTOR=""
RENDER_JS=false
FILTER_PATTERN=""
EXCLUDE_PATTERN=""
GENERATE_SUMMARY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --max-lines)
      MAX_LINES="$2"
      shift 2
      ;;
    --no-links)
      REMOVE_LINKS=true
      shift
      ;;
    --with-links)
      REMOVE_LINKS=false
      shift
      ;;
    --with-images)
      INCLUDE_IMAGES=true
      shift
      ;;
    --with-tables)
      PRESERVE_TABLES=true
      shift
      ;;
    --selector)
      CSS_SELECTOR="$2"
      shift 2
      ;;
    --render-js)
      RENDER_JS=true
      shift
      ;;
    --filter)
      FILTER_PATTERN="$2"
      shift 2
      ;;
    --exclude)
      EXCLUDE_PATTERN="$2"
      shift 2
      ;;
    --summary)
      GENERATE_SUMMARY=true
      shift
      ;;
    *)
      if [ -z "$URL" ]; then
        URL="$1"
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
  OUTPUT_FILE="cleaned_content.txt"
fi

echo "Extracting content from $URL to $OUTPUT_FILE..."

# Check for required tools
if ! command -v lynx &> /dev/null; then
  echo "lynx is required but not installed. Installing..."
  sudo apt-get update && sudo apt-get install -y lynx
fi

# Create a temporary file
TEMP_FILE=$(mktemp)

# Choose extraction method based on options
if [ "$RENDER_JS" = true ]; then
  # Check for required tools for JavaScript rendering
  if ! command -v chromium &> /dev/null && ! command -v chromium-browser &> /dev/null && ! command -v google-chrome &> /dev/null; then
    echo "Error: JavaScript rendering requires Chrome or Chromium. Installing Chromium..."
    sudo apt-get update && sudo apt-get install -y chromium-browser
  fi
  
  if ! command -v npm &> /dev/null; then
    echo "Error: npm is required for JavaScript rendering. Installing..."
    sudo apt-get update && sudo apt-get install -y npm
  fi
  
  # Check if puppeteer is installed
  if [ ! -d "node_modules/puppeteer" ]; then
    echo "Installing Puppeteer for JavaScript rendering..."
    npm install puppeteer
  fi
  
  # Create a temporary JavaScript file
  JS_FILE=$(mktemp --suffix=.js)
  
  # Write a puppeteer script to extract the content
  cat > "$JS_FILE" << EOL
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('$URL', {waitUntil: 'networkidle2'});
  
  // Extract content based on selector if provided
  let content;
  if ('$CSS_SELECTOR') {
    await page.waitForSelector('$CSS_SELECTOR', {timeout: 5000}).catch(() => {});
    content = await page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(el => el.innerText).join('\n\n');
    }, '$CSS_SELECTOR');
  } else {
    content = await page.evaluate(() => document.body.innerText);
  }
  
  console.log(content);
  await browser.close();
})();
EOL
  
  # Run the puppeteer script and save the output
  node "$JS_FILE" > "$TEMP_FILE"
  
  # Clean up
  rm "$JS_FILE"
  
else
  # Standard Lynx extraction
  LYNX_OPTS="-dump -nolist"
  
  # Add options for preserving tables
  if [ "$PRESERVE_TABLES" = true ]; then
    LYNX_OPTS="$LYNX_OPTS -width=120"
  else
    LYNX_OPTS="$LYNX_OPTS -width=80"
  fi
  
  # Handle CSS selector
  if [ -n "$CSS_SELECTOR" ]; then
    # CSS selector extraction requires a more advanced approach
    # For simplicity, we'll note this limitation
    echo "Warning: CSS selector is only fully supported with --render-js. Using standard extraction."
  fi
  
  # Main extraction with lynx
  lynx $LYNX_OPTS "$URL" > "$TEMP_FILE"
fi

# Create the output file with metadata
echo "# Web Content Extraction" > "$OUTPUT_FILE"
echo "# Source: $URL" >> "$OUTPUT_FILE"
echo "# Date: $(date)" >> "$OUTPUT_FILE"
echo "# Options: $([ "$REMOVE_LINKS" = true ] && echo "remove-links" || echo "with-links"), $([ "$INCLUDE_IMAGES" = true ] && echo "with-images" || echo "no-images"), $([ "$PRESERVE_TABLES" = true ] && echo "with-tables" || echo "no-tables")" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Apply filters to the content
if [ "$REMOVE_LINKS" = true ]; then
  # Remove links like [1], [2], etc.
  sed -i -e 's/\[[0-9]*\]//g' "$TEMP_FILE"
fi

# Apply custom filters
if [ -n "$FILTER_PATTERN" ]; then
  grep -E "$FILTER_PATTERN" "$TEMP_FILE" > "${TEMP_FILE}.filtered"
  mv "${TEMP_FILE}.filtered" "$TEMP_FILE"
fi

if [ -n "$EXCLUDE_PATTERN" ]; then
  grep -v -E "$EXCLUDE_PATTERN" "$TEMP_FILE" > "${TEMP_FILE}.filtered"
  mv "${TEMP_FILE}.filtered" "$TEMP_FILE"
fi

# Remove empty lines
sed -i -e '/^[[:space:]]*$/d' "$TEMP_FILE"

# Generate summary if requested
if [ "$GENERATE_SUMMARY" = true ]; then
  echo "## Summary" >> "$OUTPUT_FILE"
  echo "This content was extracted from $(echo "$URL" | sed 's/https*:\/\///' | cut -d '/' -f 1) and contains approximately $(wc -l < "$TEMP_FILE") lines of text." >> "$OUTPUT_FILE"
  
  # Extract headings for summary
  echo "Main sections:" >> "$OUTPUT_FILE"
  grep -E '^[A-Z][A-Z0-9 ]+$' "$TEMP_FILE" | head -10 | sed 's/^/- /' >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "## Content" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Append content (limited to MAX_LINES)
head -$MAX_LINES "$TEMP_FILE" >> "$OUTPUT_FILE"

# Clean up
rm "$TEMP_FILE"

# Get token estimation (roughly 4 chars per token)
file_size=$(stat -c%s "$OUTPUT_FILE")
token_estimate=$((file_size / 4))

echo "Extraction complete."
echo "Estimated tokens: ~$token_estimate"
echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "File saved to: $OUTPUT_FILE"