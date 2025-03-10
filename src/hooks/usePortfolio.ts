import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ApiClient } from '../utils/api';
import { connectWallet, disconnectWallet, getChainId, switchChain, getWalletBalance, listenToWalletEvents } from '../utils/blockchain';
import { contractService, ContractService } from '../services/contractService';

// Types
export type TimeFrame = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

export interface Position {
  id: string;
  protocol: string;
  type: string;
  asset: string;
  value: number;
  chainId: number;
  chainName: string;
  apr?: number;
  risk?: number;
  startDate: Date;
}

export interface PortfolioMetric {
  timestamp: Date;
  value: number;
}

export interface PortfolioData {
  totalValue: number;
  activePositions: number;
  networks: string[];
  riskScore: number;
  positions: Position[];
  metrics: PortfolioMetric[];
  lastUpdated: Date;
}

export interface UsePortfolioReturn {
  // Portfolio data
  portfolioData: PortfolioData | null;
  positions: Position[];
  metrics: PortfolioMetric[];
  
  // Wallet state
  walletAddress: string | null;
  walletConnected: boolean;
  chainId: number | null;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chainId: number) => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  
  // Blockchain interactions
  addPosition: (token: string, protocol: string, amount: string, entryPrice: string) => Promise<void>;
  removePosition: (positionIndex: number) => Promise<void>;
  isContractConnected: boolean;
  
  // Filtering and view options
  filterPositions: (chainId?: number, protocol?: string, asset?: string) => Position[];
  setTimeframe: (timeframe: TimeFrame) => void;
  timeframe: TimeFrame;
  
  // Loading and error states
  loading: boolean;
  error: Error | null;
}

/**
 * A custom hook that manages portfolio data, including fetching positions,
 * metrics, and handling wallet connections.
 */
/**
 * A custom hook that manages portfolio data, including fetching positions,
 * metrics, and handling wallet connections.
 */
