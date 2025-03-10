import { ethers } from 'ethers';
import { Chain, mainnet, arbitrum, optimism, polygon } from '@wagmi/chains';

// Types
export interface WalletInfo {
  address: string;
  chainId: number;
  connected: boolean;
  provider?: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
}

export interface ConnectOptions {
  onSuccess?: (wallet: WalletInfo) => void;
  onError?: (error: Error) => void;
  onNetworkChange?: (chainId: number) => void;
  onAccountChange?: (address: string) => void;
  onDisconnect?: () => void;
}

export interface BlockchainData {
  tokenBalances: TokenBalance[];
  nativeBalance: string;
  transactions?: Transaction[];
}

export interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
  price?: number;
  value?: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
}

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase';

// Supported chains
export const supportedChains: Chain[] = [mainnet, arbitrum, optimism, polygon];

export const chainIdToName: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  42161: 'Arbitrum',
  137: 'Polygon',
};

// Detect if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && window.ethereum?.isMetaMask === true;
};

// Get the current chain ID
export const getCurrentChainId = async (): Promise<number> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { chainId } = await provider.getNetwork();
    return chainId;
  } catch (error) {
    console.error('Error getting chain ID:', error);
    throw error;
  }
};

// Check if the current chain is supported
export const isChainSupported = async (): Promise<boolean> => {
  try {
    const chainId = await getCurrentChainId();
    return supportedChains.some(chain => chain.id === chainId);
  } catch (error) {
    return false;
  }
};

// Switch the network
export const switchNetwork = async (chainId: number): Promise<boolean> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Format chain ID as hexadecimal
    const chainIdHex = `0x${chainId.toString(16)}`;
    
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
    
    return true;
  } catch (error: any) {
    // Error code 4902 means the chain is not added to MetaMask
    if (error.code === 4902) {
      try {
        // Find the chain to add
        const chainToAdd = supportedChains.find(chain => chain.id === chainId);
        
        if (!chainToAdd) {
          throw new Error(`Chain with ID ${chainId} is not supported`);
        }
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: chainToAdd.name,
              nativeCurrency: {
                name: chainToAdd.nativeCurrency.name,
                symbol: chainToAdd.nativeCurrency.symbol,
                decimals: chainToAdd.nativeCurrency.decimals,
              },
              rpcUrls: [chainToAdd.rpcUrls.default.http[0]],
              blockExplorerUrls: [chainToAdd.blockExplorers?.default.url],
            },
          ],
        });
        
        return true;
      } catch (addError) {
        console.error('Error adding the chain:', addError);
        throw addError;
      }
    }
    
    console.error('Error switching network:', error);
    throw error;
  }
};

// Connect to a wallet
export const connectWallet = async (
  walletType: WalletType = 'metamask',
  options?: ConnectOptions
): Promise<WalletInfo> => {
  try {
    let provider;
    
    if (walletType === 'metamask') {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Set up event listeners for network and account changes
      if (options?.onNetworkChange) {
        window.ethereum.on('chainChanged', (chainId: string) => {
          // ChainId is received as a hex string, convert to number
          const chainIdNumber = parseInt(chainId, 16);
          options.onNetworkChange?.(chainIdNumber);
        });
      }
      
      if (options?.onAccountChange) {
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            options.onAccountChange?.(accounts[0]);
          } else {
            // If accounts array is empty, user has disconnected
            options.onDisconnect?.();
          }
        });
      }
      
      // Get network information
      const { chainId } = await provider.getNetwork();
      const signer = provider.getSigner();
      const address = accounts[0];
      
      const walletInfo: WalletInfo = {
        address,
        chainId,
        connected: true,
        provider,
        signer,
      };
      
      options?.onSuccess?.(walletInfo);
      return walletInfo;
    } else if (walletType === 'walletconnect') {
      // WalletConnect implementation would go here
      throw new Error('WalletConnect is not implemented yet');
    } else if (walletType === 'coinbase') {
      // Coinbase Wallet implementation would go here
      throw new Error('Coinbase Wallet is not implemented yet');
    } else {
      throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    options?.onError?.(error as Error);
    throw error;
  }
};

