#!/usr/bin/env python3
"""
Convert content between different formats for optimal LLM token usage.

This module provides functionality to convert between various content formats
(markdown, text, JSON, HTML) while optimizing for LLM token usage.
"""

import os
import sys
import argparse
import json
import re
import html
from pathlib import Path
from datetime import datetime
import markdown
from bs4 import BeautifulSoup

from goose_tools.utils.file_utils import safe_write_file, ensure_directory, get_user_dirs
from goose_tools.utils.token_counter import estimate_tokens_chars


def detect_format(content):
    """Detect the format of the content.
    
    Args:
        content: The content to analyze.
        
    Returns:
        str: The detected format ('json', 'html', 'markdown', or 'text').
    """
    # Check if JSON
    try:
        json.loads(content)
        return 'json'
    except (json.JSONDecodeError, TypeError):
        pass
    
    # Check if HTML
    if re.search(r'<!DOCTYPE html>|<html|<body|<div|<p>|<span>|<h[1-6]', content, re.IGNORECASE):
        return 'html'
    
    # Check if Markdown
    md_patterns = [
        r'^#+\s+.+$',  # Headers
        r'^\s*[*-]\s+.+$',  # List items
        r'\[.+\]\(.+\)',  # Links
        r'!\[.+\]\(.+\)',  # Images
        r'`{1,3}[^`]+`{1,3}',  # Code blocks
        r'^>\s+.+$',  # Blockquotes
    ]
    
    md_score = sum(1 for pattern in md_patterns if re.search(pattern, content, re.MULTILINE))
    
    if md_score >= 2:
        return 'markdown'
    
    # Default to plain text
    return 'text'


def convert_to_markdown(content, from_format):
    """Convert content to Markdown format.
    
    Args:
        content: The content to convert.
        from_format: The source format ('json', 'html', 'text').
        
    Returns:
        str: The converted Markdown content.
    """
    if from_format == 'markdown':
        return content
    
    if from_format == 'json':
        try:
            data = json.loads(content)
            
            # Handle different JSON structures
            if isinstance(data, dict):
                # Try to extract text content from known fields
                text_fields = ['text', 'content', 'body', 'description']
                for field in text_fields:
                    if field in data and isinstance(data[field], str):
                        return data[field]
                
                # Format as Markdown
                result = []
                result.append("# JSON Content\n")
                
                for key, value in data.items():
                    result.append(f"## {key}")
                    if isinstance(value, (dict, list)):
                        result.append(f"```json\n{json.dumps(value, indent=2)}\n```")
                    else:
                        result.append(f"{value}")
                    result.append("")
                
                return "\n".join(result)
            
            elif isinstance(data, list):
                # Format list as Markdown
                result = ["# JSON Content\n"]
                
                for i, item in enumerate(data):
                    result.append(f"## Item {i+1}")
                    
                    if isinstance(item, dict):
                        for key, value in item.items():
                            result.append(f"### {key}")
                            if isinstance(value, (dict, list)):
                                result.append(f"```json\n{json.dumps(value, indent=2)}\n```")
                            else:
                                result.append(f"{value}")
                            result.append("")
                    else:
                        result.append(f"{item}")
                        result.append("")
                
                return "\n".join(result)
            
            else:
                return f"```json\n{json.dumps(data, indent=2)}\n```"
            
        except Exception as e:
            return f"Error converting JSON: {str(e)}"
    
    elif from_format == 'html':
        try:
            soup = BeautifulSoup(content, 'html.parser')
            
            # Remove script and style elements
            for tag in soup(['script', 'style']):
                tag.extract()
            
            result = []
            
            # Convert common HTML elements to Markdown
            for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre']):
                if tag.name.startswith('h'):
                    level = int(tag.name[1])
                    result.append(f"{'#' * level} {tag.get_text().strip()}")
                elif tag.name == 'p':
                    result.append(tag.get_text().strip())
                elif tag.name == 'ul':
                    for li in tag.find_all('li', recursive=False):
                        result.append(f"* {li.get_text().strip()}")
                elif tag.name == 'ol':
                    for i, li in enumerate(tag.find_all('li', recursive=False), 1):
                        result.append(f"{i}. {li.get_text().strip()}")
                elif tag.name == 'a':
                    result.append(f"[{tag.get_text().strip()}]({tag.get('href', '')})")
                elif tag.name == 'img':
                    result.append(f"![{tag.get('alt', 'Image')}]({tag.get('src', '')})")
                elif tag.name == 'code':
                    result.append(f"`{tag.get_text().strip()}`")
                elif tag.name == 'pre':
                    result.append(f"```\n{tag.get_text().strip()}\n```")
            
            return "\n\n".join(result)
        
        except Exception as e:
            return f"Error converting HTML: {str(e)}"
    
    elif from_format == 'text':
        # Convert plain text to basic Markdown
        lines = content.splitlines()
        result = []
        
        for i, line in enumerate(lines):
            # Try to detect headings
            if i > 0 and not lines[i-1].strip() and i < len(lines) - 1 and not lines[i+1].strip():
                if len(line) < 50 and line.strip():
                    result.append(f"## {line}")
                    continue
            
            # Try to detect list items
            if re.match(r'^\s*[\d*-]+[\s.)]', line):
                result.append(f"{line}")
                continue
            
            # Regular paragraph
            result.append(line)
        
        return "\n".join(result)
    
    return content


