import { supabase } from './supabase';

interface Protocol {
  id: string;
  config: {
    dataEndpoints: Record<string, string>;
  };
  [key: string]: any; // For other properties that might exist
}

interface Position {
  id: string;
  protocol_id: string;
  user_id: string;
  [key: string]: any; // For other properties that might exist
}

interface ProtocolMetrics {
  [key: string]: any; // Metrics data
  timestamp: string;
}

export interface PositionMetric {
  position_id: string;
  metrics: Record<string, any>;
}
// Define the return type of getUserMetrics
export interface UserMetricsResponse {
  positions: PositionMetric[];
  timestamp: string;
}

export class MetricsService {
  async getProtocolMetrics(protocolId: string): Promise<ProtocolMetrics> {
    try {
      // Get protocol configuration
      const { data: protocol } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', protocolId)
        .single();

      if (!protocol) {
        throw new Error('Protocol not found');
      }

      // Fetch metrics from configured endpoints
      const metrics: Record<string, unknown> = {};
      
      for (const [key, endpoint] of Object.entries(protocol.config.dataEndpoints)) {
        try {
          const response = await fetch(endpoint as string);
          metrics[key] = await response.json();
        } catch (error) {
          console.error(`Failed to fetch ${key} metrics:`, error);
          metrics[key] = null;
        }
      }

      // Calculate additional metrics
      const additionalMetrics = await this.calculateAdditionalMetrics(protocol);

      return {
        ...metrics,
        ...additionalMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to fetch protocol metrics:', error);
      throw error;
    }
  }

  async getUserMetrics(protocolId: string, userId: string): Promise<UserMetricsResponse | null> {
    try {
      // Get user's positions
      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('protocol_id', protocolId)
        .eq('user_id', userId);

      if (!positions) {
        return null;
      }

      // Calculate user-specific metrics
      const metrics = await Promise.all(
        positions.map(async (position) => {
          const positionMetrics = await this.calculatePositionMetrics(position);
          return {
            position_id: position.id,
            metrics: positionMetrics,
          };
        })
      );

      return {
        positions: metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to fetch user metrics:', error);
      throw error;
    }
  }

  private async calculateAdditionalMetrics(protocol: Protocol) {
    // Implement protocol-specific metric calculations
    return {};
  }

  private async calculatePositionMetrics(position: Position) {
    // Implement position-specific metric calculations
    return {};
  }
}

export const metrics = new MetricsService();