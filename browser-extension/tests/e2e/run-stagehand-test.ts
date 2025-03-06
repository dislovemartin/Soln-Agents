import { Stagehand } from '@browserbasehq/stagehand';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// ES module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the extension build
const extensionPath = join(__dirname, '../../dist');
const resultsDir = join(__dirname, '../../test-results');

// Ensure test results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Main test function
async function runTests() {
  console.log("Starting Stagehand-based extension tests...");
  console.log(`Extension path: ${extensionPath}`);
  
  // Create Stagehand instance
  const stagehand = new Stagehand({
    headless: process.env.HEADLESS === 'true',
    extensionPaths: [extensionPath],
    useCache: false,
    showBrowser: true,
    defaultTimeout: 60000,
    browserOptions: {
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    },
  });
  
  try {
    // Initialize Stagehand
    await stagehand.init();
    console.log("✅ Stagehand initialized successfully");
    
    // Test 1: Basic website navigation
    await stagehand.page.goto('https://example.com');
    console.log("✅ Navigated to example.com");
    
    await stagehand.page.screenshot({ path: join(resultsDir, 'stagehand-test-1.png') });
    console.log("✅ Screenshot saved");
    
    // Test 2: Text selection and context menu (simulate)
    await stagehand.page.evaluate(() => {
      // Find a paragraph and select its text
      const paragraph = document.querySelector('p');
      if (paragraph) {
        const range = document.createRange();
        range.selectNodeContents(paragraph);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // Dispatch a custom event that our extension might listen for
        document.dispatchEvent(new CustomEvent('soln-ai-text-selected', {
          detail: { text: paragraph.textContent }
        }));
      }
    });
    
    console.log("✅ Text selection test completed");
    await stagehand.page.screenshot({ path: join(resultsDir, 'stagehand-test-2.png') });
    
    // Test 3: Open a more complex page
    await stagehand.page.goto('https://developer.mozilla.org/en-US/');
    console.log("✅ Navigated to MDN");
    await stagehand.page.screenshot({ path: join(resultsDir, 'stagehand-test-3.png') });
    
    // Test 4: Test with content that contains code blocks
    await stagehand.page.goto('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction');
    console.log("✅ Navigated to JavaScript introduction page");
    
    // Find and select a code block
    await stagehand.page.evaluate(() => {
      const codeBlock = document.querySelector('pre');
      if (codeBlock) {
        const range = document.createRange();
        range.selectNodeContents(codeBlock);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // Dispatch our custom event
        document.dispatchEvent(new CustomEvent('soln-ai-text-selected', {
          detail: { text: codeBlock.textContent, isCode: true }
        }));
      }
    });
    
    console.log("✅ Code selection test completed");
    await stagehand.page.screenshot({ path: join(resultsDir, 'stagehand-test-4.png') });
    
    // Final report
    console.log("\n🎉 All Stagehand tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    // Close browser
    await stagehand.close();
    console.log("Stagehand tests completed");
  }
}

// Run tests
runTests();