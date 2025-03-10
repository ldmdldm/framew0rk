// Test script for the AIService with DeepSeek integration
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Constants for testing
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// Sample DeFi protocols for testing
const TEST_PROTOCOLS = {
  'aave-v3': {
    name: 'Aave V3',
    description: 'Aave is a decentralized non-custodial liquidity protocol where users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn a passive income, while borrowers can borrow in an overcollateralized or undercollateralized way.',
    riskLevel: 'moderate',
    documentation: 'https://docs.aave.com/developers/v/2.0/',
    features: ['Supply', 'Borrow', 'Repay', 'Withdraw', 'Liquidate', 'Flash Loan']
  },
  'uniswap-v3': {
    name: 'Uniswap V3',
    description: 'Uniswap is a decentralized protocol for automated token exchange on Ethereum. V3 introduces concentrated liquidity, allowing LPs to provide liquidity within custom price ranges, increasing capital efficiency.',
    riskLevel: 'high',
    documentation: 'https://docs.uniswap.org/protocol/introduction',
    features: ['Swap', 'Add Liquidity', 'Remove Liquidity', 'Concentrated Liquidity Positions']
  },
  'compound-v3': {
    name: 'Compound V3',
    description: 'Compound is an algorithmic, autonomous interest rate protocol built for developers. V3 (Comet) introduces a single borrowable asset per deployment, with multiple collateral assets.',
    riskLevel: 'moderate',
    documentation: 'https://docs.compound.finance/v3/',
    features: ['Supply', 'Borrow', 'Repay', 'Withdraw']
  }
};

// Test queries representing realistic user questions
const TEST_QUERIES = [
  {
    protocol: 'aave-v3',
    query: 'What are the risks of using Aave for borrowing ETH using USDC as collateral?',
    context: { marketConditions: 'volatile', riskTolerance: 'moderate', collateralAsset: 'USDC', borrowAsset: 'ETH' }
  },
  {
    protocol: 'uniswap-v3',
    query: 'How should I set my price range for providing ETH-USDC liquidity in the current market?',
    context: { marketConditions: 'bullish', volatilityExpectation: 'high', pairToProvide: 'ETH-USDC', timeHorizon: 'medium-term' }
  },
  {
    protocol: 'compound-v3',
    query: 'What\'s the optimal collateralization ratio to avoid liquidation on Compound?',
    context: { marketConditions: 'bearish', riskTolerance: 'low', assetVolatility: 'high' }
  },
  {
    protocol: 'aave-v3',
    query: 'Compare the APY for supplying stablecoins on Aave versus Compound',
    context: { assets: ['USDC', 'DAI', 'USDT'], networkPreference: 'Ethereum mainnet', timeHorizon: 'long-term' }
  }
];

