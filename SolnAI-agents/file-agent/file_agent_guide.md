# File Agent Implementation Guide

## Overview

The File Agent is designed to efficiently manage, process, and transform files across various formats. This guide details how to implement the SolnAI core modules (llm-chain, llguidance, and aici) for this specific agent.

## Implementation Details

### 1. llm-chain Implementation

The File Agent requires a robust workflow to handle different file types, extract content, and perform transformations. Here's the optimal implementation using llm-chain:

```python
from llm_chain import Chain, Step

def file_agent_chain(file_path, operation_type="analyze", output_format=None, transformation_rules=None):
    # Define the processing steps with optimal dependencies
    steps = [
        Step("detect_file_type", detect_file_format_and_encoding, 
             config={"deep_inspection": True, "handle_binary": True}),
        
        Step("validate_file", validate_file_integrity, 
             depends_on=["detect_file_type"],
             config={"check_corruption": True, "verify_structure": True}),
        
        Step("extract_content", extract_file_content, 
             depends_on=["detect_file_type", "validate_file"],
             config={"extraction_depth": "full", "preserve_formatting": True}),
        
        Step("analyze_structure", analyze_file_structure, 
             depends_on=["extract_content"],
             config={"identify_sections": True, "detect_patterns": True}),
        
        Step("extract_metadata", extract_file_metadata, 
             depends_on=["detect_file_type"],
             config={"include_system_metadata": True, "extract_embedded_metadata": True}),
        
        Step("process_content", process_file_content, 
             depends_on=["extract_content", "analyze_structure"],
             config={"operation": operation_type, "transformation_rules": transformation_rules}),
        
        Step("generate_summary", generate_file_summary, 
             depends_on=["extract_content", "extract_metadata", "analyze_structure"],
             config={"summary_length": "medium", "include_key_points": True}),
        
        Step("transform_format", transform_file_format, 
             depends_on=["process_content"],
             config={"target_format": output_format, "optimize_output": True}),
        
        Step("validate_output", validate_transformed_output, 
             depends_on=["transform_format"],
             config={"verify_integrity": True, "check_compatibility": True}),
        
        Step("compile_results", compile_processing_results, 
             depends_on=["generate_summary", "transform_format", "validate_output"],
             config={"include_processing_log": True, "include_metadata": True})
    ]
    
    # Customize steps based on operation type
    if operation_type == "analyze":
        # Skip transformation steps for analysis-only operations
        steps = [s for s in steps if s.name not in ["transform_format", "validate_output"]]
    elif operation_type == "convert":
        # Ensure output format is specified for conversion operations
        if not output_format:
            raise ValueError("Output format must be specified for conversion operations")
    elif operation_type == "extract":
        # Focus on content extraction with minimal processing
        steps = [s for s in steps if s.name in ["detect_file_type", "validate_file", "extract_content", 
                                               "extract_metadata", "compile_results"]]
    
    # Create and execute the chain with optimal batch size and concurrency
    chain = Chain(steps, batch_size=2, max_concurrency=3)
    
    # Prepare input data
    input_data = {
        "file_path": file_path,
        "operation_type": operation_type,
        "output_format": output_format,
        "transformation_rules": transformation_rules
    }
    
    return chain.execute(**input_data)
```

### 2. llguidance Implementation

The File Agent needs to ensure structured outputs for file analysis and transformations. Here's the optimal implementation using llguidance:

