// Standalone test script for DeepSeek API integration
import axios from 'axios';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-154c9602687f40c6924503b9f7ab5793';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Function to create a completion using the DeepSeek API
 * @param {string} prompt - The user's input prompt
 * @param {string} model - The model to use for generation
 * @returns {Promise<object>} - The API response
 */
async function createDeepseekCompletion(prompt, model = 'deepseek-chat') {
  try {
    console.log(`Sending request to DeepSeek API with prompt: "${prompt}"`);
    
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that specializes in DeFi strategies.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
    console.error('Error calling DeepSeek API:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

/**
 * Run a demo query to test DeepSeek integration
 */
async function runTest() {
  try {
    console.log('Starting DeepSeek API test...');
    
    // Test with a simple DeFi related query
    const prompt = 'Can you explain yield farming and its risks in 3 sentences?';
    
    console.log('Calling DeepSeek API...');
    const result = await createDeepseekCompletion(prompt);
    
    console.log('\n=== DeepSeek API Test Results ===');
    console.log('API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.choices && result.choices.length > 0) {
      console.log('\nGenerated Content:');
      console.log(result.choices[0].message.content);
    }
    
    console.log('\nTest completed successfully!');
    return result;
  } catch (error) {
    console.error('\nTest failed with error:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();

// Add documentation on how to use this test script
console.log(`
=====================================================
DeepSeek API Test Script
=====================================================

This script tests the integration with DeepSeek's AI API.

To run with a custom prompt:
  node test-deepseek.js "Your custom prompt here"

To customize the API key:
  - Add DEEPSEEK_API_KEY to your .env file, or
  - Edit this script directly

For more information, refer to DeepSeek API documentation:
https://platform.deepseek.com/docs
`);

