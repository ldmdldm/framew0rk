import { Router } from 'express';
import { z } from 'zod';
import { graph } from '../lib/graph';
import { validateRequest } from '../middleware/validation';
import { ai } from '../lib/ai';

// Define interface for protocol metrics
interface ProtocolMetrics {
  tvl?: number;
  volume24h?: number;
  fees24h?: number;
  userCount?: number;
  tokenPrice?: number;
  [key: string]: any; // Allow for additional protocol-specific metrics
}

const router = Router();

// Validation schemas
const messageSchema = z.object({
  content: z.string().min(1).max(1000),
  context: z.object({
    protocol: z.string(),
    chain: z.string().optional(),
    features: z.array(z.string()).optional(),
  }),
  provider: z.literal('deepseek'),
});

const protocolTrainingSchema = z.object({
  documents: z.array(z.string()).min(1),
  provider: z.literal('deepseek'),
});

// Type definitions for request bodies
type MessageRequestBody = z.infer<typeof messageSchema>;
type ProtocolTrainingRequestBody = z.infer<typeof protocolTrainingSchema>;

// Analyze user message
router.post('/analyze', validateRequest<MessageRequestBody>(messageSchema), async (req, res) => {
  try {
    const { content, context } = req.body;
    const provider = 'deepseek';

    // Get protocol metrics from The Graph
    const protocolMetrics = await graph.getProtocolMetrics(context.protocol);

    // Create enhanced context with protocol metrics
    const enhancedContext = {
      ...context,
      protocolMetrics
    };

    // Analyze query using DeepSeek AI service
    const aiResponse = await ai.analyzeQuery(
      context.protocol,
      content,
      enhancedContext
    );

    // Extract strategy if one is suggested
    const strategy = extractStrategy(aiResponse, context.protocol);

    res.json({
      success: true,
      content: aiResponse,
      context,
      strategy,
      provider,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze message',
    });
  }
});

// Execute strategy
router.post('/strategies/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;

    // Get protocol metrics for validation
    const protocolMetrics = await graph.getProtocolMetrics('uniswap'); // Replace with actual protocol

    // Validate strategy is still viable
    const isViable = await validateStrategy(id, protocolMetrics);
    if (!isViable) {
      throw new Error('Strategy is no longer viable due to market conditions');
    }

    // Execute the strategy
    const result = await executeStrategy(id, protocolMetrics);

    res.json({
      success: true,
      message: 'Strategy executed successfully',
      details: result,
    });
  } catch (error) {
    console.error('Strategy execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute strategy',
    });
  }
});

// Helper functions
function extractStrategy(aiResponse: string, protocol: string) {
  // Simple strategy extraction - can be made more sophisticated
  if (aiResponse.toLowerCase().includes('recommend') || aiResponse.toLowerCase().includes('suggest')) {
    return {
      id: generateId(),
      name: `${protocol} Strategy`,
      description: aiResponse.split('.')[0] + '.',
      protocol,
      details: {
        type: 'custom',
        amount: '0',
        token: 'ETH',
      },
    };
  }
  return null;
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function validateStrategy(strategyId: string, currentMetrics: ProtocolMetrics) {
  // Implement strategy validation logic
  return true;
}

async function executeStrategy(strategyId: string, metrics: ProtocolMetrics) {
  // Implement strategy execution logic
  return {
    txHash: '0x...',
    timestamp: new Date().toISOString(),
  };
}

// Train protocol with documents
router.post('/protocols/:id/train', validateRequest<ProtocolTrainingRequestBody>(protocolTrainingSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { documents } = req.body;
    const provider = 'deepseek';

    // Train the protocol using DeepSeek AI service
    await ai.trainProtocol(id, documents);
    res.json({
      success: true,
      message: `Protocol ${id} trained successfully using ${provider}`,
      provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Protocol training error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to train protocol',
      provider: 'deepseek'
    });
  }
});

export { router as apiRouter };
