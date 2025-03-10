import { supabase } from './supabase';
import axios from 'axios';

/**
 * Interface for protocol context data provided for query analysis
 */
export interface ProtocolContext {
  // Market data
  // Market data
  marketConditions?: {
    currentPrice?: number;
    liquidity?: number;
    volatility?: number;
    [key: string]: number | string | boolean | undefined; // Allow for additional market metrics
  };
  userState?: {
    currentPositions?: Array<{
      asset: string;
      amount: number;
      [key: string]: number | string | boolean | undefined; // Allow for additional position details
    }>;
    preferences?: {
      riskTolerance?: 'low' | 'medium' | 'high';
      investmentHorizon?: 'short' | 'medium' | 'long';
      [key: string]: string | number | boolean | undefined; // Allow for additional preferences
    };
    [key: string]: object | string | number | boolean | undefined | Array<any>; // Allow for additional user state properties
  };
  // Protocol-specific metrics
  protocolMetrics?: {
    tvl?: number;
    apy?: number;
    fees?: number;
    [key: string]: number | string | boolean | undefined; // Allow for additional protocol metrics
  };
  // Custom context fields
  [key: string]: object | string | number | boolean | undefined | Array<any>; // Allow for any additional top-level context
};

/**
 * Interface for protocol training results
 */
export interface TrainingResult {
  success: boolean;
  protocolId: string;
  trainingDate: Date;
}

/**
 * Interface for AI query analysis response
 */
export interface QueryAnalysisResponse {
  analysis: string;
  suggestions: string[];
  risks: string[];
}

/**
 * Interface for token usage information returned by DeepSeek API
 */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Interface for DeepSeek API completion response
 */
export interface DeepSeekCompletion {
  response: string;
  tokenUsage: TokenUsage;
  model: string;
}

export class AIService {
  private deepseekApiKey: string | undefined;
  private deepseekApiUrl: string = 'https://api.deepseek.com/v1';

  constructor() {
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  }


  async trainProtocol(protocolId: string, docs: string[]): Promise<boolean> {
    try {
      // Get protocol data
      const { data: protocol } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', protocolId)
        .single();

      if (!protocol) {
        throw new Error('Protocol not found');
      }

      const systemContent = `You are being trained as an AI assistant for the DeFi protocol ${protocol.name}. 
      Review the following documentation to understand the protocol's features, mechanics, and best practices.
      
      Key areas to focus on:
      1. Protocol mechanics and features
      2. Risk factors and mitigation strategies
      3. Optimal usage strategies
      4. Common user questions and solutions
      5. Integration with other protocols
      6. Performance metrics and their interpretation`;

      const userContent = `Protocol documentation for training:\n\n${docs.join('\n\n')}`;

      if (!this.deepseekApiKey) {
        throw new Error('DeepSeek API key not configured');
      }
      
      const completion = await this.createDeepseekCompletion(
        systemContent,
        userContent,
        0.7
      );
      // Store training results
      await supabase
        .from('protocol_training')
        .insert({
          protocol_id: protocolId,
          training_data: docs,
          status: 'completed',
          completion: completion.response,
          provider: 'deepseek'
        });

      return true;
    } catch (error) {
      console.error('Protocol training error:', error);
      throw error;
    }
  }

  async analyzeQuery(protocolId: string, query: string, context: ProtocolContext = {}): Promise<string> {
    try {
      // Get protocol data and training
      const [protocolResult, trainingResult] = await Promise.all([
        supabase
          .from('protocols')
          .select('*')
          .eq('id', protocolId)
          .single(),
        supabase
          .from('protocol_training')
          .select('*')
          .eq('protocol_id', protocolId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      ]);

      const protocol = protocolResult.data;
      const training = trainingResult.data;

      if (!protocol) {
        throw new Error('Protocol not found');
      }

      const systemContent = `You are an AI assistant for ${protocol.name}. 
      You specialize in this protocol's features: ${protocol.config.features.join(', ')}.
      
      Protocol Context:
      ${JSON.stringify(protocol.config, null, 2)}
      
      Training Data:
      ${training ? JSON.stringify(training.completion, null, 2) : 'No training data available'}
      
      When analyzing queries:
      1. Focus on protocol-specific strategies
      2. Consider current market conditions
      3. Provide actionable recommendations
      4. Include risk assessments
      5. Reference protocol metrics when relevant
      
      Current Context:
      ${JSON.stringify(context, null, 2)}`;

      if (!this.deepseekApiKey) {
        throw new Error('DeepSeek API key not configured');
      }
      
      const completion = await this.createDeepseekCompletion(
        systemContent,
        query,
        0.7,
        1000
      );
      
      return completion.response;
    } catch (error) {
      console.error('Query analysis error:', error);
      throw error;
    }
  }

  private async createDeepseekCompletion(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7,
    maxTokens?: number
  ): Promise<DeepSeekCompletion> {
    if (!this.deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.deepseekApiUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: temperature,
          ...(maxTokens && { max_tokens: maxTokens })
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.deepseekApiKey}`
          }
        }
      );
      return {
        response: response.data.choices[0].message.content,
        tokenUsage: response.data.usage as TokenUsage,
        model: response.data.model
      };
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }
}

export const ai = new AIService();