```python
from llguidance import Grammar, JSONSchema

# Define the schema for file analysis reports with optimal constraints
file_analysis_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "file_info": {
      "type": "object",
      "properties": {
        "filename": { "type": "string" },
        "file_type": { "type": "string" },
        "size_bytes": { "type": "integer" },
        "encoding": { "type": "string" },
        "last_modified": { "type": "string", "format": "date-time" },
        "mime_type": { "type": "string" }
      },
      "required": ["filename", "file_type", "size_bytes"]
    },
    "content_summary": {
      "type": "object",
      "properties": {
        "line_count": { "type": "integer" },
        "word_count": { "type": "integer" },
        "character_count": { "type": "integer" },
        "is_binary": { "type": "boolean" },
        "language": { "type": "string" },
        "encoding_confidence": { 
          "type": "number",
          "minimum": 0,
          "maximum": 1
        }
      }
    },
    "structure_analysis": {
      "type": "object",
      "properties": {
        "sections": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "start_position": { "type": "integer" },
              "end_position": { "type": "integer" },
              "content_preview": { "type": "string" }
            },
            "required": ["name", "start_position", "end_position"]
          }
        },
        "detected_patterns": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "pattern_type": { "type": "string" },
              "occurrences": { "type": "integer" },
              "example": { "type": "string" }
            },
            "required": ["pattern_type", "occurrences"]
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "content_preview": { "type": "string" },
    "processing_recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["file_info", "content_summary", "content_preview"]
}
""")

# Define the schema for transformation rules
transformation_rules_schema = JSONSchema("""
{
  "type": "object",
  "properties": {
    "operations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "operation": { 
            "type": "string",
            "enum": ["replace", "extract", "remove", "insert", "reformat", "translate", "anonymize"]
          },
          "target": { "type": "string" },
          "pattern": { "type": "string" },
          "replacement": { "type": "string" },
          "options": {
            "type": "object",
            "additionalProperties": true
          }
        },
        "required": ["operation", "target"]
      },
      "minItems": 1
    },
    "global_options": {
      "type": "object",
      "properties": {
        "case_sensitive": { "type": "boolean" },
        "preserve_formatting": { "type": "boolean" },
        "backup_original": { "type": "boolean" }
      }
    }
  },
  "required": ["operations"]
}
""")

# Define the grammar for file path patterns
file_path_grammar = Grammar("""
file_path ::= absolute_path | relative_path
absolute_path ::= root directory_separator path_component+
root ::= windows_root | unix_root
windows_root ::= drive_letter ":" | network_path
drive_letter ::= /[A-Za-z]/
network_path ::= "\\\\" server_name
server_name ::= /[A-Za-z0-9_-]+/
unix_root ::= "/"
directory_separator ::= "/" | "\\"
path_component ::= component directory_separator | component
component ::= /[A-Za-z0-9_.-]+/
relative_path ::= path_component+
""")

# Apply the schemas to constrain the LLM output
def generate_file_analysis(file_content, file_metadata):
    # Generate file analysis with structured output
    analysis_prompt = f"""
    Analyze this file content and metadata:
    Content preview: {file_content[:1000]}...
    Metadata: {file_metadata}
    """
    
    # Generate analysis with appropriate constraints
    analysis = llm.generate(analysis_prompt, grammar=file_analysis_schema)
    
    return analysis

def generate_transformation_rules(file_analysis, target_format, transformation_description):
    # Generate transformation rules with structured output
    rules_prompt = f"""
    Create transformation rules to convert this file:
    File analysis: {file_analysis}
    Target format: {target_format}
    Transformation description: {transformation_description}
    """
    
    # Generate rules with appropriate constraints
    rules = llm.generate(rules_prompt, grammar=transformation_rules_schema)
    
    return rules
```

### 3. aici Implementation

The File Agent needs fine-grained control over token generation for file processing and transformation. Here's the optimal implementation using aici:

```python
import pyaici.server as aici
import os
import json
import re

async def process_file(file_path, operation_type="analyze", output_format=None, transformation_rules=None):
    # Get file information
    file_info = await aici.call_external_api(
        "file_inspector",
        {"path": file_path},
        timeout=5000
    )
    
    # Initialize with file information
    await aici.FixedTokens(f"# File Processing: {os.path.basename(file_path)}\n\n")
    await aici.FixedTokens(f"- File type: {file_info['file_type']}\n")
    await aici.FixedTokens(f"- Size: {file_info['size_bytes']} bytes\n")
    await aici.FixedTokens(f"- Last modified: {file_info['last_modified']}\n\n")
    
    # Extract file content based on file type
    if file_info['is_binary'] and file_info['file_type'] not in ['pdf', 'docx', 'xlsx', 'pptx']:
        await aici.FixedTokens("This is a binary file that cannot be directly processed as text.\n\n")
        content_preview = "Binary content"
    else:
        # Extract content using appropriate method based on file type
        content = await aici.call_external_api(
            "content_extractor",
            {"path": file_path, "file_type": file_info['file_type']},
            timeout=10000
        )
        content_preview = content[:1000] + "..." if len(content) > 1000 else content
    
    # Generate analysis based on operation type
    if operation_type == "analyze":
        await aici.FixedTokens("## File Analysis\n\n")
        
        # Generate content summary
        await aici.FixedTokens("### Content Summary\n\n")
        summary_marker = aici.Label()
        
        if not file_info['is_binary'] or file_info['file_type'] in ['pdf', 'docx', 'xlsx', 'pptx']:
            await aici.FixedTokens(f"- Line count: {file_info['line_count']}\n")
            await aici.FixedTokens(f"- Word count: {file_info['word_count']}\n")
            await aici.FixedTokens(f"- Character count: {file_info['character_count']}\n")
            if 'language' in file_info:
                await aici.FixedTokens(f"- Detected language: {file_info['language']}\n")
        
        # Generate structure analysis
        await aici.FixedTokens("\n### Structure Analysis\n\n")
        structure_marker = aici.Label()
        
        if 'sections' in file_info:
            for i, section in enumerate(file_info['sections']):
                await aici.FixedTokens(f"#### Section {i+1}: {section['name']}\n")
                await aici.FixedTokens(f"- Position: {section['start_position']} to {section['end_position']}\n")
                await aici.FixedTokens(f"- Preview: {section['content_preview']}\n\n")
        else:
            await aici.gen_text(stop_at="\n\n", max_tokens=300)
        
        # Generate content preview
        await aici.FixedTokens("### Content Preview\n\n")
        await aici.FixedTokens("```\n")
        await aici.FixedTokens(content_preview)
        await aici.FixedTokens("\n```\n\n")
        
        # Generate recommendations
        await aici.FixedTokens("### Processing Recommendations\n\n")
        recommendations_marker = aici.Label()
        await aici.gen_text(stop_at="\n\n", max_tokens=300)
    
    elif operation_type == "convert" and output_format:
        await aici.FixedTokens(f"## File Conversion: {file_info['file_type']} to {output_format}\n\n")
        
        # Generate conversion steps
        await aici.FixedTokens("### Conversion Process\n\n")
        conversion_marker = aici.Label()
        
        # Generate specific steps based on source and target formats
        if file_info['file_type'] == 'csv' and output_format == 'json':
            await aici.FixedTokens("1. Parse CSV structure\n")
            await aici.FixedTokens("2. Identify headers and data types\n")
            await aici.FixedTokens("3. Convert rows to JSON objects\n")
            await aici.FixedTokens("4. Format JSON output\n\n")
        elif file_info['file_type'] == 'json' and output_format == 'csv':
            await aici.FixedTokens("1. Parse JSON structure\n")
            await aici.FixedTokens("2. Extract common fields for headers\n")
            await aici.FixedTokens("3. Flatten nested structures\n")
            await aici.FixedTokens("4. Generate CSV rows\n\n")
        else:
            await aici.gen_text(stop_at="\n\n", max_tokens=200)
        
        # Generate conversion code
        await aici.FixedTokens("### Conversion Code\n\n")
        code_marker = aici.Label()
        
        await aici.FixedTokens("```python\n")
        
        # Generate appropriate conversion code based on formats
        if file_info['file_type'] == 'csv' and output_format == 'json':
            await aici.FixedTokens("import csv\nimport json\n\n")
            await aici.FixedTokens(f"def convert_csv_to_json(input_file='{file_path}', output_file='output.json'):\n")
            await aici.FixedTokens("    data = []\n")
            await aici.FixedTokens("    with open(input_file, 'r', encoding='utf-8') as csvfile:\n")
            await aici.FixedTokens("        csvreader = csv.DictReader(csvfile)\n")
            await aici.FixedTokens("        for row in csvreader:\n")
            await aici.FixedTokens("            data.append(row)\n\n")
            await aici.FixedTokens("    with open(output_file, 'w', encoding='utf-8') as jsonfile:\n")
            await aici.FixedTokens("        json.dump(data, jsonfile, indent=4)\n\n")
            await aici.FixedTokens("    return output_file\n\n")
            await aici.FixedTokens("# Execute conversion\n")
            await aici.FixedTokens("convert_csv_to_json()\n")
        elif file_info['file_type'] == 'json' and output_format == 'csv':
            await aici.FixedTokens("import json\nimport csv\n\n")
            await aici.FixedTokens(f"def convert_json_to_csv(input_file='{file_path}', output_file='output.csv'):\n")
            await aici.FixedTokens("    with open(input_file, 'r', encoding='utf-8') as jsonfile:\n")
            await aici.FixedTokens("        data = json.load(jsonfile)\n\n")
            await aici.FixedTokens("    # Get all possible fields\n")
            await aici.FixedTokens("    fields = set()\n")
            await aici.FixedTokens("    for item in data:\n")
            await aici.FixedTokens("        fields.update(item.keys())\n")
            await aici.FixedTokens("    fields = list(fields)\n\n")
            await aici.FixedTokens("    with open(output_file, 'w', encoding='utf-8', newline='') as csvfile:\n")
            await aici.FixedTokens("        writer = csv.DictWriter(csvfile, fieldnames=fields)\n")
            await aici.FixedTokens("        writer.writeheader()\n")
            await aici.FixedTokens("        writer.writerows(data)\n\n")
            await aici.FixedTokens("    return output_file\n\n")
            await aici.FixedTokens("# Execute conversion\n")
            await aici.FixedTokens("convert_json_to_csv()\n")
        else:
            await aici.gen_text(stop_at="\n", max_tokens=500)
        
        await aici.FixedTokens("\n```\n\n")
        
        # Generate output preview
        await aici.FixedTokens("### Output Preview\n\n")
        await aici.FixedTokens("```\n")
        await aici.gen_text(stop_at="\n", max_tokens=200)
        await aici.FixedTokens("\n```\n")
    
    elif operation_type == "transform" and transformation_rules:
        await aici.FixedTokens("## File Transformation\n\n")
        
        # Generate transformation steps
        await aici.FixedTokens("### Transformation Process\n\n")
        transform_marker = aici.Label()
        
        for i, rule in enumerate(transformation_rules.get("operations", [])):
            await aici.FixedTokens(f"{i+1}. {rule['operation'].capitalize()}: {rule['target']}\n")
            if 'pattern' in rule:
                await aici.FixedTokens(f"   - Pattern: {rule['pattern']}\n")
            if 'replacement' in rule:
                await aici.FixedTokens(f"   - Replacement: {rule['replacement']}\n")
        
        await aici.FixedTokens("\n")
        
        # Generate transformation code
        await aici.FixedTokens("### Transformation Code\n\n")
        transform_code_marker = aici.Label()
        
        await aici.FixedTokens("```python\n")
        await aici.FixedTokens("import re\n\n")
        await aici.FixedTokens(f"def transform_file(input_file='{file_path}', output_file='transformed_output'):\n")
        await aici.FixedTokens("    # Read input file\n")
        await aici.FixedTokens("    with open(input_file, 'r', encoding='utf-8') as f:\n")
        await aici.FixedTokens("        content = f.read()\n\n")
        await aici.FixedTokens("    # Apply transformations\n")
        
        for rule in transformation_rules.get("operations", []):
            if rule['operation'] == 'replace' and 'pattern' in rule and 'replacement' in rule:
                await aici.FixedTokens(f"    # {rule['operation'].capitalize()}: {rule['target']}\n")
                await aici.FixedTokens(f"    content = re.sub(r'{rule['pattern']}', '{rule['replacement']}', content)\n\n")
            elif rule['operation'] == 'remove' and 'pattern' in rule:
                await aici.FixedTokens(f"    # {rule['operation'].capitalize()}: {rule['target']}\n")
                await aici.FixedTokens(f"    content = re.sub(r'{rule['pattern']}', '', content)\n\n")
        
        await aici.FixedTokens("    # Write output file\n")
        await aici.FixedTokens("    with open(output_file, 'w', encoding='utf-8') as f:\n")
        await aici.FixedTokens("        f.write(content)\n\n")
        await aici.FixedTokens("    return output_file\n\n")
        await aici.FixedTokens("# Execute transformation\n")
        await aici.FixedTokens("transform_file()\n")
        await aici.FixedTokens("```\n\n")
    
    # Store the generated content with optimal variable names
    if operation_type == "analyze":
        aici.set_var("summary", summary_marker.text_since())
        aici.set_var("structure", structure_marker.text_since())
        aici.set_var("recommendations", recommendations_marker.text_since())
    elif operation_type == "convert":
        aici.set_var("conversion_steps", conversion_marker.text_since())
        aici.set_var("conversion_code", code_marker.text_since())
    elif operation_type == "transform":
        aici.set_var("transform_steps", transform_marker.text_since())
        aici.set_var("transform_code", transform_code_marker.text_since())

