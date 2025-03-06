import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

// ES module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resultsDir = join(__dirname, '../../test-results');

// Read the test results
function generateTestSummary() {
  console.log('Generating test summary report...');
  
  // Check if results directory exists
  if (!fs.existsSync(resultsDir)) {
    console.error('No test results directory found');
    return;
  }
  
  // Get all JSON files in the results directory
  const resultFiles = fs.readdirSync(resultsDir)
    .filter(file => file.endsWith('.json') && !file.startsWith('.'));
  
  if (resultFiles.length === 0) {
    console.log('No test result files found');
    return;
  }
  
  // Read and parse each file
  const results = [];
  for (const file of resultFiles) {
    try {
      const content = fs.readFileSync(join(resultsDir, file), 'utf8');
      const data = JSON.parse(content);
      results.push({
        fileName: file,
        data
      });
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }
  
  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: results.filter(r => r.data.success).length,
    failed: results.filter(r => !r.data.success).length,
    details: results.map(r => ({
      file: r.fileName,
      success: r.data.success,
      tests: r.data.tests || [],
      error: r.data.error || null
    }))
  };
  
  // Write summary to file
  const summaryPath = join(resultsDir, 'test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  // Print summary to console
  console.log('\n📊 Test Summary');
  console.log('==============================================');
  console.log(`Total test files: ${summary.totalTests}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`\nDetails saved to: ${summaryPath}`);
  
  // Also generate a markdown report
  const mdContent = generateMarkdownReport(summary);
  const mdPath = join(resultsDir, 'test-summary.md');
  fs.writeFileSync(mdPath, mdContent);
  console.log(`Markdown report saved to: ${mdPath}`);
}

function generateMarkdownReport(summary) {
  // Generate a markdown report
  let md = `# SolnAI Browser Extension Test Summary\n\n`;
  md += `Report generated on: ${new Date().toLocaleString()}\n\n`;
  
  md += `## Summary\n\n`;
  md += `- **Total Tests**: ${summary.totalTests}\n`;
  md += `- **Passed**: ${summary.passed}\n`;
  md += `- **Failed**: ${summary.failed}\n`;
  
  md += `\n## Details\n\n`;
  
  for (const detail of summary.details) {
    md += `### ${detail.file}\n\n`;
    md += `- **Status**: ${detail.success ? '✅ Passed' : '❌ Failed'}\n`;
    
    if (detail.tests && detail.tests.length > 0) {
      md += `- **Tests**:\n`;
      for (const test of detail.tests) {
        md += `  - ${test}\n`;
      }
    }
    
    if (detail.error) {
      md += `- **Error**: ${detail.error}\n`;
    }
    
    md += `\n`;
  }
  
  return md;
}

// Run the summary generator
generateTestSummary();