def convert_to_text(content, from_format):
    """Convert content to plain text format.
    
    Args:
        content: The content to convert.
        from_format: The source format ('json', 'html', 'markdown').
        
    Returns:
        str: The converted plain text content.
    """
    if from_format == 'text':
        return content
    
    if from_format == 'markdown':
        # Remove markdown formatting
        text = content
        
        # Remove headers
        text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
        
        # Remove links, keeping the text
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
        
        # Remove images, keeping alt text
        text = re.sub(r'!\[([^\]]+)\]\([^)]+\)', r'\1', text)
        
        # Remove code blocks
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
        
        # Remove inline code
        text = re.sub(r'`([^`]+)`', r'\1', text)
        
        # Remove blockquotes
        text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
        
        # Clean up bullet points
        text = re.sub(r'^\s*[*-]\s+', '- ', text, flags=re.MULTILINE)
        
        return text
    
    elif from_format == 'html':
        try:
            soup = BeautifulSoup(content, 'html.parser')
            
            # Remove script and style elements
            for tag in soup(['script', 'style']):
                tag.extract()
            
            # Get text
            text = soup.get_text()
            
            # Normalize whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return text
        
        except Exception as e:
            return f"Error converting HTML to text: {str(e)}"
    
    elif from_format == 'json':
        try:
            data = json.loads(content)
            
            if isinstance(data, dict):
                # Try to extract text content from known fields
                text_fields = ['text', 'content', 'body', 'description']
                for field in text_fields:
                    if field in data and isinstance(data[field], str):
                        return data[field]
                
                # Format as plain text
                result = []
                for key, value in data.items():
                    if isinstance(value, (dict, list)):
                        result.append(f"{key}:")
                        result.append(json.dumps(value, indent=2))
                    else:
                        result.append(f"{key}: {value}")
                
                return "\n".join(result)
            
            elif isinstance(data, list):
                result = []
                for i, item in enumerate(data):
                    result.append(f"Item {i+1}:")
                    if isinstance(item, dict):
                        for key, value in item.items():
                            if isinstance(value, (dict, list)):
                                result.append(f"  {key}:")
                                result.append(f"  {json.dumps(value)}")
                            else:
                                result.append(f"  {key}: {value}")
                    else:
                        result.append(f"  {item}")
                
                return "\n".join(result)
            
            else:
                return str(data)
            
        except Exception as e:
            return f"Error converting JSON to text: {str(e)}"
    
    return content


