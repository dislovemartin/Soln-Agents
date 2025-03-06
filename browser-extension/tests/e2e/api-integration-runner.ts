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

// Mock API data
const mockApiData = {
  workspaces: [
    { id: 1, name: 'Research', description: 'General research workspace' },
    { id: 2, name: 'Development', description: 'Development notes and snippets' },
    { id: 3, name: 'Meeting Notes', description: 'Meeting summaries and action items' }
  ],
  savedContent: {
    success: true,
    message: 'Content saved successfully'
  }
};

async function runApiIntegrationTests() {
  console.log('Starting API Integration Tests...');
  
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    
    // Setup API route mocks
    await context.route('**/api/workspaces', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiData.workspaces)
      });
    });
    
    await context.route('**/api/save-content', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiData.savedContent)
      });
    });
    
    const page = await context.newPage();
    
    // Test 1: Fetch workspaces from API
    await testFetchWorkspaces(page);
    
    // Test 2: Save content to API
    await testSaveContent(page);
    
    console.log('\n🎉 All API integration tests completed successfully!');
    
    // Write success results
    fs.writeFileSync(
      join(resultsDir, 'api-tests-summary.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        success: true,
        tests: [
          'Fetch workspaces from API',
          'Save content to API'
        ]
      }, null, 2)
    );
    
  } catch (error) {
    console.error('❌ API integration test failed:', error);
    
    // Write failure results
    fs.writeFileSync(
      join(resultsDir, 'api-tests-summary.json'),
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

async function testFetchWorkspaces(page) {
  console.log('Running test: Fetch workspaces from API');
  
  // Navigate to a blank page
  await page.goto('about:blank');
  
  // Inject test script
  const workspaces = await page.evaluate(async () => {
    // Create a mock fetch function
    async function fetchWorkspaces() {
      try {
        const response = await fetch('/api/workspaces');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        return [];
      }
    }
    
    // Call the fetch function
    return await fetchWorkspaces();
  });
  
  // Verify workspaces were fetched
  if (!workspaces || workspaces.length !== 3) {
    throw new Error(`Expected 3 workspaces, got ${workspaces ? workspaces.length : 0}`);
  }
  
  // Verify workspace properties
  const hasRequiredProperties = workspaces.every(w => 
    typeof w.id === 'number' && 
    typeof w.name === 'string' && 
    typeof w.description === 'string'
  );
  
  if (!hasRequiredProperties) {
    throw new Error('Workspaces are missing required properties');
  }
  
  console.log('✅ Successfully fetched workspaces from API');
  
  // Save test results
  fs.writeFileSync(
    join(resultsDir, 'api-workspaces-result.json'),
    JSON.stringify(workspaces, null, 2)
  );
}

async function testSaveContent(page) {
  console.log('Running test: Save content to API');
  
  // Navigate to a test page
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Save Content Test</title>
    </head>
    <body>
      <h1>Test Content</h1>
      <p>This is some test content that will be saved to SolnAI.</p>
      <p>It includes multiple paragraphs to test content selection.</p>
    </body>
    </html>
  `);
  
  // Inject test script
  const saveResult = await page.evaluate(async () => {
    // Create a mock content save function
    async function saveContent(content, workspaceId) {
      try {
        const response = await fetch('/api/save-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            workspaceId
          })
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error saving content:', error);
        return { success: false, message: error.message };
      }
    }
    
    // Select some content
    const paragraph = document.querySelector('p');
    const content = paragraph ? paragraph.textContent : 'No content found';
    
    // Save the content
    return await saveContent(content, 1);
  });
  
  // Verify save was successful
  if (!saveResult || !saveResult.success) {
    throw new Error('Content save failed');
  }
  
  console.log('✅ Successfully saved content to API');
  
  // Save test results
  fs.writeFileSync(
    join(resultsDir, 'api-save-content-result.json'),
    JSON.stringify(saveResult, null, 2)
  );
}

// Run the tests
runApiIntegrationTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});