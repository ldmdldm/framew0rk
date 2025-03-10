import { ethers } from 'ethers';
import { config } from 'dotenv';

config();

// Interfaces for blockchain data types
export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface PoolReserves {
  token0: string;
  token1: string;
  timestamp: number;
}

export interface PoolInfo {
  address: string;
  token0: TokenInfo;
  token1: TokenInfo;
  reserves: PoolReserves;
  totalSupply: string;
}

export interface UserMetrics {
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  healthFactor: string;
}

export interface ReserveMetrics {
  availableLiquidity: string;
  totalStableDebt: string;
  totalVariableDebt: string;
  liquidityRate: string;
  variableBorrowRate: string;
}

export interface LendingPoolInfo {
  address: string;
  userMetrics: UserMetrics;
  reserveMetrics: ReserveMetrics;
}

export interface TokenBalance extends TokenInfo {
  balance: string;
}

// Common ABIs for DeFi protocols
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const POOL_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function totalSupply() view returns (uint256)',
  'function getAmountOut(uint amountIn, address tokenIn, address tokenOut) view returns (uint256)',
];

const LENDING_POOL_ABI = [
  'function getUserAccountData(address user) view returns (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReserveData(address asset) view returns (tuple(uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp))',
];

export class BlockchainService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private tokenCache: Map<string, TokenInfo> = new Map();

  constructor() {
    // Initialize providers for different networks
    const networks = {
      ethereum: process.env.ETH_RPC_URL,
      arbitrum: process.env.ARB_RPC_URL,
      optimism: process.env.OP_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
    };

    for (const [network, rpcUrl] of Object.entries(networks)) {
      if (rpcUrl) {
        this.providers.set(network, new ethers.JsonRpcProvider(rpcUrl));
      }
    }
  }

  async getTokenInfo(tokenAddress: string, network: string = 'ethereum'): Promise<TokenInfo> {
    const cacheKey = `${network}:${tokenAddress}`;
    if (this.tokenCache.has(cacheKey)) {
      const cachedToken = this.tokenCache.get(cacheKey);
      if (cachedToken) {
        return cachedToken;
      }
    }

    const provider = this.providers.get(network);
    if (!provider) throw new Error(`Provider not found for network: ${network}`);

    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    try {
      const [symbol, decimals, totalSupply] = await Promise.all([
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
      ]);

      const tokenInfo = {
        address: tokenAddress,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
      };

      this.tokenCache.set(cacheKey, tokenInfo);
      return tokenInfo;
    } catch (error) {
      throw new Error(`Failed to fetch token info: ${(error as Error).message || String(error)}`);
    }
  }

  async getPoolInfo(poolAddress: string, network: string = 'ethereum'): Promise<PoolInfo> {
    const provider = this.providers.get(network);
    if (!provider) throw new Error(`Provider not found for network: ${network}`);

    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    
    try {
      const [token0Address, token1Address, reserves, totalSupply] = await Promise.all([
        pool.token0(),
        pool.token1(),
        pool.getReserves(),
        pool.totalSupply(),
      ]);

      const [token0Info, token1Info] = await Promise.all([
        this.getTokenInfo(token0Address, network),
        this.getTokenInfo(token1Address, network),
      ]);

      return {
        address: poolAddress,
        token0: token0Info,
        token1: token1Info,
        reserves: {
          token0: reserves[0].toString(),
          token1: reserves[1].toString(),
          timestamp: reserves[2],
        },
        totalSupply: totalSupply.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch pool info: ${(error as Error).message || String(error)}`);
    }
  }

  async getLendingPoolInfo(poolAddress: string, userAddress: string, network: string = 'ethereum'): Promise<LendingPoolInfo> {
    const provider = this.providers.get(network);
    if (!provider) throw new Error(`Provider not found for network: ${network}`);

    const pool = new ethers.Contract(poolAddress, LENDING_POOL_ABI, provider);
    
    try {
      const [accountData, reserveData] = await Promise.all([
        pool.getUserAccountData(userAddress),
        pool.getReserveData(userAddress),
      ]);

      return {
        address: poolAddress,
        userMetrics: {
          totalCollateralETH: accountData.totalCollateralETH.toString(),
          totalDebtETH: accountData.totalDebtETH.toString(),
          availableBorrowsETH: accountData.availableBorrowsETH.toString(),
          healthFactor: accountData.healthFactor.toString(),
        },
        reserveMetrics: {
          availableLiquidity: reserveData.availableLiquidity.toString(),
          totalStableDebt: reserveData.totalStableDebt.toString(),
          totalVariableDebt: reserveData.totalVariableDebt.toString(),
          liquidityRate: reserveData.liquidityRate.toString(),
          variableBorrowRate: reserveData.variableBorrowRate.toString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch lending pool info: ${(error as Error).message || String(error)}`);
    }
  }

  async getWalletTokenBalances(walletAddress: string, tokenAddresses: string[], network: string = 'ethereum'): Promise<TokenBalance[]> {
    const provider = this.providers.get(network);
    if (!provider) throw new Error(`Provider not found for network: ${network}`);

    try {
      const balances = await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
          const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const [balance, tokenInfo] = await Promise.all([
            token.balanceOf(walletAddress),
            this.getTokenInfo(tokenAddress, network),
          ]);

          return {
            ...tokenInfo,
            balance: balance.toString(),
          };
        })
      );

      return balances;
    } catch (error) {
      throw new Error(`Failed to fetch wallet balances: ${(error as Error).message || String(error)}`);
    }
  }

  async getTokenAllowance(tokenAddress: string, ownerAddress: string, spenderAddress: string, network: string = 'ethereum'): Promise<string> {
    const provider = this.providers.get(network);
    if (!provider) throw new Error(`Provider not found for network: ${network}`);

    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    try {
      const allowance = await token.allowance(ownerAddress, spenderAddress);
      return allowance.toString();
    } catch (error) {
      throw new Error(`Failed to fetch token allowance: ${(error as Error).message || String(error)}`);
    }
  }

  async estimateAmountOut(
    poolAddress: string,
    amountIn: string,
    tokenIn: string,
    tokenOut: string,
    network: string = 'ethereum'
  ): Promise<string> {
    const provider = this.providers.get(network);
    if (!provider) throw new Error(`Provider not found for network: ${network}`);

    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    
    try {
      const amountOut = await pool.getAmountOut(amountIn, tokenIn, tokenOut);
      return amountOut.toString();
    } catch (error) {
      throw new Error(`Failed to estimate amount out: ${(error as Error).message || String(error)}`);
    }
  }
}

// Export an instance of the service to be used throughout the application
export const blockchain = new BlockchainService();
