/**
 * Test script for AutoGen Studio integration
 * 
 * This script tests the connection to AutoGen Studio via the proxy.
 * Run it with Node.js to verify that the integration is working correctly.
 */

import fetch from 'node-fetch';

// Configuration
const PROXY_URL = process.env.PROXY_URL || 'http://localhost:3001';
const AUTOGEN_URL = process.env.AUTOGEN_URL || 'http://localhost:8081';

// Test function
async function testIntegration() {
  console.log('Testing AutoGen Studio integration...');
  console.log('----------------------------------------');
  
  // Test direct connection to AutoGen Studio
  try {
    console.log('1. Testing direct connection to AutoGen Studio...');
    const autogenResponse = await fetch(`${AUTOGEN_URL}/api/health`);
    if (autogenResponse.ok) {
      console.log('✅ Direct connection to AutoGen Studio successful!');
    } else {
      console.log(`❌ Failed to connect directly to AutoGen Studio: ${autogenResponse.status} ${autogenResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error connecting directly to AutoGen Studio: ${error.message}`);
  }

  // Test connection through proxy
  try {
    console.log('\n2. Testing connection through proxy...');
    const proxyResponse = await fetch(`${PROXY_URL}/api/autogenstudio/health`);
    if (proxyResponse.ok) {
      console.log('✅ Connection through proxy successful!');
    } else {
      console.log(`❌ Failed to connect through proxy: ${proxyResponse.status} ${proxyResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error connecting through proxy: ${error.message}`);
  }

  // Test proxy health endpoint
  try {
    console.log('\n3. Testing proxy health endpoint...');
    const proxyHealthResponse = await fetch(`${PROXY_URL}/health`);
    if (proxyHealthResponse.ok) {
      console.log('✅ Proxy health check successful!');
      const data = await proxyHealthResponse.json();
      console.log(`   Response: ${JSON.stringify(data)}`);
    } else {
      console.log(`❌ Proxy health check failed: ${proxyHealthResponse.status} ${proxyHealthResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error checking proxy health: ${error.message}`);
  }

  // Test listing agents through proxy
  try {
    console.log('\n4. Testing agent listing through proxy...');
    const agentsResponse = await fetch(`${PROXY_URL}/api/autogenstudio/agents`);
    if (agentsResponse.ok) {
      const agents = await agentsResponse.json();
      console.log(`✅ Successfully retrieved ${agents.length} agents through proxy!`);
      if (agents.length > 0) {
        console.log(`   First agent: ${agents[0].name}`);
      }
    } else {
      console.log(`❌ Failed to list agents through proxy: ${agentsResponse.status} ${agentsResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error listing agents through proxy: ${error.message}`);
  }

  console.log('\n----------------------------------------');
  console.log('Integration test complete!');
}

// Run the test
testIntegration().catch(error => {
  console.error('Unhandled error during testing:', error);
  process.exit(1);
});