// Main test function
async function testAIService() {
  console.log('🚀 Starting comprehensive DeepSeek AI DeFi testing...\n');
  
  try {
    // Check if DEEPSEEK_API_KEY exists in environment
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not found in environment variables');
    }
    
    console.log('✅ DEEPSEEK_API_KEY found in environment variables');
    
    // Direct API test first to verify API key works
    console.log('\n📡 Testing direct API connection to DeepSeek...');
    const basicTestResponse = await testDeepseekDirectly(apiKey, 'What is DeFi?');
    console.log('✅ Basic connection test successful!');
    console.log('Response preview:', basicTestResponse.substring(0, 150) + '...\n');
    
    // Simulated protocol training
    console.log('🧠 Testing protocol training simulation...');
    for (const [protocolId, protocol] of Object.entries(TEST_PROTOCOLS)) {
      const trainingResponse = await simulateProtocolTraining(apiKey, protocolId, protocol);
      console.log(`✅ ${protocol.name} training simulation successful!`);
      console.log(`Training response preview: ${trainingResponse.substring(0, 100)}...\n`);
    }
    
    // Comprehensive query testing
    console.log('🔍 Testing DeFi protocol query analysis...');
    const queryResults = [];
    
    for (const testCase of TEST_QUERIES) {
      console.log(`\nExecuting test query: "${testCase.query}"`);
      console.log(`Protocol: ${TEST_PROTOCOLS[testCase.protocol].name}`);
      console.log(`Context: ${JSON.stringify(testCase.context)}`);
      
      try {
        const queryResponse = await analyzeProtocolQuery(
          apiKey,
          testCase.protocol,
          TEST_PROTOCOLS[testCase.protocol],
          testCase.query,
          testCase.context
        );
        
        queryResults.push({
          protocol: testCase.protocol,
          query: testCase.query,
          response: queryResponse,
          success: true
        });
        
        console.log('✅ Query analysis successful!');
        console.log('Response preview:', queryResponse.substring(0, 150) + '...\n');
        
        // Simulate strategy execution for the second test case (Uniswap price range query)
        if (testCase.protocol === 'uniswap-v3' && testCase.query.includes('price range')) {
          try {
            const executionResult = await simulateStrategyExecution(
              apiKey,
              testCase.protocol,
              TEST_PROTOCOLS[testCase.protocol],
              queryResponse
            );
            
            // Add execution result to query results
            queryResults[queryResults.length - 1].execution = executionResult;
            
            console.log('\n📋 Transaction Receipt Preview:');
            console.log(executionResult.receipt.substring(0, 200) + '...');
          } catch (execError) {
            console.error('❌ Strategy execution simulation failed:', execError.message);
          }
        }
      } catch (error) {
        queryResults.push({
          protocol: testCase.protocol,
          query: testCase.query,
          error: error.message,
          success: false
        });
        
        console.error('❌ Query analysis failed:', error.message);
      }
    }
    
    // Save test results to file for analysis
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    fs.writeFileSync(
      path.join(resultsDir, `deepseek-test-results-${timestamp}.json`),
      JSON.stringify({ protocols: TEST_PROTOCOLS, queryResults }, null, 2)
    );
    
    console.log(`\n📊 Test results saved to test-results/deepseek-test-results-${timestamp}.json`);
    
    // Test with compiled AIService (if available)
    console.log('\n---\n🧪 Attempting to test the compiled AIService implementation...');
    
    try {
      // Dynamic import to allow proper error handling
      const { AIService } = await import('./dist/server/lib/ai.js');
      
      if (!AIService) {
        throw new Error('AIService not found in compiled output. Please make sure to build the project first.');
      }
      
      // Create an instance of AIService
      const aiService = new AIService();
      
      // Test analyzeQuery method with multiple scenarios
      console.log('Running test with compiled AIService...');
      
      const testCase = TEST_QUERIES[0]; // Use the first test case
      const result = await aiService.analyzeQuery(
        testCase.protocol,
        testCase.query,
        testCase.context
      );
      
      console.log('✅ AIService implementation test successful!');
      console.log('Result preview:', typeof result === 'string' 
        ? result.substring(0, 150) + '...' 
        : JSON.stringify(result).substring(0, 150) + '...');
    } catch (error) {
      console.error('❌ Error when testing AIService implementation:', error.message);
      console.error('This may be because the TypeScript files have not been compiled to JavaScript.');
      console.error('Try running: npm run build');
    }
    
    console.log('\n🎉 All DeepSeek API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('API response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Function to test DeepSeek API directly with a simple query
async function testDeepseekDirectly(apiKey, query) {
  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: 'You are a DeFi strategy assistant.' },
        { role: 'user', content: query }
      ],
      max_tokens: 500
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

// Function to simulate training a protocol
async function simulateProtocolTraining(apiKey, protocolId, protocolData) {
  // In a real implementation, this would involve feeding the model with protocol documentation
  // and storing embeddings or other representations. Here we're just simulating that process.
  
  const systemPrompt = 'You are a DeFi protocol expert. Your task is to learn about a protocol and be able to answer questions about it accurately.';
  
  const trainingContent = `
Protocol Name: ${protocolData.name}
Protocol ID: ${protocolId}
Description: ${protocolData.description}
Risk Level: ${protocolData.riskLevel}
Documentation: ${protocolData.documentation}
Key Features: ${protocolData.features.join(', ')}

Please analyze this protocol and provide a summary of its key characteristics, use cases, and potential risks.
`;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: trainingContent }
      ],
      max_tokens: 1000
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

