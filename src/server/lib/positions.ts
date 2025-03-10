import { supabase } from './supabase';
import { blockchain } from './blockchain';
import { metrics, UserMetricsResponse, PositionMetric } from './metrics';

// Define types for position data
interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
}

interface PositionConfig {
  // Define specific config properties that positions might use
  slippage?: number;
  deadline?: number;
  targetPrice?: string;
  stopLoss?: string;
  leverage?: number;
  autoCompound?: boolean;
  [key: string]: string | number | boolean | undefined;
}

interface Position {
  id: string;
  protocol_id: string;
  user_id: string;
  type: string;
  amount: string;
  token_address: string;
  token_info: TokenInfo;
  config: PositionConfig;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

interface PositionMetrics {
  value: string;
  pnl: string;
  apy: number;
  // Allow for additional properties that are strings, numbers, booleans or undefined
  [key: string]: string | number | boolean | undefined;
}

// Helper function to extract metrics from UserMetricsResponse
function extractPositionMetrics(metricsResponse: UserMetricsResponse | null): Record<string, any> | null {
  if (!metricsResponse || !metricsResponse.positions || metricsResponse.positions.length === 0) {
    return null;
  }
  
  // For simplicity, we'll use the metrics from the first position
  // In a real application, you might want to aggregate or select specific positions
  return metricsResponse.positions[0].metrics;
}
export class PositionService {
  async createPosition(userId: string, data: {
    protocol_id: string;
    type: string;
    amount: string;
    token_address: string;
    config: PositionConfig;
  }) {
    try {
      const { protocol_id, type, amount, token_address, config } = data;

      // Validate token and get info
      const tokenInfo = await blockchain.getTokenInfo(token_address);

      // Create position
      const { data: position, error } = await supabase
        .from('positions')
        .insert({
          protocol_id,
          user_id: userId,
          type,
          amount,
          token_address,
          token_info: tokenInfo,
          config,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate initial metrics
      const metricsResponse = await metrics.getUserMetrics(protocol_id, userId);
      const positionMetrics = extractPositionMetrics(metricsResponse);

      // Ensure metrics conform to PositionMetrics interface
      const validatedMetrics: PositionMetrics = {
        value: positionMetrics?.value?.toString() || '0',
        pnl: positionMetrics?.pnl?.toString() || '0',
        apy: typeof positionMetrics?.apy === 'number' ? positionMetrics.apy : 0
      };
      
      // Add any additional properties that match the interface
      if (positionMetrics) {
        Object.keys(positionMetrics).forEach(key => {
          const value = positionMetrics[key];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === undefined) {
            validatedMetrics[key] = value;
          }
        });
      }
      
      return {
        position: position as Position,
        metrics: validatedMetrics,
      };
    } catch (error) {
      console.error('Failed to create position:', error);
      throw error;
    }
  }

  async updatePosition(positionId: string, userId: string, data: {
    amount?: string;
    config?: Partial<PositionConfig>;
  }) {
    try {
      // Get existing position
      const { data: position, error: fetchError } = await supabase
        .from('positions')
        .select('*')
        .eq('id', positionId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Update position
      const { data: updatedPosition, error: updateError } = await supabase
        .from('positions')
        .update({
          amount: data.amount || position.amount,
          config: { ...position.config, ...data.config },
          updated_at: new Date().toISOString(),
        })
        .eq('id', positionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Get updated metrics
      const metricsResponse = await metrics.getUserMetrics(position.protocol_id, userId);
      const positionMetrics = extractPositionMetrics(metricsResponse);

      // Ensure metrics conform to PositionMetrics interface
      const validatedMetrics: PositionMetrics = {
        value: positionMetrics?.value?.toString() || '0',
        pnl: positionMetrics?.pnl?.toString() || '0',
        apy: typeof positionMetrics?.apy === 'number' ? positionMetrics.apy : 0
      };
      
      // Add any additional properties that match the interface
      if (positionMetrics) {
        Object.keys(positionMetrics).forEach(key => {
          const value = positionMetrics[key];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === undefined) {
            validatedMetrics[key] = value;
          }
        });
      }
      
      return {
        position: updatedPosition as Position,
        metrics: validatedMetrics,
      };
    } catch (error) {
      console.error('Failed to update position:', error);
      throw error;
    }
  }

  async closePosition(positionId: string, userId: string) {
    try {
      const { data: position, error: updateError } = await supabase
        .from('positions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('id', positionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      return position as Position;
    } catch (error) {
      console.error('Failed to close position:', error);
      throw error;
    }
  }

  async getPositions(userId: string, protocolId?: string) {
    try {
      let query = supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (protocolId) {
        query = query.eq('protocol_id', protocolId);
      }

      const { data: positions, error } = await query;

      if (error) throw error;

      return positions as Position[];
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      throw error;
    }
  }
}

export const positions = new PositionService();