// Disconnect wallet
export const disconnectWallet = async (): Promise<void> => {
  // For MetaMask, there is no direct way to disconnect
  // You can only remove event listeners and clear the state in your app
  if (window.ethereum) {
    window.ethereum.removeAllListeners('chainChanged');
    window.ethereum.removeAllListeners('accountsChanged');
  }
};

// Get token balances for an address
export const getTokenBalances = async (
  address: string,
  chainId: number
): Promise<TokenBalance[]> => {
  try {
    // Use Ankr's Advanced API to fetch token balances
    const apiKey = process.env.ANKR_API_KEY || '';
    
    // Map chainId to Ankr blockchain name
    const blockchainMapping: Record<number, string> = {
      1: 'eth',
      10: 'optimism',
      137: 'polygon',
      42161: 'arbitrum'
    };
    
    const blockchain = blockchainMapping[chainId] || 'eth';
    const url = 'https://rpc.ankr.com/multichain';
    
    const requestBody = {
      jsonrpc: '2.0',
      method: 'ankr_getAccountBalance',
      params: {
        blockchain,
        walletAddress: address,
        onlyWhitelisted: false
      },
      id: 1
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ankr-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Ankr API error: ${data.error.message}`);
    }
    
    // Transform the Ankr response to our expected format
    return data.result.assets.map((asset: any) => ({
      token: asset.contractAddress || '',
      symbol: asset.tokenSymbol,
      balance: asset.balance,
      decimals: asset.tokenDecimals,
      price: asset.tokenPrice?.usd || 0,
      value: asset.balanceUsd || 0,
    }));
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
};

// Get native token balance
export const getNativeBalance = async (
  address: string,
  provider: ethers.providers.Provider
): Promise<string> => {
  try {
    const balanceWei = await provider.getBalance(address);
    return ethers.utils.formatEther(balanceWei);
  } catch (error) {
    console.error('Error fetching native balance:', error);
    return '0';
  }
};

// Get all blockchain data for a wallet
export const getBlockchainData = async (
  walletInfo: WalletInfo
): Promise<BlockchainData> => {
  try {
    const { address, chainId, provider } = walletInfo;
    
    if (!provider) {
      throw new Error('Provider not available');
    }
    
    // Get token balances
    const tokenBalances = await getTokenBalances(address, chainId);
    
    // Get native token balance
    const nativeBalance = await getNativeBalance(address, provider);
    
    return {
      tokenBalances,
      nativeBalance,
    };
  } catch (error) {
    console.error('Error fetching blockchain data:', error);
    return {
      tokenBalances: [],
      nativeBalance: '0',
    };
  }
};

// Format addresses for display (0x1234...5678)
export const formatAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

// Get the total portfolio value in USD
export const getPortfolioValue = (tokenBalances: TokenBalance[]): number => {
  return tokenBalances.reduce((total, token) => {
    return total + (token.value || 0);
  }, 0);
};

// Listen for blockchain events
export const listenForTransactions = (
  address: string,
  provider: ethers.providers.Provider,
  callback: (transaction: Transaction) => void
): (() => void) => {
  // Create a filter for transactions to or from the address
  const filter = {
    fromBlock: 'latest',
    toBlock: 'latest',
    address: null,
    topics: [null, null, ethers.utils.hexZeroPad(address, 32)],
  };
  
  // Listen for new transactions
  const listener = (log: any) => {
    const transaction: Transaction = {
      hash: log.transactionHash,
      from: log.args.from,
      to: log.args.to,
      value: log.args.value.toString(),
      timestamp: Math.floor(Date.now() / 1000), // Current timestamp
    };
    
    callback(transaction);
  };
  
  provider.on(filter, listener);
  
  // Return a function to remove the listener
  return () => {
    provider.off(filter, listener);
  };
};

// Check if a connection is active
export const isWalletConnected = async (): Promise<boolean> => {
  if (!isMetaMaskInstalled()) {
    return false;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch (error) {
    console.error('Error checking if wallet is connected:', error);
    return false;
  }
};

// Get all connected accounts
export const getAccounts = async (): Promise<string[]> => {
  if (!isMetaMaskInstalled()) {
    return [];
  }
  
  try {
    return await window.ethereum.request({ method: 'eth_accounts' });
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
};

// Global declaration to add ethereum to the window object
declare global {
  interface Window {
    ethereum?: any;
  }
}

