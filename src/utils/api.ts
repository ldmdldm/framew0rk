import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Portfolio data interfaces
export interface PortfolioPosition {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  amount: string;
  value: number;
  chain: string;
  protocol: string;
  type: string;
  apy?: number;
  entryTimestamp: number;
  entryPrice?: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalPositions: number;
  networks: string[];
  riskScore?: number;
  lastUpdated: number;
}

export interface PortfolioMetrics {
  timestamp: number;
  value: number;
  dailyChange?: number;
  dailyChangePercentage?: number;
}

export interface PortfolioResponse {
  summary: PortfolioSummary;
  positions: PortfolioPosition[];
  metrics: {
    daily: PortfolioMetrics[];
    weekly: PortfolioMetrics[];
    monthly: PortfolioMetrics[];
    yearly: PortfolioMetrics[];
  };
}

export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * ApiClient class for handling API requests to the backend
 */
export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  /**
   * Creates a new instance of the ApiClient
   * @param baseURL - Optional base URL for the API. Defaults to '/api'
   */
  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API request failed:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get complete portfolio data for a wallet address
   * @param walletAddress - Ethereum wallet address
   * @param chainIds - Optional array of chain IDs to filter by
   * @returns Portfolio data including summary, positions, and metrics
   */
  async getPortfolio(walletAddress: string, chainIds?: string[]): Promise<PortfolioResponse> {
    try {
      const params = chainIds?.length ? { chainIds: chainIds.join(',') } : {};
      const response: AxiosResponse<PortfolioResponse> = await this.client.get(
        `/portfolio/${walletAddress}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      throw error;
    }
  }

  /**
   * Get only positions for a wallet address
   * @param walletAddress - Ethereum wallet address
   * @param chainIds - Optional array of chain IDs to filter by
   * @returns Array of portfolio positions
   */
  async getPositions(walletAddress: string, chainIds?: string[]): Promise<PortfolioPosition[]> {
    try {
      const params = chainIds?.length ? { chainIds: chainIds.join(',') } : {};
      const response: AxiosResponse<{ positions: PortfolioPosition[] }> = await this.client.get(
        `/portfolio/${walletAddress}/positions`,
        { params }
      );
      return response.data.positions;
    } catch (error) {
      console.error('Failed to fetch portfolio positions:', error);
      throw error;
    }
  }

  /**
   * Get portfolio metrics for a specific timeframe
   * @param walletAddress - Ethereum wallet address
   * @param timeframe - Timeframe for metrics (daily, weekly, monthly, yearly)
   * @param chainIds - Optional array of chain IDs to filter by
   * @returns Array of portfolio metrics data points
   */
  async getPortfolioMetrics(
    walletAddress: string,
    timeframe: TimeFrame = 'daily',
    chainIds?: string[]
  ): Promise<PortfolioMetrics[]> {
    try {
      const params = {
        timeframe,
        ...(chainIds?.length ? { chainIds: chainIds.join(',') } : {}),
      };
      
      const response: AxiosResponse<{ metrics: PortfolioMetrics[] }> = await this.client.get(
        `/portfolio/${walletAddress}/metrics`,
        { params }
      );
      return response.data.metrics;
    } catch (error) {
      console.error(`Failed to fetch portfolio metrics for timeframe ${timeframe}:`, error);
      throw error;
    }
  }

  /**
   * Get portfolio summary information
   * @param walletAddress - Ethereum wallet address
   * @param chainIds - Optional array of chain IDs to filter by
   * @returns Portfolio summary information
   */
  async getPortfolioSummary(walletAddress: string, chainIds?: string[]): Promise<PortfolioSummary> {
    try {
      const params = chainIds?.length ? { chainIds: chainIds.join(',') } : {};
      const response: AxiosResponse<{ summary: PortfolioSummary }> = await this.client.get(
        `/portfolio/${walletAddress}/summary`,
        { params }
      );
      return response.data.summary;
    } catch (error) {
      console.error('Failed to fetch portfolio summary:', error);
      throw error;
    }
  }

  /**
   * Get historical position performance
   * @param walletAddress - Ethereum wallet address
   * @param positionId - ID of the position
   * @param timeframe - Timeframe for metrics (daily, weekly, monthly, yearly)
   * @returns Array of performance data points for the position
   */
  async getPositionPerformance(
    walletAddress: string,
    positionId: string,
    timeframe: TimeFrame = 'daily'
  ): Promise<PortfolioMetrics[]> {
    try {
      const response: AxiosResponse<{ metrics: PortfolioMetrics[] }> = await this.client.get(
        `/portfolio/${walletAddress}/positions/${positionId}/performance`,
        { params: { timeframe } }
      );
      return response.data.metrics;
    } catch (error) {
      console.error(`Failed to fetch position performance for ID ${positionId}:`, error);
      throw error;
    }
  }

  /**
   * Get risk analysis for a portfolio
   * @param walletAddress - Ethereum wallet address
   * @returns Risk analysis data for the portfolio
   */
  async getPortfolioRisk(walletAddress: string): Promise<{ riskScore: number; factors: string[] }> {
    try {
      const response: AxiosResponse<{ riskScore: number; factors: string[] }> = 
        await this.client.get(`/portfolio/${walletAddress}/risk`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch portfolio risk analysis:', error);
      throw error;
    }
  }
}

// Export a singleton instance of the API client that can be used throughout the app
export const apiClient = new ApiClient();

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

// Type definitions for API requests and responses

// Strategy details interface to replace "any" type
export interface StrategyDetails {
  type: string;
  amount: string;
  token: string;
  // Add common strategy detail fields
  slippage?: number;
  deadline?: number;
  route?: string[];
  targetAsset?: string;
  sourceAsset?: string;
  [key: string]: string | string[] | number | undefined;
}

// Transaction details interface to replace "any" type
export interface TransactionDetails {
  txHash: string;
  timestamp: string;
  blockNumber?: number;
  gasUsed?: number;
  status?: string;
  from?: string;
  to?: string;
  value?: string;
  [key: string]: string | number | undefined;
}
export interface AnalyzeRequestContext {
  protocol: string;
  chain?: string;
  features?: string[];
  // Define common context properties with specific types
  [key: string]: string | string[] | number | boolean | undefined;
}

export interface AnalyzeRequest {
  content: string;
  context: AnalyzeRequestContext;
  provider: 'deepseek';
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  protocol: string;
  details: StrategyDetails;
}

export interface AnalyzeResponse {
  success: boolean;
  content: string;
  context: AnalyzeRequestContext;
  strategy: Strategy | null;
  provider: string;
}

export interface TrainProtocolRequest {
  documents: string[];
  provider: 'deepseek';
}

export interface TrainProtocolResponse {
  success: boolean;
  message: string;
  provider: string;
  timestamp: string;
}

export interface ExecuteStrategyResponse {
  success: boolean;
  message: string;
  details: TransactionDetails;
}\r

// Portfolio-related interfaces
export interface AssetBalance {
  token: string;
  symbol: string;
  balance: string;
  value: number;
  price: number;
  chain: string;
  logoUrl?: string;
}

export interface PositionResponse {
  id: string;
  protocol: string;
  type: string; // 'liquidity', 'lending', 'staking', etc.
  assetAddress: string;
  assetSymbol: string;
  amount: string;
  value: number;
  apy?: number;
  chain: string;
  createdAt: string;
  updatedAt: string;
  details?: Record<string, unknown>;
  risk?: number; // 1-10 risk score
}

export interface PortfolioResponse {
  address: string;
  totalValue: number;
  assets: AssetBalance[];
  positions: PositionResponse[];
  chains: string[];
  updatedAt: string;
}

export interface PerformanceDataPoint {
  timestamp: string;
  value: number;
}

export interface PortfolioMetrics {
  address: string;
  timeframe: string; // '24h', '7d', '30d', '90d', 'all'
  currentValue: number;
  performanceData: PerformanceDataPoint[];
  changePercentage: number;
  changeValue: number;
  avgApy: number;
  riskScore: number; // 1-10 risk score
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

// Error class for API errors
export class ApiError extends Error {
  public status: number;
  public data: ApiErrorResponse;

  constructor(status: number, data: ApiErrorResponse) {
    super(data.error || 'An unknown error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class ApiClient {
  private axios: AxiosInstance;
  private static instance: ApiClient;

  private constructor(baseURL = '/api') {
    this.axios = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Request interceptor for adding auth tokens if needed
    this.axios.interceptors.request.use((config) => {
      // Add authentication if available (e.g., from localStorage)
      const apiKey = localStorage.getItem('api_key');
      if (apiKey) {
        config.headers.Authorization = `Bearer ${apiKey}`;
      }
      return config;
    });

    // Response interceptor for handling errors
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        if (error.response) {
          throw new ApiError(
            error.response.status,
            error.response.data || { success: false, error: 'Unknown error' }
          );
        } else if (error.request) {
          throw new ApiError(0, {
            success: false,
            error: 'No response received from the server. Please check your network connection.',
          });
        } else {
          throw new ApiError(0, {
            success: false,
            error: `Request configuration error: ${error.message}`,
          });
        }
      }
    );
  }

  // Singleton pattern to get instance
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Method to customize the base URL if needed (e.g., for testing or different environments)
  public setBaseURL(baseURL: string): void {
    this.axios.defaults.baseURL = baseURL;
  }

  // Method to add custom headers if needed
  public setHeaders(headers: Record<string, string>): void {
    Object.entries(headers).forEach(([key, value]) => {
      this.axios.defaults.headers.common[key] = value;
    });
  }

  /**
   * Analyze a message with AI in the context of a blockchain protocol
   */
  public async analyzeMessage(message: string, context: AnalyzeRequestContext): Promise<AnalyzeResponse> {
    const request: AnalyzeRequest = {
      content: message,
      context,
      provider: 'deepseek',
    };

    const response = await this.axios.post<AnalyzeResponse>('/analyze', request);
    return response.data;
  }

  /**
   * Execute a strategy by ID
   */
  public async executeStrategy(strategyId: string): Promise<ExecuteStrategyResponse> {
    const response = await this.axios.post<ExecuteStrategyResponse>(`/strategies/${strategyId}/execute`);
    return response.data;
  }

  /**
   * Train a protocol with documents
   */
  public async trainProtocol(protocolId: string, documents: string[]): Promise<TrainProtocolResponse> {
    const request: TrainProtocolRequest = {
      documents,
      provider: 'deepseek',
    };

    const response = await this.axios.post<TrainProtocolResponse>(`/protocols/${protocolId}/train`, request);
    return response.data;\r
  }\r
\r
  /**
   * Get the full portfolio data for a wallet address
   * @param walletAddress The wallet address to get portfolio data for
   */
  public async getPortfolio(walletAddress: string): Promise<PortfolioResponse> {
    const response = await this.axios.get<PortfolioResponse>(`/portfolio/${walletAddress}`);
    return response.data;
  }

  /**
   * Get all positions for a wallet address
   * @param walletAddress The wallet address to get positions for
   */
  public async getPositions(walletAddress: string): Promise<PositionResponse[]> {
    const response = await this.axios.get<{ positions: PositionResponse[] }>(`/portfolio/${walletAddress}/positions`);
    return response.data.positions;
  }

  /**
   * Get historical portfolio metrics for a wallet address
   * @param walletAddress The wallet address to get metrics for
   * @param timeframe The timeframe for historical data: '24h', '7d', '30d', '90d', 'all'
   */
  public async getPortfolioMetrics(walletAddress: string, timeframe: string = '7d'): Promise<PortfolioMetrics> {
    const response = await this.axios.get<PortfolioMetrics>(
      `/portfolio/${walletAddress}/metrics`,
      { params: { timeframe } }
    );
    return response.data;
  }

  /**\r
   * Generic method to make custom API requests if needed
   */
  public async request<T = Record<string, unknown>>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.request<T>(config);
    return response.data;
  }
}

// Export a default instance for easy importing
const api = ApiClient.getInstance();
export default api;

