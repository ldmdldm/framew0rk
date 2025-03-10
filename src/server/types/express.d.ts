import { ProtocolData } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      protocolData: ProtocolData;
    }
  }
}

// This file has no imports or exports, so we need to add this line to make it a module
export {};

