import { ethers } from 'ethers';
import TrackerABI from '../contracts/abi/PortfolioTracker.json';

/**
 * Gets contract addresses from environment variables
 * 
 * Environment variable naming convention:
 * REACT_APP_CONTRACT_ADDRESS_1 = Ethereum Mainnet
 * REACT_APP_CONTRACT_ADDRESS_10 = Optimism
 * REACT_APP_CONTRACT_ADDRESS_137 = Polygon
 * REACT_APP_CONTRACT_ADDRESS_42161 = Arbitrum
 * 
 * @returns Record of chainId to contract address
 */
const getContractAddresses = (): Record<string, string> => {
  const addresses: Record<string, string> = {};
  
  // Ethereum Mainnet
  if (import.meta.env.VITE_CONTRACT_ADDRESS_1) {
    addresses['1'] = import.meta.env.VITE_CONTRACT_ADDRESS_1;
  }
  
  // Optimism
  if (import.meta.env.VITE_CONTRACT_ADDRESS_10) {
    addresses['10'] = import.meta.env.VITE_CONTRACT_ADDRESS_10;
  }
  
  // Polygon
  if (import.meta.env.VITE_CONTRACT_ADDRESS_137) {
    addresses['137'] = import.meta.env.VITE_CONTRACT_ADDRESS_137;
  }
  
  // Arbitrum
  if (import.meta.env.VITE_CONTRACT_ADDRESS_42161) {
    addresses['42161'] = import.meta.env.VITE_CONTRACT_ADDRESS_42161;
  }
  
  return addresses;
};

// Get contract addresses from environment variables
const contractAddresses = getContractAddresses();

// Fallback addresses for development only (these should never be used in production)
const FALLBACK_DEV_ADDRESS = '0x1234567890123456789012345678901234567890';
const fallbackAddresses: Record<string, string> = {
  '1': FALLBACK_DEV_ADDRESS,    // Ethereum mainnet (placeholder)
  '10': FALLBACK_DEV_ADDRESS,   // Optimism (placeholder)
  '137': FALLBACK_DEV_ADDRESS,  // Polygon (placeholder)
  '42161': FALLBACK_DEV_ADDRESS // Arbitrum (placeholder)
};

export interface Position {
  token: string;
  protocol: string;
  amount: string;
  entryTimestamp: number;
  entryPrice?: string;
  active?: boolean;
}

export class ContractService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  
  constructor() {
    // Initialize empty, will connect later
  }
  
  /**
   * Initialize the contract service with a Web3 provider
   * @param provider The Web3 provider to use
   */
  initialize(provider: ethers.providers.Web3Provider): void {
    this.provider = provider;
    this.signer = provider.getSigner();
  }
  
  /**
   * Connect to the PortfolioTracker contract on the specified chain
   * @param chainId The chain ID to connect to
   * @returns The connected contract instance
   */
  async connectToContract(chainId: string): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }
    
    // First try to get the address from environment variables
    let address = contractAddresses[chainId];
    
    // If not found and we're in development, use fallback with warning
    if (!address) {
      if (import.meta.env.DEV) {
        address = fallbackAddresses[chainId];
        console.warn(
          `WARNING: Using development placeholder address for chain ${chainId}. ` +
          `Set VITE_CONTRACT_ADDRESS_${chainId} environment variable for production.`
        );
      } else {
        throw new Error(
          `Contract not deployed on chain ${chainId}. ` +
          `Please set the VITE_CONTRACT_ADDRESS_${chainId} environment variable.`
        );
      }
    }
    
    if (!address) {
      throw new Error(`Contract not deployed on chain ${chainId}`);
    }
    
    this.contract = new ethers.Contract(address, TrackerABI.abi, this.signer);
    return this.contract;
  }
  
  /**
   * Check if the contract is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.contract !== null;
  }
  
  /**
   * Get the contract instance
   * @returns The contract instance
   */
  getContract(): ethers.Contract {
    if (!this.contract) {
      throw new Error('Contract not connected. Call connectToContract() first.');
    }
    return this.contract;
  }
  
  /**
   * Add a new position to the portfolio
   * @param token The token address
   * @param protocol The protocol name
   * @param amount The amount as a string (will be converted to wei)
   * @returns The transaction object
   */
  async addPosition(token: string, protocol: string, amount: string, entryPrice: string): Promise<ethers.ContractTransaction> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }
    
    // Convert the amount to wei
    const amountInWei = ethers.utils.parseEther(amount);
    
    // Convert the entry price to wei (assuming same 18 decimals as ETH)
    const entryPriceInWei = ethers.utils.parseEther(entryPrice);
    
    // Call the contract method with the entry price
    return this.contract.addPosition(token, protocol, amountInWei, entryPriceInWei);
  }
  
  /**
   * Remove a position from the portfolio
   * @param positionIndex The index of the position to remove
   * @returns The transaction object
   */
  async removePosition(positionIndex: number): Promise<ethers.ContractTransaction> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }
    
    return this.contract.removePosition(positionIndex);
  }
  
  /**
   * Get all positions for a user
   * @param userAddress The user address
   * @returns Array of positions
   */
  async getUserPositions(userAddress: string): Promise<Position[]> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }
    
    // Use getAllPositions instead of getUserPositions
    const positions = await this.contract.getAllPositions(userAddress);
    
    // Transform the positions from the contract format to our interface
    return positions.map((pos: any) => ({
      token: pos.token,
      protocol: pos.protocol,
      amount: ethers.utils.formatEther(pos.amount),
      entryTimestamp: pos.timestamp.toNumber(),
      entryPrice: ethers.utils.formatUnits(pos.entryPrice, 18), // Assuming entryPrice uses 18 decimals like ETH
      active: pos.active
    }));
  }

  /**
   * Get only active positions for a user
   * @param userAddress The user address
   * @returns Array of active positions
   */
  async getActivePositions(userAddress: string): Promise<Position[]> {
    const allPositions = await this.getUserPositions(userAddress);
    return allPositions.filter(position => position.active);
  }
  
  /**
   * Get the last updated timestamp for a user's portfolio
   * @param userAddress The user address
   * @returns The timestamp
   */
  async getLastUpdated(userAddress: string): Promise<number> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }
    
    const timestamp = await this.contract.getLastUpdated(userAddress);
    return timestamp.toNumber();
  }
  
  /**
   * Helper method to wait for a transaction to be confirmed
   * @param tx The transaction to wait for
   * @param confirmations The number of confirmations to wait for
   * @returns The transaction receipt
   */
  async waitForTransaction(
    tx: ethers.ContractTransaction, 
    confirmations: number = 1
  ): Promise<ethers.ContractReceipt> {
    return tx.wait(confirmations);
  }
}

// Create and export a singleton instance
export const contractService = new ContractService();

