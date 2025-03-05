#!/bin/bash
# Replace AnythingLLM with SolnAI across various file types

# Define file types to process
FILE_TYPES=("*.md" "*.js" "*.jsx" "*.ts" "*.tsx" "*.html" "*.json" "*.yml" "*.yaml")

# Log file for replacements
LOG_FILE="replacement_log.txt"
echo "Starting replacement process at $(date)" > $LOG_FILE

# Count total replacements
TOTAL_REPLACED=0
FILES_MODIFIED=0

# Process each file type
for TYPE in "${FILE_TYPES[@]}"; do
  echo "Processing $TYPE files..."
  
  # Find files of this type, excluding node_modules and .git directories
  find . -name "$TYPE" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | while read -r FILE; do
    # Check if file contains AnythingLLM (case-insensitive)
    if grep -q -i "anythingllm" "$FILE" || grep -q "anything-llm" "$FILE"; then
      # Count replacements for reporting
      REPLACED_COUNT=0
      
      # Perform replacements
      sed -i 's/AnythingLLM/SolnAI/g' "$FILE" 
      COUNT=$(grep -c "SolnAI" "$FILE")
      REPLACED_COUNT=$((REPLACED_COUNT + COUNT))
      
      sed -i 's/anythingllm/solnai/g' "$FILE"
      COUNT=$(grep -c "solnai" "$FILE")
      REPLACED_COUNT=$((REPLACED_COUNT + COUNT))
      
      sed -i 's/ANYTHINGLLM/SOLNAI/g' "$FILE"
      COUNT=$(grep -c "SOLNAI" "$FILE")
      REPLACED_COUNT=$((REPLACED_COUNT + COUNT))
      
      sed -i 's/anything-llm/solnai/g' "$FILE"
      COUNT=$(grep -c "solnai" "$FILE")
      REPLACED_COUNT=$((REPLACED_COUNT + COUNT))
      
      # Log the changes
      echo "Modified $FILE: $REPLACED_COUNT replacements" >> $LOG_FILE
      TOTAL_REPLACED=$((TOTAL_REPLACED + REPLACED_COUNT))
      FILES_MODIFIED=$((FILES_MODIFIED + 1))
    fi
  done
done

echo "Replacement complete!" 
echo "Files modified: $FILES_MODIFIED" >> $LOG_FILE
echo "Total replacements: $TOTAL_REPLACED" >> $LOG_FILE
echo "See $LOG_FILE for details."

