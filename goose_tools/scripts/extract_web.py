#!/usr/bin/env python3
"""
Extract relevant text from web pages while minimizing token usage.

This module provides functionality to extract the most relevant content from 
web pages, with options to filter by CSS selector, extract specific elements,
render JavaScript, and reduce token counts for LLM context.
"""

import os
import sys
import argparse
import subprocess
import tempfile
import re
import json
from datetime import datetime
from pathlib import Path
import shutil

from goose_tools.utils.file_utils import safe_write_file, ensure_directory, get_user_dirs
from goose_tools.utils.token_counter import estimate_tokens_chars

# Try to import optional dependencies
try:
    import requests
    from bs4 import BeautifulSoup
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


def extract_with_requests(url, css_selector=None):
    """Extract content from a URL using requests and BeautifulSoup.
    
    Args:
        url: The URL to extract content from.
        css_selector: Optional CSS selector to filter content.
        
    Returns:
        str: The extracted content.
    """
    if not REQUESTS_AVAILABLE:
        raise ImportError("The requests and beautifulsoup4 packages are required for this feature.")
    
    try:
        response = requests.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
        
        # Extract by CSS selector if provided
        if css_selector:
            elements = soup.select(css_selector)
            if elements:
                text = '\n\n'.join(element.get_text() for element in elements)
            else:
                text = "No content found matching the CSS selector."
        else:
            # Get all text
            text = soup.get_text()
        
        # Clean up excess whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text
        
    except Exception as e:
        return f"Error extracting content: {str(e)}"


def extract_with_lynx(url, preserve_tables=False):
    """Extract content using the lynx command-line tool.
    
    Args:
        url: The URL to extract content from.
        preserve_tables: Whether to try preserving table formatting.
        
    Returns:
        str: The extracted content.
    """
    lynx_path = shutil.which("lynx")
    if not lynx_path:
        return "Error: lynx command-line tool is not installed."
    
    try:
        width = 120 if preserve_tables else 80
        args = [
            lynx_path, "-dump", "-nolist", f"-width={width}", url
        ]
        
        result = subprocess.run(
            args, 
            capture_output=True, 
            text=True, 
            check=True
        )
        
        return result.stdout
        
    except subprocess.CalledProcessError as e:
        return f"Error extracting content with lynx: {str(e)}"
    except Exception as e:
        return f"Error: {str(e)}"


def extract_with_browser(url, css_selector=None):
    """Extract content using a headless browser (Puppeteer).
    
    Args:
        url: The URL to extract content from.
        css_selector: Optional CSS selector to filter content.
        
    Returns:
        str: The extracted content.
    """
    # Check if node and npm are installed
    if not shutil.which("node") or not shutil.which("npm"):
        return "Error: Node.js and npm are required for browser-based extraction."
    
    # Check if puppeteer is installed
    result = subprocess.run(
        ["npm", "list", "puppeteer"], 
        capture_output=True, 
        text=True
    )
    
    if "puppeteer" not in result.stdout:
        print("Installing Puppeteer for JavaScript rendering...")
        subprocess.run(
            ["npm", "install", "puppeteer"], 
            capture_output=True, 
            check=True
        )
    
    # Create a temporary JavaScript file
    with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False) as js_file:
        js_filepath = js_file.name
        
        # Write the puppeteer script
        script = f"""
        const puppeteer = require('puppeteer');

        (async () => {{
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          
          try {{
            await page.goto('{url}', {{
              waitUntil: 'networkidle2',
              timeout: 30000
            }});
            
            // Extract content based on selector if provided
            let content;
            if ('{css_selector}') {{
              await page.waitForSelector('{css_selector}', {{timeout: 5000}}).catch(() => {{}});
              content = await page.evaluate((selector) => {{
                const elements = document.querySelectorAll(selector);
                return Array.from(elements).map(el => el.innerText).join('\\n\\n');
              }}, '{css_selector}');
            }} else {{
              content = await page.evaluate(() => document.body.innerText);
            }}
            
            console.log(content);
          }}
          catch (error) {{
            console.error('Error during extraction:', error.message);
          }}
          finally {{
            await browser.close();
          }}
        }})();
        """
        
        js_file.write(script)
    
    try:
        # Run the puppeteer script
        result = subprocess.run(
            ["node", js_filepath], 
            capture_output=True, 
            text=True
        )
        
        # Clean up the temporary file
        os.unlink(js_filepath)
        
        return result.stdout or result.stderr
        
    except Exception as e:
        # Clean up the temporary file
        if os.path.exists(js_filepath):
            os.unlink(js_filepath)
        
        return f"Error extracting content with browser: {str(e)}"


def clean_content(content, remove_links=True, filter_pattern=None, exclude_pattern=None):
    """Clean and filter the extracted content.
    
    Args:
        content: The content to clean.
        remove_links: Whether to remove links from the content.
        filter_pattern: RegEx pattern to include only matching lines.
        exclude_pattern: RegEx pattern to exclude matching lines.
        
    Returns:
        str: The cleaned content.
    """
    # Split into lines
    lines = content.splitlines()
    
    # Remove links like [1], [2], etc.
    if remove_links:
        lines = [re.sub(r'\[[0-9]*\]', '', line) for line in lines]
    
    # Apply filter pattern
    if filter_pattern:
        regex = re.compile(filter_pattern)
        lines = [line for line in lines if regex.search(line)]
    
    # Apply exclude pattern
    if exclude_pattern:
        regex = re.compile(exclude_pattern)
        lines = [line for line in lines if not regex.search(line)]
    
    # Remove empty lines
    lines = [line for line in lines if line.strip()]
    
    return '\n'.join(lines)


