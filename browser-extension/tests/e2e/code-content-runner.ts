import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

// ES module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resultsDir = join(__dirname, '../../test-results');

// Ensure test results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

async function runCodeExtractionTests() {
  console.log('Starting Code Extraction Tests...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test 1: Extract code blocks from a page
    await testCodeExtraction(page);
    
    // Test 2: Handle syntax highlighting
    await testSyntaxHighlighting(page);
    
    console.log('\n🎉 All code extraction tests completed successfully!');
    
    // Write success results
    fs.writeFileSync(
      join(resultsDir, 'code-tests-summary.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        success: true,
        tests: [
          'Code block extraction',
          'Syntax highlighting preservation'
        ]
      }, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Code extraction test failed:', error);
    
    // Write failure results
    fs.writeFileSync(
      join(resultsDir, 'code-tests-summary.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      }, null, 2)
    );
    
    process.exit(1);
  } finally {
    await browser.close();
  }
}

async function testCodeExtraction(page) {
  console.log('Running test: Code block extraction');
  
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
  const codeBlocks = await page.evaluate(() => {
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
          code
        });
      });
      
      return codeBlocks;
    }
    
    // Extract code from the page
    return extractCode();
  });
  
  // Verify code blocks were found (should be 2)
  if (codeBlocks.length !== 2) {
    throw new Error(`Expected 2 code blocks, found ${codeBlocks.length}`);
  }
  
  // Verify languages were detected correctly
  if (codeBlocks[0].language !== 'javascript' || codeBlocks[1].language !== 'python') {
    throw new Error('Language detection failed');
  }
  
  console.log('✅ Found 2 code blocks with correct language detection');
  
  // Save extraction results
  fs.writeFileSync(
    join(resultsDir, 'code-extraction-results.json'),
    JSON.stringify(codeBlocks, null, 2)
  );
}

async function testSyntaxHighlighting(page) {
  console.log('Running test: Syntax highlighting preservation');
  
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
      </code></pre>
    </body>
    </html>
  `);
  
  // Take a screenshot of the highlighted code
  await page.screenshot({ path: join(resultsDir, 'syntax-highlighted-code.png') });
  
  // Extract code with highlighting information
  const extractionResult = await page.evaluate(() => {
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
        if (node.nodeType === 3) { // Text node
          detailedContent.push({
            type: 'text',
            content: node.textContent
          });
        } else if (node.nodeType === 1) { // Element node
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
    return extractHighlightedCode();
  });
  
  // Verify extraction worked
  if (!extractionResult || !extractionResult.htmlContent || !extractionResult.detailedContent) {
    throw new Error('Failed to extract highlighted code');
  }
  
  // Verify HTML content contains span elements
  if (!extractionResult.htmlContent.includes('<span class="keyword">')) {
    throw new Error('HTML content does not preserve highlighting spans');
  }
  
  // Verify detailed content has keyword elements
  const hasKeywordElements = extractionResult.detailedContent.some(item => 
    item.type === 'element' && item.class === 'keyword'
  );
  
  if (!hasKeywordElements) {
    throw new Error('Detailed content does not preserve class information');
  }
  
  console.log('✅ Successfully preserved syntax highlighting information');
  
  // Save extraction results
  fs.writeFileSync(
    join(resultsDir, 'syntax-highlighting-results.json'),
    JSON.stringify(extractionResult, null, 2)
  );
}

// Run the tests
runCodeExtractionTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});