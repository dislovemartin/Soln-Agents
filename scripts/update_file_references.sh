#!/bin/bash
# Script to update references to renamed files

# Find all JS, JSX, TS, TSX, CSS, and HTML files 
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.html" -o -name "*.json" \) -not -path "*/node_modules/*" -not -path "*/.git/*" | while read -r file; do
  # Replace references to widget files
  sed -i 's/anythingllm-chat-widget/solnai-chat-widget/g' "$file"
  
  # Replace references to logo files
  sed -i 's/anything-llm-light/solnai-light/g' "$file"
  sed -i 's/anything-llm-dark/solnai-dark/g' "$file"
  sed -i 's/anything-llm-infinity/solnai-infinity/g' "$file"
  sed -i 's/anything-llm-icon/solnai-icon/g' "$file"
  sed -i 's/anything-llm\.png/solnai.png/g' "$file"
  
  # Replace reference to AWS CloudFormation file
  sed -i 's/cloudformation_create_anythingllm/cloudformation_create_solnai/g' "$file"
done

echo "File references updated successfully"