def convert_to_json(content, from_format):
    """Convert content to JSON format.
    
    Args:
        content: The content to convert.
        from_format: The source format ('text', 'html', 'markdown').
        
    Returns:
        str: The converted JSON content.
    """
    if from_format == 'json':
        # Already JSON, but validate and pretty-print
        try:
            data = json.loads(content)
            return json.dumps(data, indent=2)
        except Exception:
            # Return as is if not valid JSON
            return content
    
    # Create a JSON structure based on format
    result = {
        "content": content,
        "format": from_format,
        "metadata": {
            "converted_at": datetime.now().isoformat(),
            "estimated_tokens": estimate_tokens_chars(content)
        }
    }
    
    if from_format == 'html':
        # Extract some extra metadata from HTML
        try:
            soup = BeautifulSoup(content, 'html.parser')
            
            # Add title if present
            title_tag = soup.find('title')
            if title_tag:
                result["metadata"]["title"] = title_tag.string
            
            # Add headings
            headings = []
            for h in soup.find_all(['h1', 'h2', 'h3', 'h4']):
                headings.append({
                    "level": int(h.name[1]),
                    "text": h.get_text().strip()
                })
            
            if headings:
                result["metadata"]["headings"] = headings
            
            # Add links
            links = []
            for a in soup.find_all('a', href=True):
                links.append({
                    "text": a.get_text().strip(),
                    "href": a['href']
                })
            
            if links:
                result["metadata"]["links"] = links
        
        except Exception:
            pass
    
    elif from_format == 'markdown':
        # Extract some metadata from Markdown
        try:
            # Extract headings
            headings = []
            for match in re.finditer(r'^(#+)\s+(.+)$', content, re.MULTILINE):
                headings.append({
                    "level": len(match.group(1)),
                    "text": match.group(2).strip()
                })
            
            if headings:
                result["metadata"]["headings"] = headings
            
            # Extract links
            links = []
            for match in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', content):
                links.append({
                    "text": match.group(1),
                    "href": match.group(2)
                })
            
            if links:
                result["metadata"]["links"] = links
        
        except Exception:
            pass
    
    return json.dumps(result, indent=2)


def convert_to_html(content, from_format):
    """Convert content to HTML format.
    
    Args:
        content: The content to convert.
        from_format: The source format ('text', 'json', 'markdown').
        
    Returns:
        str: The converted HTML content.
    """
    if from_format == 'html':
        # Already HTML, but try to clean and format it
        try:
            soup = BeautifulSoup(content, 'html.parser')
            return soup.prettify()
        except Exception:
            # Return as is if can't parse
            return content
    
    if from_format == 'markdown':
        # Convert Markdown to HTML
        try:
            html_content = markdown.markdown(content)
            
            # Wrap in basic HTML structure
            html_doc = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Converted Markdown</title>
</head>
<body>
{html_content}
</body>
</html>
"""
            return html_doc
        
        except Exception as e:
            return f"<p>Error converting Markdown to HTML: {str(e)}</p>"
    
    elif from_format == 'text':
        # Convert plain text to HTML
        # Escape HTML special chars
        escaped_text = html.escape(content)
        
        # Convert line breaks to <br> tags
        html_text = escaped_text.replace('\n', '<br>\n')
        
        # Wrap in basic HTML structure
        html_doc = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Converted Text</title>
</head>
<body>
<p>{html_text}</p>
</body>
</html>
"""
        return html_doc
    
    elif from_format == 'json':
        try:
            data = json.loads(content)
            
            # Handle different JSON structures
            if isinstance(data, dict) and "content" in data:
                # This might be our own format from convert_to_json
                if data.get("format") == "html":
                    return data["content"]
                
                # If it's markdown, convert it
                if data.get("format") == "markdown":
                    return convert_to_html(data["content"], "markdown")
            
            # Generic JSON to HTML conversion
            html_parts = ['<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="utf-8">\n    <title>Converted JSON</title>\n</head>\n<body>']
            
            if isinstance(data, dict):
                html_parts.append('<h1>JSON Content</h1>')
                html_parts.append('<dl>')
                
                for key, value in data.items():
                    html_parts.append(f'<dt>{html.escape(key)}</dt>')
                    
                    if isinstance(value, (dict, list)):
                        html_parts.append(f'<dd><pre>{html.escape(json.dumps(value, indent=2))}</pre></dd>')
                    else:
                        html_parts.append(f'<dd>{html.escape(str(value))}</dd>')
                
                html_parts.append('</dl>')
            
            elif isinstance(data, list):
                html_parts.append('<h1>JSON Array</h1>')
                html_parts.append('<ol>')
                
                for item in data:
                    if isinstance(item, (dict, list)):
                        html_parts.append(f'<li><pre>{html.escape(json.dumps(item, indent=2))}</pre></li>')
                    else:
                        html_parts.append(f'<li>{html.escape(str(item))}</li>')
                
                html_parts.append('</ol>')
            
            else:
                html_parts.append(f'<pre>{html.escape(json.dumps(data, indent=2))}</pre>')
            
            html_parts.append('</body>\n</html>')
            return '\n'.join(html_parts)
            
        except Exception as e:
            return f"<p>Error converting JSON to HTML: {str(e)}</p>"
    
    return f"<p>{html.escape(content)}</p>"


