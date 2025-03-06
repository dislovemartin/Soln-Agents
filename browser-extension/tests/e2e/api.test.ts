import { test, expect } from '@playwright/test';
import { Stagehand } from '@browserbasehq/stagehand';
import path from 'path';

// Mock API server for testing
const mockApiUrl = 'http://localhost:3000';

test.describe('SolnAI Extension API Integration Tests', () => {
  let stagehand: Stagehand;

  test.beforeEach(async ({ }) => {
    stagehand = new Stagehand({
      headless: false,
      extensionPaths: [path.join(__dirname, '../../dist')],
      useCache: false,
      showBrowser: true,
      defaultTimeout: 60000,
    });
    await stagehand.init();
    
    // Mock the API endpoints by intercepting network requests
    await stagehand.page.route(`${mockApiUrl}/**`, async (route) => {
      const url = route.request().url();
      
      if (url.includes('/api/workspaces')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Test Workspace', description: 'Test workspace for API testing' },
            { id: 2, name: 'Another Workspace', description: 'Another test workspace' }
          ])
        });
      } else if (url.includes('/api/documents/save')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Content saved successfully' })
        });
      } else {
        await route.continue();
      }
    });
  });

  test.afterEach(async () => {
    await stagehand.close();
  });

  test('Extension fetches workspaces from API', async () => {
    // Navigate to a page
    await stagehand.page.goto('https://example.com');
    
    // Open the extension popup
    await stagehand.page.evaluate(() => {
      // Simulate opening the popup by dispatching a custom event
      document.dispatchEvent(new CustomEvent('solnai-open-popup'));
    });
    
    // Wait for the popup to load and fetch workspaces
    const workspaceSelector = await stagehand.page.waitForSelector('.workspace-selector', { timeout: 5000 }).catch(() => null);
    expect(workspaceSelector).not.toBeNull();
    
    // Check if workspaces are loaded in the dropdown
    const workspaceOptions = await stagehand.page.$$eval('.workspace-option', options => options.length);
    expect(workspaceOptions).toBeGreaterThan(0);
  });

  test('Extension sends selected content to API', async () => {
    await stagehand.page.goto('https://example.com');
    
    // Mock user selecting text on the page
    await stagehand.page.evaluate(() => {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(document.body);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Simulate the extension's content capture
      document.dispatchEvent(new CustomEvent('solnai-capture-selection'));
    });
    
    // Check if the capture dialog appears
    const captureDialog = await stagehand.page.waitForSelector('.solnai-capture-dialog', { timeout: 5000 }).catch(() => null);
    expect(captureDialog).not.toBeNull();
    
    // Select a workspace and submit
    await stagehand.page.selectOption('.workspace-selector', '1');
    await stagehand.page.click('.submit-capture-button');
    
    // Verify success message appears
    const successMessage = await stagehand.page.waitForSelector('.success-message', { timeout: 5000 }).catch(() => null);
    expect(successMessage).not.toBeNull();
  });

  test('Extension handles API errors gracefully', async () => {
    // Override the previous route to simulate an error
    await stagehand.page.route(`${mockApiUrl}/api/documents/save`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await stagehand.page.goto('https://example.com');
    
    // Trigger content capture and submission
    await stagehand.page.evaluate(() => {
      // Simulate text selection
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(document.body);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Trigger capture
      document.dispatchEvent(new CustomEvent('solnai-capture-selection'));
    });
    
    // Select workspace and submit
    await stagehand.page.waitForSelector('.solnai-capture-dialog', { timeout: 5000 });
    await stagehand.page.selectOption('.workspace-selector', '1');
    await stagehand.page.click('.submit-capture-button');
    
    // Check for error message
    const errorMessage = await stagehand.page.waitForSelector('.error-message', { timeout: 5000 }).catch(() => null);
    expect(errorMessage).not.toBeNull();
  });
});