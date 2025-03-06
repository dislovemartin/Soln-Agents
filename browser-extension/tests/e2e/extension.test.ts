import { test, expect } from '@playwright/test';
import { Stagehand } from '@browserbasehq/stagehand';
import path from 'path';
import fs from 'fs';

// Path to the extension build
const extensionPath = path.join(__dirname, '../../dist');

test.describe('SolnAI Browser Extension Tests', () => {
  let stagehand: Stagehand;

  test.beforeEach(async ({ }) => {
    // Create a new Stagehand instance for each test
    stagehand = new Stagehand({
      headless: false,
      extensionPaths: [extensionPath],
      useCache: false,
      showBrowser: true,
      defaultTimeout: 60000,
    });
    await stagehand.init();
  });

  test.afterEach(async () => {
    await stagehand.close();
  });

  test('Extension loads properly', async () => {
    // Navigate to a page to test the extension
    await stagehand.page.goto('https://example.com');
    
    // Check if the extension is loaded (can verify by looking for injected elements)
    const extensionElement = await stagehand.page.waitForSelector('#solnai-extension-container', { timeout: 5000 }).catch(() => null);
    expect(extensionElement).not.toBeNull();
  });

  test('Extension popup opens', async () => {
    // Navigate to any page
    await stagehand.page.goto('https://example.com');
    
    // Click on the extension icon (this is tricky and may need adjustments)
    // This approach uses the Chrome extensions menu
    await stagehand.page.click('button[aria-label="Extensions"]');
    await stagehand.page.click('text=SolnAI');
    
    // Now verify the popup appears and has expected content
    const popup = await stagehand.page.waitForSelector('.solnai-popup', { timeout: 5000 }).catch(() => null);
    expect(popup).not.toBeNull();
  });

  test('Content script injects properly', async () => {
    await stagehand.page.goto('https://example.com');
    
    // Check if the content script has injected its elements
    const injectedElement = await stagehand.page.evaluate(() => {
      return document.querySelector('[data-solnai-extension]') !== null;
    });
    
    expect(injectedElement).toBeTruthy();
  });
  
  test('Save content functionality works', async () => {
    // Go to a page with content
    await stagehand.page.goto('https://example.com');
    
    // Right-click on some content to bring up context menu
    await stagehand.page.click('body', { button: 'right' });
    
    // Click on the SolnAI save option in the context menu
    await stagehand.page.click('text=Save to SolnAI');
    
    // Check if the save dialog appears
    const saveDialog = await stagehand.page.waitForSelector('.solnai-save-dialog', { timeout: 5000 }).catch(() => null);
    expect(saveDialog).not.toBeNull();
    
    // Fill in the save form
    await stagehand.page.fill('.solnai-save-dialog input[name="workspace"]', 'Test Workspace');
    await stagehand.page.click('.solnai-save-dialog button[type="submit"]');
    
    // Verify success message
    const successMessage = await stagehand.page.waitForSelector('.solnai-success-message', { timeout: 5000 }).catch(() => null);
    expect(successMessage).not.toBeNull();
  });
});