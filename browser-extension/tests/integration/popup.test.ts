import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Extension Popup Tests', () => {
  test('Popup loads properly', async ({ page }) => {
    // Load the popup page directly
    await page.goto(`file://${join(__dirname, '../../dist/index.html')}`);
    
    // Wait for the popup content to load
    await page.waitForTimeout(1000);
    
    // Take a screenshot for verification
    await page.screenshot({ path: join(__dirname, '../../test-results/popup-loaded.png') });
    
    // Verify the popup has key UI elements
    const hasPageTitle = await page.textContent('h1');
    expect(hasPageTitle).not.toBeNull();
    
    // Check for connection form or workspace selector
    const hasForm = await page.$('form');
    expect(hasForm).not.toBeNull();
  });

  test('Popup form validation works', async ({ page }) => {
    // Load the popup page directly
    await page.goto(`file://${join(__dirname, '../../dist/index.html')}`);
    
    // Try to submit form with empty fields
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      
      // Check for validation message
      const validationMessage = await page.$('.error-message, .validation-error');
      expect(validationMessage).not.toBeNull();
    }
    
    // Take a screenshot of validation errors
    await page.screenshot({ path: join(__dirname, '../../test-results/popup-validation.png') });
  });
});