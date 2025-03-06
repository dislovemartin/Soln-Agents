import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple file-based tests to verify the extension build
async function runSimpleTests() {
  console.log('Starting simple file-based tests...');
  
  const distDir = join(__dirname, '../../dist');
  const resultsDir = join(__dirname, '../../test-results');
  
  // Ensure test results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  try {
    // Test 1: Check if the build directory exists
    if (!fs.existsSync(distDir)) {
      throw new Error(`Build directory not found: ${distDir}`);
    }
    console.log('✅ Build directory exists');
    
    // Test 2: Check if manifest.json exists and is valid
    const manifestPath = join(distDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`manifest.json not found: ${manifestPath}`);
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.name || !manifest.version || !manifest.manifest_version) {
      throw new Error('manifest.json is missing required fields');
    }
    console.log('✅ manifest.json exists and is valid');
    
    // Test 3: Check if background script exists
    const backgroundScriptPath = join(distDir, 'background.js');
    if (!fs.existsSync(backgroundScriptPath)) {
      throw new Error(`Background script not found: ${backgroundScriptPath}`);
    }
    console.log('✅ background.js exists');
    
    // Test 4: Check if content script exists
    const contentScriptPath = join(distDir, 'contentScript.js');
    if (!fs.existsSync(contentScriptPath)) {
      throw new Error(`Content script not found: ${contentScriptPath}`);
    }
    console.log('✅ contentScript.js exists');
    
    // Test 5: Check if HTML popup exists
    const htmlPath = join(distDir, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML popup not found: ${htmlPath}`);
    }
    console.log('✅ index.html exists');
    
    // Test 6: Check if icons exist
    const iconSizes = [16, 32, 48, 128];
    for (const size of iconSizes) {
      const iconPath = join(distDir, `icon${size}.png`);
      if (!fs.existsSync(iconPath)) {
        throw new Error(`Icon not found: ${iconPath}`);
      }
    }
    console.log('✅ Icons exist');
    
    // Write test results
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: [
        'Build directory exists',
        'manifest.json exists and is valid',
        'background.js exists',
        'contentScript.js exists',
        'index.html exists',
        'Icons exist',
      ]
    };
    
    fs.writeFileSync(
      join(resultsDir, 'simple-test-results.json'), 
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n🎉 All simple file-based tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Write failure results
    const failureResults = {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    
    fs.writeFileSync(
      join(resultsDir, 'simple-test-results.json'), 
      JSON.stringify(failureResults, null, 2)
    );
    
    process.exit(1);
  }
}

// Run the tests
runSimpleTests();