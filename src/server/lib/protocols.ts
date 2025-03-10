import { supabase } from './supabase';
import { ai } from './ai';

export class ProtocolService {
  async registerProtocol(userId: string, data: {
    name: string;
    config: {
      features: string[];
      dataEndpoints: Record<string, string>;
      docs?: string[];
    };
  }) {
    const { name, config } = data;

    try {
      // Create protocol
      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .insert({
          name,
          config,
          user_id: userId,
        })
        .select()
        .single();

      if (protocolError) throw protocolError;

      // Generate API key
      const { data: apiKey, error: apiKeyError } = await supabase
        .from('api_keys')
        .insert({
          key: await this.generateApiKey(),
          protocol_id: protocol.id,
          user_id: userId,
        })
        .select()
        .single();

      if (apiKeyError) throw apiKeyError;

      // Train AI if docs provided
      if (config.docs && config.docs.length > 0) {
        await ai.trainProtocol(protocol.id, config.docs);
      }

      return {
        protocol,
        apiKey: apiKey.key,
      };
    } catch (error) {
      console.error('Protocol registration error:', error);
      throw error;
    }
  }

  async validateApiKey(key: string) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('protocol_id, user_id')
        .eq('key', key)
        .single();

      if (error) throw error;

      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key', key);

      return data;
    } catch (error) {
      console.error('API key validation error:', error);
      return null;
    }
  }

  private async generateApiKey(): Promise<string> {
    const { data } = await supabase.rpc('generate_api_key');
    return data;
  }
}

export const protocols = new ProtocolService();