def generate_summary(url, lines):
    """Generate a summary of the extracted content.
    
    Args:
        url: The source URL.
        lines: The content lines.
        
    Returns:
        str: The summary text.
    """
    domain = re.sub(r'https?://', '', url).split('/')[0]
    
    summary = [
        "## Summary", 
        f"This content was extracted from {domain} and contains approximately {len(lines)} lines of text.",
        "", 
        "Main sections:"
    ]
    
    # Extract potential headings (all caps lines or lines with ### markdown)
    headings = []
    for line in lines:
        if re.match(r'^[A-Z][A-Z0-9 ]+$', line) or line.startswith('#'):
            headings.append(f"- {line}")
            if len(headings) >= 10:
                break
    
    summary.extend(headings)
    summary.extend(["", "## Content", ""])
    
    return '\n'.join(summary)


def main():
    """Main entry point for the extract_web tool."""
    parser = argparse.ArgumentParser(
        description="Extract relevant text from web pages while minimizing token usage"
    )
    parser.add_argument("url", help="URL to extract content from")
    parser.add_argument("output_file", nargs="?", help="Output file (optional)")
    parser.add_argument("--max-lines", type=int, default=500, help="Maximum number of lines to extract")
    parser.add_argument("--no-links", action="store_true", help="Remove all links from the output (default: true)")
    parser.add_argument("--with-links", action="store_true", help="Preserve links in the output")
    parser.add_argument("--with-images", action="store_true", help="Include image descriptions")
    parser.add_argument("--with-tables", action="store_true", help="Try to preserve table formatting")
    parser.add_argument("--selector", help="Extract only content matching CSS selector")
    parser.add_argument("--render-js", action="store_true", help="Use headless browser to render JavaScript")
    parser.add_argument("--filter", help="Only include lines matching this pattern")
    parser.add_argument("--exclude", help="Exclude lines matching this pattern")
    parser.add_argument("--summary", action="store_true", help="Generate a brief summary at the beginning")
    parser.add_argument("--method", choices=["lynx", "requests", "browser"], 
                        help="Force a specific extraction method")
    
    args = parser.parse_args()
    
    # Default output file if not specified
    output_file = args.output_file or "cleaned_content.txt"
    
    # Get user directories
    user_dirs = get_user_dirs()
    cache_dir = Path(user_dirs["cache_dir"]) / "web"
    temp_dir = Path(user_dirs["temp_dir"])
    metadata_dir = Path(user_dirs["data_dir"]) / "metadata"
    
    # Create necessary directories
    ensure_directory(cache_dir)
    ensure_directory(temp_dir)
    ensure_directory(metadata_dir)
    
    print(f"Extracting content from {args.url} to {output_file}...")
    
    # Determine extraction method
    content = None
    method_used = None
    
    if args.method == "requests" or (not args.method and REQUESTS_AVAILABLE):
        method_used = "requests"
        content = extract_with_requests(args.url, args.selector)
    elif args.method == "browser" or args.render_js:
        method_used = "browser"
        content = extract_with_browser(args.url, args.selector)
    else:
        method_used = "lynx"
        content = extract_with_lynx(args.url, args.with_tables)
    
    if not content or "Error:" in content.splitlines()[0]:
        print(f"Failed to extract content using {method_used}. Falling back to lynx.")
        content = extract_with_lynx(args.url, args.with_tables)
        method_used = "lynx (fallback)"
    
    # Clean the content
    remove_links = not args.with_links
    content = clean_content(content, remove_links, args.filter, args.exclude)
    
    # Prepare output
    lines = content.splitlines()
    
    output = [
        "# Web Content Extraction",
        f"# Source: {args.url}",
        f"# Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"# Method: {method_used}",
        f"# Options: {'no-links' if remove_links else 'with-links'}, "
        f"{'with-images' if args.with_images else 'no-images'}, "
        f"{'with-tables' if args.with_tables else 'no-tables'}",
        ""
    ]
    
    # Add summary if requested
    if args.summary:
        output.append(generate_summary(args.url, lines))
    
    # Add content (limited to max_lines)
    max_lines = min(len(lines), args.max_lines)
    output.extend(lines[:max_lines])
    
    # If there were more lines than the limit
    if len(lines) > max_lines:
        output.append(f"\n# Note: {len(lines) - max_lines} additional lines were truncated")
    
    # Write to file
    content = '\n'.join(output)
    safe_write_file(output_file, content)
    
    # Get token estimation
    token_estimate = estimate_tokens_chars(content)
    
    print("Extraction complete.")
    print(f"Estimated tokens: ~{token_estimate}")
    print(f"File saved to: {output_file}")
    
    # Save metadata for future reference
    metadata = {
        "url": args.url,
        "date": datetime.now().isoformat(),
        "method": method_used,
        "tokens": token_estimate,
        "lines": len(lines),
        "output_file": output_file
    }
    
    metadata_file = metadata_dir / f"web_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
    safe_write_file(metadata_file, json.dumps(metadata, indent=2))
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 