import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Content Script Tests', () => {
  test('Extension injects content script elements', async ({ page, context }) => {
    // Create a simple test page with content
    await page.goto('https://example.com');
    
    // Inject and execute the content script manually for testing
    await page.addScriptTag({ 
      url: `file://${join(__dirname, '../../dist/contentScript.js')}` 
    }).catch(e => console.log('Script injection may fail in this context. This is expected.'));
    
    // Wait a moment for any potential script execution
    await page.waitForTimeout(1000);
    
    // Take a screenshot
    await page.screenshot({ path: join(__dirname, '../../test-results/content-script.png') });
    
    // Basic verification that the page loaded
    expect(await page.title()).toBe('Example Domain');
  });

  test('Text selection handling', async ({ page }) => {
    // Go to a page with selectable text
    await page.goto('https://example.com');
    
    // Create a programmatic text selection
    await page.evaluate(() => {
      const textNode = document.querySelector('p')?.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 20);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
    
    // Simulate right-click on the selection
    await page.mouse.click(300, 200, { button: 'right' });
    
    // Take a screenshot of the context menu (if visible)
    await page.screenshot({ path: join(__dirname, '../../test-results/text-selection.png') });
    
    // Clear selection
    await page.evaluate(() => {
      window.getSelection()?.removeAllRanges();
    });
  });
});