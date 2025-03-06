import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Background Script Tests', () => {
  test('Background script file exists', async () => {
    const bgScriptPath = join(__dirname, '../../dist/background.js');
    expect(fs.existsSync(bgScriptPath)).toBeTruthy();
    
    // Basic check of the background script content
    const scriptContent = fs.readFileSync(bgScriptPath, 'utf8');
    expect(scriptContent).toContain('chrome.runtime');
  });
  
  test('Manifest file is properly configured', async () => {
    const manifestPath = join(__dirname, '../../dist/manifest.json');
    expect(fs.existsSync(manifestPath)).toBeTruthy();
    
    // Parse the manifest and check required fields
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check basic manifest properties
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toBeTruthy();
    
    // Check for background script configuration
    expect(manifest.background).toBeDefined();
    
    // Check for content scripts
    expect(manifest.content_scripts).toBeDefined();
    if (manifest.content_scripts) {
      expect(Array.isArray(manifest.content_scripts)).toBeTruthy();
    }
    
    // Check for permissions
    expect(manifest.permissions).toBeDefined();
    if (manifest.permissions) {
      expect(Array.isArray(manifest.permissions)).toBeTruthy();
    }
    
    // Check for icons
    expect(manifest.icons).toBeDefined();
  });
});