def main():
    """Main entry point for the convert_content tool."""
    parser = argparse.ArgumentParser(
        description="Convert content between different formats for optimal LLM token usage"
    )
    
    parser.add_argument("input_file", help="Input file to convert")
    parser.add_argument("output_file", nargs="?", help="Output file (optional)")
    parser.add_argument("--from", dest="from_format", choices=["auto", "text", "markdown", "html", "json"],
                       default="auto", help="Source format (default: auto-detect)")
    parser.add_argument("--to", dest="to_format", choices=["text", "markdown", "html", "json"],
                       default="markdown", help="Target format (default: markdown)")
    parser.add_argument("--optimize", action="store_true", help="Optimize for token usage")
    parser.add_argument("--summarize", action="store_true", help="Include a summary at the top")
    
    args = parser.parse_args()
    
    # Check if input file exists
    if not os.path.exists(args.input_file):
        print(f"Error: Input file '{args.input_file}' does not exist.")
        return 1
    
    # Read input file
    try:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading input file: {str(e)}")
        return 1
    
    # Auto-detect format if needed
    from_format = args.from_format
    if from_format == "auto":
        from_format = detect_format(content)
        print(f"Detected format: {from_format}")
    
    # Convert content
    to_format = args.to_format
    
    if to_format == "markdown":
        output_content = convert_to_markdown(content, from_format)
    elif to_format == "text":
        output_content = convert_to_text(content, from_format)
    elif to_format == "json":
        output_content = convert_to_json(content, from_format)
    elif to_format == "html":
        output_content = convert_to_html(content, from_format)
    else:
        print(f"Error: Unsupported target format '{to_format}'")
        return 1
    
    # Optimize for token usage if requested
    if args.optimize:
        # Implement token usage optimization strategies
        if to_format in ["text", "markdown"]:
            # Remove excessive whitespace
            output_content = re.sub(r'\n{3,}', '\n\n', output_content)
            
            # Limit line length
            lines = output_content.splitlines()
            optimized_lines = []
            
            for line in lines:
                if len(line) > 80:
                    # Break long lines
                    words = line.split()
                    current_line = []
                    current_length = 0
                    
                    for word in words:
                        if current_length + len(word) + 1 > 80:
                            optimized_lines.append(' '.join(current_line))
                            current_line = [word]
                            current_length = len(word)
                        else:
                            current_line.append(word)
                            current_length += len(word) + 1
                    
                    if current_line:
                        optimized_lines.append(' '.join(current_line))
                else:
                    optimized_lines.append(line)
            
            output_content = '\n'.join(optimized_lines)
    
    # Add summary if requested
    if args.summarize:
        token_count = estimate_tokens_chars(output_content)
        char_count = len(output_content)
        line_count = len(output_content.splitlines())
        
        summary = f"""# Content Summary
- Converted from: {from_format}
- Converted to: {to_format}
- Original file: {os.path.basename(args.input_file)}
- Estimated tokens: {token_count}
- Characters: {char_count}
- Lines: {line_count}

"""
        output_content = summary + output_content
    
    # Determine output file
    output_file = args.output_file
    if not output_file:
        input_name = os.path.splitext(args.input_file)[0]
        extensions = {
            "markdown": ".md",
            "text": ".txt",
            "json": ".json",
            "html": ".html"
        }
        output_file = f"{input_name}_converted{extensions.get(to_format, '.txt')}"
    
    # Write output
    try:
        safe_write_file(output_file, output_content)
        print(f"Conversion complete. Output written to: {output_file}")
        print(f"Estimated tokens: {estimate_tokens_chars(output_content)}")
    except Exception as e:
        print(f"Error writing output file: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 