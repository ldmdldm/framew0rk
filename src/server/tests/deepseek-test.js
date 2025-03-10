// DeepSeek API Test Script
// This script tests the DeepSeek API functionality

import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Check for API key
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  console.error('DEEPSEEK_API_KEY environment variable is not set');
  process.exit(1);
}

/**
 * Function to create a completion using the DeepSeek API
 * @param {string} prompt - The prompt to send to the API
 * @param {object} options - Additional options for the API call
 * @returns {Promise<object>} - The API response
 */
async function createDeepseekCompletion(prompt, options = {}) {
  try {
    console.log('Sending request to DeepSeek API...');
    
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: options.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: options.systemPrompt || 'You are a helpful financial assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error.message);
    if (error.response) {
      console.error('API Error Details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
}

/**
 * Function to analyze a protocol query using DeepSeek
 * @param {string} protocolId - The ID of the protocol
 * @param {string} query - The query to analyze
 * @param {object} context - Additional context for the query
 * @returns {Promise<object>} - The analysis result
 */
async function analyzeQuery(protocolId, query, context) {
  const prompt = `
Protocol ID: ${protocolId}

User Query: ${query}

Context: ${JSON.stringify(context, null, 2)}

Please analyze this query regarding the DeFi protocol and provide insights on:
1. The specific aspects of the protocol the user is inquiring about
2. Relevant tokenomics and financial mechanisms involved
3. Risk assessment based on the query
4. Recommended strategies or actions for the user
`;

  return createDeepseekCompletion(prompt, {
    systemPrompt: 'You are an expert in decentralized finance protocols. Analyze the following query and provide detailed insights.',
    temperature: 0.3,
    maxTokens: 1500
  });
}

/**
 * Function to test the DeepSeek API with basic prompts
 */
async function runBasicTest() {
  try {
    console.log('Running basic DeepSeek API test...');
    
    const result = await createDeepseekCompletion(
      'Explain the difference between AMMs and order book DEXes in simple terms.',
      { temperature: 0.5 }
    );
    
    console.log('API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.choices && result.choices.length > 0) {
      console.log('\nAI Response:');
      console.log(result.choices[0].message.content);
    }
    
    console.log('\nBasic DeepSeek API test completed successfully! ✅');
  } catch (error) {
    console.error('Basic DeepSeek API test failed ❌');
  }
}

/**
 * Function to test the query analysis functionality
 */
async function runQueryAnalysisTest() {
  try {
    console.log('\nRunning protocol query analysis test...');
    
    const protocolId = 'uniswap-v3';
    const query = 'What is the best strategy for providing liquidity to ETH/USDC pool with minimum impermanent loss?';
    const context = {
      userPreferences: {
        riskTolerance: 'medium',
        investmentTimeframe: 'long-term'
      },
      marketConditions: {
        volatility: 'high',
        trend: 'bullish'
      }
    };
    
    const analysisResult = await analyzeQuery(protocolId, query, context);
    
    console.log('Query Analysis Result:');
    console.log(JSON.stringify(analysisResult, null, 2));
    
    if (analysisResult.choices && analysisResult.choices.length > 0) {
      console.log('\nAnalysis Response:');
      console.log(analysisResult.choices[0].message.content);
    }
    
    console.log('\nQuery analysis test completed successfully! ✅');
  } catch (error) {
    console.error('Query analysis test failed ❌');
  }
}

/**
 * Main function to run all tests
 */
async function main() {
  console.log('=== DeepSeek API Integration Tests ===\n');
  console.log(`Using API Key: ${DEEPSEEK_API_KEY.substring(0, 8)}...${DEEPSEEK_API_KEY.substring(DEEPSEEK_API_KEY.length - 4)}`);
  
  // Run the basic test
  await runBasicTest();
  
  // Run the query analysis test
  await runQueryAnalysisTest();
  
  console.log('\n=== All tests completed ===');
  
  console.log('\nTo run this test:');
  console.log('1. Make sure your .env file contains a valid DEEPSEEK_API_KEY');
  console.log('2. Run the test with: node src/server/tests/deepseek-test.js');
}

// Run the tests
main().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
// Add some instructions at the end of the main function
console.log('\nTo run this test:');
console.log('1. Make sure your .env file contains a valid DEEPSEEK_API_KEY');
console.log('2. Run the test with: node src/server/tests/deepseek-test.js');
