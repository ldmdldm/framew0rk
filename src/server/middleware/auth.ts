import { Request, Response, NextFunction } from 'express';
import { protocols } from '../lib/protocols';

// Define the ProtocolData interface for type safety
interface ProtocolData {
  id: string;
  userId: string;
}

// Use module augmentation to extend Express Request
declare module 'express' {
  interface Request {
    protocolData: ProtocolData;
  }
}

export async function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required',
    });
  }

  try {
    const protocolData = await protocols.validateApiKey(apiKey);

    if (!protocolData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    req.protocolData = {
      id: protocolData.protocol_id,
      userId: protocolData.user_id,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}