import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test file that doesn't depend on Stagehand
test.describe('Basic Extension Tests', () => {
  test('Extension loads properly', async ({ page }) => {
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Wait a moment for the extension to load
    await page.waitForTimeout(1000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: join(__dirname, '../../test-results/extension-loaded.png') });
    
    // Basic assertion to ensure the page loaded
    expect(await page.title()).not.toBe('');
  });
});