export const usePortfolio = (): UsePortfolioReturn => {
  // State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetric[]>([]);
  const [timeframe, setTimeframe] = useState<TimeFrame>('1m');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isContractConnected, setIsContractConnected] = useState<boolean>(false);
  
  const apiClient = new ApiClient();
      setLoading(true);
      setLoading(true);
      const { address, chainId: connectedChainId } = await connectWallet();
      setWalletAddress(address);
      setChainId(connectedChainId);
      
      // Initialize the contract service with the provider
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          contractService.initialize(provider);
          
          // Connect to the contract on the current chain
          await contractService.connectToContract(connectedChainId.toString());
          setIsContractConnected(true);
        }
      } catch (contractError) {
        console.error('Failed to connect to contract:', contractError);
        // We don't set an error here as the wallet connection itself was successful
      }
      
      setError(null);
      console.error('Failed to connect wallet:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect wallet'));
    } finally {
      setLoading(false);
    }
  };
  
  // Disconnect wallet
  // Disconnect wallet
  const handleDisconnectWallet = () => {
    disconnectWallet();
    setWalletAddress(null);
    setChainId(null);
    setPortfolioData(null);
    setPositions([]);
    setMetrics([]);
    setIsContractConnected(false);
  
  // Switch blockchain network
  const handleSwitchChain = async (newChainId: number) => {
    try {
      setLoading(true);
      await switchChain(newChainId);
      setChainId(newChainId);
      
      // Reconnect to the contract on the new chain
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          contractService.initialize(provider);
          await contractService.connectToContract(newChainId.toString());
          setIsContractConnected(true);
        }
      } catch (contractError) {
        console.error('Failed to connect to contract after chain switch:', contractError);
        setIsContractConnected(false);
      }
      
      // Refresh portfolio data after chain switch
      if (walletAddress) {
        await fetchPortfolioData(walletAddress, newChainId);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to switch chain:', err);
      setError(err instanceof Error ? err : new Error('Failed to switch chain'));
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch portfolio data
  const fetchPortfolioData = async (address: string, chainId?: number) => {
    try {
      setLoading(true);
      
      // Fetch portfolio data from API
      const portfolioResponse = await apiClient.getPortfolio(address, chainId);
      
      // Fetch positions
      const positionsResponse = await apiClient.getPositions(address, chainId);
      
      // Fetch metrics based on selected timeframe
      const metricsResponse = await apiClient.getPortfolioMetrics(address, timeframe, chainId);
      
      // Update state with fetched data
      setPortfolioData({
        totalValue: portfolioResponse.totalValue,
        activePositions: positionsResponse.length,
        networks: Array.from(new Set(positionsResponse.map(pos => pos.chainName))),
        riskScore: calculateRiskScore(positionsResponse),
        positions: positionsResponse,
        metrics: metricsResponse,
        lastUpdated: new Date()
      });
      
      setPositions(positionsResponse);
      setMetrics(metricsResponse);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch portfolio data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio data'));
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate risk score based on positions
  const calculateRiskScore = (positions: Position[]): number => {
    if (positions.length === 0) return 0;
    
    // Simple risk calculation - average of individual position risks
    const totalRisk = positions.reduce((sum, pos) => sum + (pos.risk || 0), 0);
    return totalRisk / positions.length;
  };
  
  // Filter positions based on criteria
  const filterPositions = useCallback(
    (chainId?: number, protocol?: string, asset?: string): Position[] => {
      if (!positions.length) return [];
      
      return positions.filter(position => {
        const chainMatch = !chainId || position.chainId === chainId;
        const protocolMatch = !protocol || position.protocol === protocol;
        const assetMatch = !asset || position.asset.includes(asset);
        
        return chainMatch && protocolMatch && assetMatch;
      });
    },
    [positions]
  );
  
  // Refresh portfolio data
  const refreshPortfolio = async () => {
    if (walletAddress) {
      await fetchPortfolioData(walletAddress, chainId || undefined);
    }
  };
  
  // Add a position to the blockchain
  const addPosition = async (token: string, protocol: string, amount: string, entryPrice: string) => {
    try {
      setLoading(true);
      
      // Check if contract is connected
      if (!isContractConnected) {
        throw new Error('Contract not connected. Please reconnect your wallet.');
      }
      
      // Add the position to the blockchain
      const tx = await contractService.addPosition(token, protocol, amount, entryPrice);
      
      // Wait for the transaction to be confirmed
      await contractService.waitForTransaction(tx);
      
      // Refresh portfolio data after adding position
      await refreshPortfolio();
      
      setError(null);
    } catch (err) {
      console.error('Failed to add position:', err);
      setError(err instanceof Error ? err : new Error('Failed to add position'));
    } finally {
      setLoading(false);
    }
  };
  
  // Remove a position from the blockchain
  const removePosition = async (positionIndex: number) => {
    try {
      setLoading(true);
      
      // Check if contract is connected
      if (!isContractConnected) {
        throw new Error('Contract not connected. Please reconnect your wallet.');
      }
      
      // Remove the position from the blockchain
      const tx = await contractService.removePosition(positionIndex);
      
      // Wait for the transaction to be confirmed
      await contractService.waitForTransaction(tx);
      
      // Refresh portfolio data after removing position
      await refreshPortfolio();
      
      setError(null);
    } catch (err) {
      console.error('Failed to remove position:', err);
      setError(err instanceof Error ? err : new Error('Failed to remove position'));
    } finally {
      setLoading(false);
    }
  };
  
  // Effect to fetch initial data when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      fetchPortfolioData(walletAddress, chainId || undefined);
    }
  }, [walletAddress, chainId]);
  
  // Effect to update metrics when timeframe changes
  useEffect(() => {
    const updateMetrics = async () => {
      if (walletAddress) {
        try {
          setLoading(true);
          const metricsResponse = await apiClient.getPortfolioMetrics(
            walletAddress,
            timeframe,
            chainId || undefined
          );
          setMetrics(metricsResponse);
        } catch (err) {
          console.error('Failed to fetch metrics:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
        } finally {
          setLoading(false);
        }
      }
    };
    
    updateMetrics();
  }, [timeframe, walletAddress, chainId]);
  
  // Set up wallet event listeners
  useEffect(() => {
    const cleanupListeners = listenToWalletEvents({
      onAccountsChanged: (addresses: string[]) => {
        if (addresses.length > 0) {
          setWalletAddress(addresses[0]);
        } else {
          handleDisconnectWallet();
        }
      },
      onChainChanged: (newChainId: number) => {
        setChainId(newChainId);
      },
      onDisconnect: () => {
        handleDisconnectWallet();
      }
    });
    
    return () => {
      cleanupListeners();
    };
  }, []);
  
  return {
    portfolioData,
    positions,
    metrics,
    walletAddress,
    walletConnected: !!walletAddress,
    chainId,
    connectWallet: handleConnectWallet,
    disconnectWallet: handleDisconnectWallet,
    switchChain: handleSwitchChain,
    refreshPortfolio,
    filterPositions,
    setTimeframe,
    timeframe,
    loading,
    error
  };
};

export default usePortfolio;

// The code below is a duplicate implementation of usePortfolio and should be removed
// import { useState, useEffect, useCallback } from 'react';
// import { ApiClient } from '../utils/api';
// 
// // Define timeframe options for metrics
// export type TimeFrame = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';
// 
// /**
//  * Hook for managing portfolio data for a specific wallet address
//  * @param walletAddress - Ethereum wallet address to fetch portfolio data for
//  */
// export const usePortfolio = (walletAddress: string | null) => {
  // API client instance
  const apiClient = new ApiClient();

  // State for portfolio data
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  
  // State for timeframe selection
  const [timeframe, setTimeframe] = useState<TimeFrame>('1w');
  
  // Loading states
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState<boolean>(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);
  
  // Error states
  const [portfolioError, setPortfolioError] = useState<Error | null>(null);
  const [positionsError, setPositionsError] = useState<Error | null>(null);
  const [metricsError, setMetricsError] = useState<Error | null>(null);

  /**
   * Fetch portfolio data for the current wallet address
   */
  const fetchPortfolio = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoadingPortfolio(true);
    setPortfolioError(null);
    
    try {
      const portfolioData = await apiClient.getPortfolio(walletAddress);
      setPortfolio(portfolioData);
    } catch (error) {
      setPortfolioError(error instanceof Error ? error : new Error('Failed to fetch portfolio data'));
      console.error('Error fetching portfolio data:', error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [walletAddress, apiClient]);

  /**
   * Fetch positions for the current wallet address
   */
  const fetchPositions = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoadingPositions(true);
    setPositionsError(null);
    
    try {
      const positionsData = await apiClient.getPositions(walletAddress);
      setPositions(positionsData);
    } catch (error) {
      setPositionsError(error instanceof Error ? error : new Error('Failed to fetch positions data'));
      console.error('Error fetching positions data:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [walletAddress, apiClient]);

  /**
   * Fetch metrics for the current wallet address and timeframe
   */
  const fetchMetrics = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoadingMetrics(true);
    setMetricsError(null);
    
    try {
      const metricsData = await apiClient.getPortfolioMetrics(walletAddress, timeframe);
      setMetrics(metricsData);
    } catch (error) {
      setMetricsError(error instanceof Error ? error : new Error('Failed to fetch metrics data'));
      console.error('Error fetching metrics data:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [walletAddress, timeframe, apiClient]);

  /**
   * Set the timeframe for metrics data
   */
  const selectTimeframe = useCallback((newTimeframe: TimeFrame) => {
    setTimeframe(newTimeframe);
  }, []);

  /**
   * Refetch all portfolio data
   */
  const refetchAllData = useCallback(() => {
    fetchPortfolio();
    fetchPositions();
    fetchMetrics();
  }, [fetchPortfolio, fetchPositions, fetchMetrics]);

  // Fetch all data when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchPortfolio();
      fetchPositions();
      fetchMetrics();
    } else {
      // Reset data if wallet address is null
      setPortfolio(null);
      setPositions([]);
      setMetrics(null);
    }
  }, [walletAddress, fetchPortfolio, fetchPositions, fetchMetrics]);

  // Fetch metrics when timeframe changes
  useEffect(() => {
    if (walletAddress) {
      fetchMetrics();
    }
  }, [timeframe, walletAddress, fetchMetrics]);

  return {
    // Portfolio data
    portfolio,
    positions,
    metrics,
    timeframe,
    
    // Loading states
    isLoadingPortfolio,
    isLoadingPositions,
    isLoadingMetrics,
    isLoading: isLoadingPortfolio || isLoadingPositions || isLoadingMetrics,
    
    // Error states
    portfolioError,
    positionsError,
    metricsError,
    hasError: !!(portfolioError || positionsError || metricsError),
    
    // Actions
    selectTimeframe,
    refetchAllData,
    
    // Individual refetch functions
    fetchPortfolio,
    fetchPositions,
    fetchMetrics
  };
// };
// 
// // This is a duplicate export and should be removed
// // export default usePortfolio;
