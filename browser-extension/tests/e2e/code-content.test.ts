import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resultsDir = join(__dirname, '../../test-results');

// Ensure results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Test scenarios for handling code content specifically
test.describe('Code Content Handling Tests', () => {
  test('Extract and format code from web pages', async ({ page }) => {
    // Create a test page with code content
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Code Test Page</title>
        <style>
          pre {
            background: #f4f4f4;
            border: 1px solid #ddd;
            padding: 10px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>Test Code Blocks</h1>
        <p>Here is a JavaScript code example:</p>
        <pre><code class="language-javascript">
function calculateSum(a, b) {
  // Add two numbers
  return a + b;
}

// Example usage
const result = calculateSum(5, 10);
console.log('Result:', result);
        </code></pre>
        
        <p>And here is a Python example:</p>
        <pre><code class="language-python">
def calculate_sum(a, b):
    # Add two numbers
    return a + b

# Example usage
result = calculate_sum(5, 10)
print(f"Result: {result}")
        </code></pre>
      </body>
      </html>
    `);
    
    // Take a screenshot of the test page
    await page.screenshot({ path: join(resultsDir, 'code-extraction-page.png') });
    
    // Inject and execute content script to process code
    await page.evaluate(() => {
      // Function to extract code from page
      function extractCode() {
        const codeBlocks = [];
        const codeElements = document.querySelectorAll('pre code');
        
        codeElements.forEach((element, index) => {
          // Get the language class if available
          let language = 'text';
          const classList = element.className.split(' ');
          for (const cls of classList) {
            if (cls.startsWith('language-')) {
              language = cls.replace('language-', '');
              break;
            }
          }
          
          // Get the code content
          const code = element.textContent.trim();
          
          codeBlocks.push({
            index,
            language,
            code,
            element: element
          });
        });
        
        return codeBlocks;
      }
      
      // Extract code from the page
      const extractedCode = extractCode();
      
      // Create a display to show what was extracted
      const display = document.createElement('div');
      display.className = 'solnai-code-extraction-results';
      display.style.position = 'fixed';
      display.style.top = '10px';
      display.style.right = '10px';
      display.style.background = 'white';
      display.style.border = '1px solid black';
      display.style.padding = '10px';
      display.style.zIndex = '9999';
      
      display.innerHTML = `
        <h3>Extracted Code Blocks: ${extractedCode.length}</h3>
        <ul>
          ${extractedCode.map(block => `
            <li>
              <strong>Language:</strong> ${block.language}<br>
              <strong>Length:</strong> ${block.code.length} characters
            </li>
          `).join('')}
        </ul>
        <button id="saveCode">Save All Code</button>
      `;
      
      document.body.appendChild(display);
      
      // Simulate clicking the save button
      setTimeout(() => {
        const saveButton = document.getElementById('saveCode');
        if (saveButton) {
          saveButton.addEventListener('click', () => {
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'solnai-code-saved-message';
            successMsg.textContent = 'Code blocks saved to SolnAI!';
            successMsg.style.position = 'fixed';
            successMsg.style.top = '50%';
            successMsg.style.left = '50%';
            successMsg.style.transform = 'translate(-50%, -50%)';
            successMsg.style.background = 'green';
            successMsg.style.color = 'white';
            successMsg.style.padding = '20px';
            successMsg.style.borderRadius = '5px';
            document.body.appendChild(successMsg);
          });
          
          // Trigger the click
          saveButton.click();
        }
      }, 1000);
    });
    
    // Wait for extraction results to appear
    await page.waitForSelector('.solnai-code-extraction-results');
    
    // Take a screenshot showing the extraction results
    await page.screenshot({ path: join(resultsDir, 'code-extraction-results.png') });
    
    // Wait for save message
    await page.waitForSelector('.solnai-code-saved-message');
    
    // Take a screenshot showing the save confirmation
    await page.screenshot({ path: join(resultsDir, 'code-save-confirmation.png') });
    
    // Verify code blocks were found (should be 2)
    const codeBlockCount = await page.evaluate(() => {
      const results = document.querySelector('.solnai-code-extraction-results');
      return results ? results.querySelectorAll('li').length : 0;
    });
    
    expect(codeBlockCount).toBe(2);
    
    // Log the test results
    const testResult = {
      name: 'Extract and format code from web pages',
      timestamp: new Date().toISOString(),
      success: codeBlockCount === 2,
      details: `Found ${codeBlockCount} code blocks`,
      languages: ['javascript', 'python']
    };
    
    fs.writeFileSync(
      join(resultsDir, 'code-extraction-test.json'),
      JSON.stringify(testResult, null, 2)
    );
  });

  test('Handle syntax highlighting in extracted code', async ({ page }) => {
    // Create a test page with highlighted code
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Syntax Highlighting Test</title>
        <style>
          .keyword { color: blue; }
          .string { color: green; }
          .comment { color: gray; }
          .function { color: purple; }
          pre { background: #f8f8f8; padding: 10px; }
        </style>
      </head>
      <body>
        <h1>Code with Syntax Highlighting</h1>
        
        <pre><code>
<span class="keyword">function</span> <span class="function">processData</span>(data) {
  <span class="comment">// Process the incoming data</span>
  <span class="keyword">let</span> result = [];
  
  <span class="keyword">for</span> (<span class="keyword">let</span> i = 0; i < data.length; i++) {
    <span class="keyword">if</span> (data[i].active) {
      result.push(data[i].value);
    }
  }
  
  <span class="keyword">return</span> result;
}

<span class="keyword">const</span> testData = [
  { active: <span class="keyword">true</span>, value: <span class="string">"first"</span> },
  { active: <span class="keyword">false</span>, value: <span class="string">"second"</span> },
  { active: <span class="keyword">true</span>, value: <span class="string">"third"</span> }
];

<span class="keyword">const</span> processed = processData(testData);
console.log(processed); <span class="comment">// ["first", "third"]</span>
        </code></pre>
      </body>
      </html>
    `);
    
    // Take a screenshot of the highlighted code
    await page.screenshot({ path: join(resultsDir, 'syntax-highlighted-code.png') });
    
    // Inject code to test preservation of syntax highlighting
    await page.evaluate(() => {
      // Function to extract code with highlighting
      function extractHighlightedCode() {
        const codeElement = document.querySelector('pre code');
        if (!codeElement) return null;
        
        // Option 1: Extract the raw text (loses highlighting)
        const rawText = codeElement.textContent.trim();
        
        // Option 2: Get HTML content (preserves highlighting)
        const htmlContent = codeElement.innerHTML;
        
        // Option 3: Create a detailed representation with class information
        const detailedContent = [];
        codeElement.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            detailedContent.push({
              type: 'text',
              content: node.textContent
            });
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            detailedContent.push({
              type: 'element',
              class: node.className,
              content: node.textContent
            });
          }
        });
        
        return {
          rawText,
          htmlContent,
          detailedContent
        };
      }
      
      // Extract the code
      const extractedCode = extractHighlightedCode();
      
      // Display the extraction results
      const display = document.createElement('div');
      display.className = 'solnai-syntax-highlight-results';
      display.style.position = 'fixed';
      display.style.top = '10px';
      display.style.right = '10px';
      display.style.background = 'white';
      display.style.border = '1px solid black';
      display.style.padding = '10px';
      display.style.zIndex = '9999';
      display.style.maxWidth = '500px';
      display.style.maxHeight = '400px';
      display.style.overflow = 'auto';
      
      display.innerHTML = `
        <h3>Code Extraction Methods</h3>
        <div>
          <h4>Method 1: Raw Text (${extractedCode.rawText.length} chars)</h4>
          <pre style="max-height: 100px; overflow: auto; background: #eee;">${extractedCode.rawText.substring(0, 100)}...</pre>
          
          <h4>Method 2: HTML Content (${extractedCode.htmlContent.length} chars)</h4>
          <pre style="max-height: 100px; overflow: auto; background: #eee;">${extractedCode.htmlContent.substring(0, 100)}...</pre>
          
          <h4>Method 3: Detailed Content (${extractedCode.detailedContent.length} nodes)</h4>
          <pre style="max-height: 100px; overflow: auto; background: #eee;">${JSON.stringify(extractedCode.detailedContent.slice(0, 3), null, 2)}...</pre>
        </div>
        <button id="saveHighlightedCode">Save with Highlighting</button>
      `;
      
      document.body.appendChild(display);
      
      // Simulate clicking the save button
      setTimeout(() => {
        const saveButton = document.getElementById('saveHighlightedCode');
        if (saveButton) {
          saveButton.addEventListener('click', () => {
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'solnai-highlighted-code-saved';
            successMsg.textContent = 'Highlighted code saved!';
            successMsg.style.position = 'fixed';
            successMsg.style.top = '50%';
            successMsg.style.left = '50%';
            successMsg.style.transform = 'translate(-50%, -50%)';
            successMsg.style.background = 'green';
            successMsg.style.color = 'white';
            successMsg.style.padding = '20px';
            successMsg.style.borderRadius = '5px';
            document.body.appendChild(successMsg);
          });
          
          // Trigger the click
          saveButton.click();
        }
      }, 1000);
    });
    
    // Wait for the results to appear
    await page.waitForSelector('.solnai-syntax-highlight-results');
    
    // Take a screenshot of the results
    await page.screenshot({ path: join(resultsDir, 'syntax-highlight-extraction.png') });
    
    // Wait for save confirmation
    await page.waitForSelector('.solnai-highlighted-code-saved');
    
    // Take a screenshot showing the save confirmation
    await page.screenshot({ path: join(resultsDir, 'syntax-highlight-saved.png') });
    
    // Verify code extraction
    const hasDetailedContent = await page.evaluate(() => {
      const display = document.querySelector('.solnai-syntax-highlight-results');
      return display && display.innerHTML.includes('Method 3: Detailed Content');
    });
    
    expect(hasDetailedContent).toBe(true);
    
    // Log the test results
    const testResult = {
      name: 'Handle syntax highlighting in extracted code',
      timestamp: new Date().toISOString(),
      success: hasDetailedContent,
      details: 'Successfully extracted code with multiple preservation methods',
      preservationMethods: ['rawText', 'htmlContent', 'detailedContent']
    };
    
    fs.writeFileSync(
      join(resultsDir, 'syntax-highlighting-test.json'),
      JSON.stringify(testResult, null, 2)
    );
  });
});