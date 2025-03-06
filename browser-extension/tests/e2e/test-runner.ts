import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resultsDir = join(__dirname, '../../test-results');

// Ensure test results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Test suite configuration
interface TestSuite {
  name: string;
  command: string;
  description: string;
}

const testSuites: TestSuite[] = [
  {
    name: "simple",
    command: "npm run test:simple",
    description: "Basic file structure and build verification tests"
  },
  {
    name: "code-content",
    command: "npm run test:code",
    description: "Tests for code extraction and syntax highlighting features"
  },
  {
    name: "api-integration",
    command: "npm run test:api",
    description: "Tests for API integration with SolnAI server"
  }
];

// Test runner function
async function runTests() {
  console.log('🚀 Starting SolnAI Browser Extension Test Suite');
  console.log('==============================================');
  
  const results = {
    timestamp: new Date().toISOString(),
    suites: [] as any[],
    summary: {
      total: testSuites.length,
      passed: 0,
      failed: 0
    }
  };
  
  for (const suite of testSuites) {
    console.log(`\n📋 Running test suite: ${suite.name}`);
    console.log(`Description: ${suite.description}`);
    
    const suiteResult = {
      name: suite.name,
      command: suite.command,
      passed: false,
      output: '',
      error: null
    };
    
    try {
      // Run the test command
      console.log(`Executing: ${suite.command}`);
      const output = execSync(suite.command, { cwd: process.cwd(), encoding: 'utf8' });
      
      console.log('✅ Test suite passed!');
      suiteResult.passed = true;
      suiteResult.output = output;
      results.summary.passed++;
      
    } catch (error: any) {
      console.error(`❌ Test suite failed: ${error.message}`);
      suiteResult.passed = false;
      suiteResult.error = error.message;
      suiteResult.output = error.stdout || '';
      results.summary.failed++;
    }
    
    results.suites.push(suiteResult);
  }
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('==============================================');
  console.log(`Total suites: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  
  // Write results to file
  const resultsPath = join(resultsDir, 'test-run-summary.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${resultsPath}`);
  
  // Return exit code based on test results
  if (results.summary.failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});