# Start the aici controller with optimal timeout
aici.start(process_file(file_path, operation_type, output_format, transformation_rules), timeout=30000)
```

## Integration and Optimization

To integrate all three modules for the File Agent:

```python
def file_agent(file_path, operation_type="analyze", output_format=None, transformation_description=None):
    # 1. Use llm-chain for the overall workflow
    chain_results = file_agent_chain(
        file_path=file_path,
        operation_type=operation_type,
        output_format=output_format
    )
    
    # Extract file information and content for further processing
    file_analysis = chain_results["generate_summary"]["analysis"]
    file_metadata = chain_results["extract_metadata"]["metadata"]
    
    # 2. Apply llguidance constraints for structured outputs
    if operation_type == "analyze":
        # Generate structured analysis report
        analysis_report = generate_file_analysis(
            file_content=chain_results["extract_content"]["content"],
            file_metadata=file_metadata
        )
        transformation_rules = None
    else:
        # Generate transformation rules if needed
        if transformation_description:
            transformation_rules = generate_transformation_rules(
                file_analysis=file_analysis,
                target_format=output_format,
                transformation_description=transformation_description
            )
        else:
            transformation_rules = None
    
    # 3. Use aici for final output generation with precise control
    final_output = aici.run(
        process_file,
        file_path=file_path,
        operation_type=operation_type,
        output_format=output_format,
        transformation_rules=transformation_rules,
        context={
            "chain_results": chain_results,
            "file_analysis": file_analysis
        },
        max_tokens=5000,
        temperature=0.3
    )
    
    return final_output
```

## Optimal Configuration Values

For the File Agent, the following configuration values are optimal:

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| `batch_size` | 2 | Balances memory usage with processing efficiency for file operations |
| `max_concurrency` | 3 | Optimal for parallel file processing tasks |
| `deep_inspection` | True | Ensures thorough file type detection |
| `extraction_depth` | "full" | Extracts complete file content for comprehensive analysis |
| `summary_length` | "medium" | Provides sufficient detail without excessive verbosity |
| `temperature` | 0.3 | Lower temperature for more precise, factual file analysis |
| `max_tokens` | 5000 | Sufficient for comprehensive file analysis and transformation |
| `timeout` | 30000 | Allows for complex file processing (30 seconds) |

## Conclusion

This implementation guide provides a comprehensive approach to implementing the SolnAI core modules for the File Agent. By following these guidelines and using the optimal configuration values, you can create a powerful file processing tool that can analyze, convert, and transform files across various formats with high precision and reliability. 