// Function to analyze a protocol query (simulating AIService.analyzeQuery)
async function analyzeProtocolQuery(apiKey, protocolId, protocolData, query, context) {
  const systemPrompt = `You are a DeFi strategy assistant specialized in the ${protocolData.name} protocol.
  Your job is to provide accurate, helpful, and risk-aware advice about DeFi strategies.
  
  Protocol details:
  - Name: ${protocolData.name}
  - Description: ${protocolData.description}
  - Risk Level: ${protocolData.riskLevel}
  - Features: ${protocolData.features.join(', ')}
  - Documentation: ${protocolData.documentation}
  
  Please provide thoughtful analysis based on the user's query and context.
  Include risk considerations, advantages, disadvantages, and alternative approaches when relevant.
  Be specific with your recommendations and explain your reasoning.`;

  const userPrompt = `Query: ${query}

Context information:
${JSON.stringify(context, null, 2)}

Please provide a detailed response addressing this specific question about ${protocolData.name}.`;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.2
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

// Function to simulate executing a strategy from AI recommendation
async function simulateStrategyExecution(apiKey, protocolId, protocolData, aiRecommendation) {
  console.log('\n🔄 Simulating strategy execution based on AI recommendation...');
  
  // Parse the strategy from AI recommendation
  const strategyRegex = /(?:recommended strategy|suggested strategy|proposed strategy|strategy recommendation|I recommend|You should)(?::|is to)?\s+(.+?)(?:\.|$)/is;
  const match = aiRecommendation.match(strategyRegex);
  
  if (!match) {
    throw new Error('Could not parse a clear strategy from the AI recommendation');
  }
  
  const parsedStrategy = match[1].trim();
  console.log(`📝 Parsed strategy: "${parsedStrategy}"`);
  
  // Simulate executing the strategy (mock transaction)
  // In a real implementation, this would connect to a blockchain or exchange API
  const simulationData = {
    protocol: protocolId,
    protocolName: protocolData.name,
    strategy: parsedStrategy,
    timestamp: new Date().toISOString(),
    txHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    gasUsed: Math.floor(Math.random() * 2000000) + 100000,
    status: 'SUCCESS',
    blockNumber: Math.floor(Math.random() * 10000) + 15000000
  };
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate a detailed response with transaction details
  const systemPrompt = `You are a DeFi transaction simulator specialized in the ${protocolData.name} protocol.
  Your job is to generate a detailed and realistic transaction summary for a simulated strategy execution.
  
  Protocol details:
  - Name: ${protocolData.name}
  - Features: ${protocolData.features.join(', ')}
  
  Transaction data:
  - Strategy: ${parsedStrategy}
  - Transaction hash: ${simulationData.txHash}
  - Gas used: ${simulationData.gasUsed}
  - Block number: ${simulationData.blockNumber}
  - Timestamp: ${simulationData.timestamp}
  
  Generate a detailed transaction receipt summary that includes:
  1. The steps taken to execute the strategy
  2. The outcome (position sizes, tokens swapped, liquidity provided, etc.)
  3. Relevant financial metrics (fees, slippage, etc.)
  4. Next steps or monitoring recommendations`;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a transaction receipt for executing this strategy: "${parsedStrategy}" on ${protocolData.name}` }
      ],
      max_tokens: 1000,
      temperature: 0.3
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
  
  const executionResult = {
    ...simulationData,
    receipt: response.data.choices[0].message.content
  };
  
  console.log('✅ Strategy execution simulation successful!');
  
  return executionResult;
}

// Execute the test
testAIService().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

