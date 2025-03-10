import { ApolloClient, InMemoryCache } from '@apollo/client';
import { gql } from '@apollo/client/core';

export class GraphService {
  private clients: Map<string, ApolloClient<any>> = new Map();

  constructor() {
    // Initialize clients for different subgraphs
    const subgraphs = {
      uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
      aave: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
      compound: 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2',
      balancer: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2',
      curve: 'https://api.thegraph.com/subgraphs/name/curvefi/curve',
    };

    for (const [name, url] of Object.entries(subgraphs)) {
      this.clients.set(name, new ApolloClient({
        uri: url,
        cache: new InMemoryCache(),
      }));
    }
  }

  async getProtocolMetrics(protocol: string) {
    const client = this.clients.get(protocol);
    if (!client) throw new Error(`No client found for protocol: ${protocol}`);

    try {
      switch (protocol) {
        case 'uniswap':
          return await this.getUniswapMetrics(client);
        case 'aave':
          return await this.getAaveMetrics(client);
        case 'compound':
          return await this.getCompoundMetrics(client);
        case 'balancer':
          return await this.getBalancerMetrics(client);
        case 'curve':
          return await this.getCurveMetrics(client);
        default:
          throw new Error(`Unsupported protocol: ${protocol}`);
      }
    } catch (error) {
      console.error(`Failed to fetch ${protocol} metrics:`, error);
      throw error;
    }
  }

  async getUserPositions(protocol: string, userAddress: string) {
    const client = this.clients.get(protocol);
    if (!client) throw new Error(`No client found for protocol: ${protocol}`);

    try {
      switch (protocol) {
        case 'uniswap':
          return await this.getUniswapPositions(client, userAddress);
        case 'aave':
          return await this.getAavePositions(client, userAddress);
        case 'compound':
          return await this.getCompoundPositions(client, userAddress);
        case 'balancer':
          return await this.getBalancerPositions(client, userAddress);
        case 'curve':
          return await this.getCurvePositions(client, userAddress);
        default:
          throw new Error(`Unsupported protocol: ${protocol}`);
      }
    } catch (error) {
      console.error(`Failed to fetch ${protocol} positions:`, error);
      throw error;
    }
  }

  async getTokenMetrics(protocol: string, tokenAddress: string) {
    const client = this.clients.get(protocol);
    if (!client) throw new Error(`No client found for protocol: ${protocol}`);

    try {
      switch (protocol) {
        case 'uniswap':
          return await this.getUniswapTokenMetrics(client, tokenAddress);
        case 'aave':
          return await this.getAaveTokenMetrics(client, tokenAddress);
        case 'compound':
          return await this.getCompoundTokenMetrics(client, tokenAddress);
        default:
          throw new Error(`Token metrics not supported for protocol: ${protocol}`);
      }
    } catch (error) {
      console.error(`Failed to fetch token metrics for ${protocol}:`, error);
      throw error;
    }
  }

  private async getUniswapMetrics(client: ApolloClient<any>) {
    const { data } = await client.query({
      query: gql`
        query GetUniswapMetrics {
          factories(first: 1) {
            totalVolumeUSD
            totalFeesUSD
            totalValueLockedUSD
            poolCount
            txCount
          }
          bundles(first: 1) {
            ethPriceUSD
          }
        }
      `
    });

    return {
      tvl: parseFloat(data.factories[0].totalValueLockedUSD),
      volume24h: parseFloat(data.factories[0].totalVolumeUSD),
      fees24h: parseFloat(data.factories[0].totalFeesUSD),
      poolCount: parseInt(data.factories[0].poolCount),
      txCount: parseInt(data.factories[0].txCount),
      ethPrice: parseFloat(data.bundles[0].ethPriceUSD),
    };
  }

  private async getAaveMetrics(client: ApolloClient<any>) {
    const { data } = await client.query({
      query: gql`
        query GetAaveMetrics {
          protocolData(id: "1") {
            totalValueLockedUSD
            totalBorrowUSD
            totalDepositUSD
            depositAPY
            borrowAPY
            reserveCount
            userCount
          }
        }
      `
    });

    return {
      tvl: parseFloat(data.protocolData.totalValueLockedUSD),
      totalBorrowed: parseFloat(data.protocolData.totalBorrowUSD),
      totalDeposited: parseFloat(data.protocolData.totalDepositUSD),
      depositAPY: parseFloat(data.protocolData.depositAPY),
      borrowAPY: parseFloat(data.protocolData.borrowAPY),
      reserveCount: parseInt(data.protocolData.reserveCount),
      userCount: parseInt(data.protocolData.userCount),
    };
  }

  private async getCompoundMetrics(client: ApolloClient<any>) {
    const { data } = await client.query({
      query: gql`
        query GetCompoundMetrics {
          markets(first: 100) {
            id
            name
            totalSupplyUSD
            totalBorrowsUSD
            supplyRate
            borrowRate
            exchangeRate
            underlyingPrice
          }
        }
      `
    });

    const totalSupplyUSD = data.markets.reduce((acc: number, market: any) => 
      acc + parseFloat(market.totalSupplyUSD), 0);
    const totalBorrowsUSD = data.markets.reduce((acc: number, market: any) => 
      acc + parseFloat(market.totalBorrowsUSD), 0);

    return {
      tvl: totalSupplyUSD,
      totalBorrowed: totalBorrowsUSD,
      marketCount: data.markets.length,
      markets: data.markets.map((market: any) => ({
        name: market.name,
        supplyRate: parseFloat(market.supplyRate),
        borrowRate: parseFloat(market.borrowRate),
        totalSupplyUSD: parseFloat(market.totalSupplyUSD),
        totalBorrowsUSD: parseFloat(market.totalBorrowsUSD),
      })),
    };
  }

  private async getBalancerMetrics(client: ApolloClient<any>) {
    const { data } = await client.query({
      query: gql`
        query GetBalancerMetrics {
          balancers(first: 1) {
            totalLiquidity
            totalSwapVolume
            totalSwapFee
            poolCount
          }
        }
      `
    });

    return {
      tvl: parseFloat(data.balancers[0].totalLiquidity),
      volume: parseFloat(data.balancers[0].totalSwapVolume),
      fees: parseFloat(data.balancers[0].totalSwapFee),
      poolCount: parseInt(data.balancers[0].poolCount),
    };
  }

  private async getCurveMetrics(client: ApolloClient<any>) {
    const { data } = await client.query({
      query: gql`
        query GetCurveMetrics {
          platform(id: "1") {
            totalValueLockedUSD
            totalVolumeUSD
            poolCount
          }
        }
      `
    });

    return {
      tvl: parseFloat(data.platform.totalValueLockedUSD),
      volume: parseFloat(data.platform.totalVolumeUSD),
      poolCount: parseInt(data.platform.poolCount),
    };
  }

  private async getUniswapPositions(client: ApolloClient<any>, userAddress: string) {
    const { data } = await client.query({
      query: gql`
        query GetUserPositions($user: String!) {
          positions(where: { owner: $user }) {
            id
            pool {
              token0 { symbol, decimals }
              token1 { symbol, decimals }
              feeTier
              liquidity
              token0Price
              token1Price
            }
            liquidity
            depositedToken0
            depositedToken1
            withdrawnToken0
            withdrawnToken1
            collectedFeesToken0
            collectedFeesToken1
          }
        }
      `,
      variables: { user: userAddress.toLowerCase() }
    });

    return data.positions.map((position: any) => ({
      id: position.id,
      poolInfo: {
        pair: `${position.pool.token0.symbol}/${position.pool.token1.symbol}`,
        fee: position.pool.feeTier,
        liquidity: position.pool.liquidity,
        prices: {
          token0: position.pool.token0Price,
          token1: position.pool.token1Price,
        },
      },
      metrics: {
        liquidity: position.liquidity,
        deposits: {
          token0: this.formatTokenAmount(position.depositedToken0, position.pool.token0.decimals),
          token1: this.formatTokenAmount(position.depositedToken1, position.pool.token1.decimals),
        },
        withdrawals: {
          token0: this.formatTokenAmount(position.withdrawnToken0, position.pool.token0.decimals),
          token1: this.formatTokenAmount(position.withdrawnToken1, position.pool.token1.decimals),
        },
        fees: {
          token0: this.formatTokenAmount(position.collectedFeesToken0, position.pool.token0.decimals),
          token1: this.formatTokenAmount(position.collectedFeesToken1, position.pool.token1.decimals),
        },
      },
    }));
  }

  private async getAavePositions(client: ApolloClient<any>, userAddress: string) {
    const { data } = await client.query({
      query: gql`
        query GetUserPositions($user: String!) {
          userReserves(where: { user: $user }) {
            reserve {
              name
              symbol
              decimals
              price {
                priceInEth
                priceInUSD
              }
              liquidityRate
              variableBorrowRate
              stableBorrowRate
            }
            currentATokenBalance
            currentVariableDebt
            currentStableDebt
            liquidityRate
            variableBorrowRate
          }
        }
      `,
      variables: { user: userAddress.toLowerCase() }
    });

    return data.userReserves.map((position: any) => ({
      asset: {
        name: position.reserve.name,
        symbol: position.reserve.symbol,
        decimals: position.reserve.decimals,
        price: {
          eth: parseFloat(position.reserve.price.priceInEth),
          usd: parseFloat(position.reserve.price.priceInUSD),
        },
      },
      balances: {
        supplied: this.formatTokenAmount(position.currentATokenBalance, position.reserve.decimals),
        variableDebt: this.formatTokenAmount(position.currentVariableDebt, position.reserve.decimals),
        stableDebt: this.formatTokenAmount(position.currentStableDebt, position.reserve.decimals),
      },
      rates: {
        deposit: parseFloat(position.liquidityRate),
        variableBorrow: parseFloat(position.variableBorrowRate),
        stableBorrow: parseFloat(position.reserve.stableBorrowRate),
      },
    }));
  }

  private async getCompoundPositions(client: ApolloClient<any>, userAddress: string) {
    const { data } = await client.query({
      query: gql`
        query GetUserPositions($user: String!) {
          accountCTokens(where: { account: $user }) {
            cToken {
              id
              symbol
              name
              totalSupply
              exchangeRate
              supplyRate
              borrowRate
              underlying {
                id
                symbol
                decimals
              }
            }
            cTokenBalance
            totalUnderlyingSupplied
            totalUnderlyingRedeemed
            accountBorrowIndex
            totalUnderlyingBorrowed
            totalUnderlyingRepaid
          }
        }
      `,
      variables: { user: userAddress.toLowerCase() }
    });

    return data.accountCTokens.map((position: any) => ({
      market: {
        name: position.cToken.name,
        symbol: position.cToken.symbol,
        underlying: {
          symbol: position.cToken.underlying.symbol,
          decimals: position.cToken.underlying.decimals,
        },
      },
      balances: {
        cTokens: position.cTokenBalance,
        supplied: this.formatTokenAmount(
          position.totalUnderlyingSupplied,
          position.cToken.underlying.decimals
        ),
        borrowed: this.formatTokenAmount(
          position.totalUnderlyingBorrowed,
          position.cToken.underlying.decimals
        ),
      },
      rates: {
        exchange: parseFloat(position.cToken.exchangeRate),
        supply: parseFloat(position.cToken.supplyRate),
        borrow: parseFloat(position.cToken.borrowRate),
      },
    }));
  }

  private async getBalancerPositions(client: ApolloClient<any>, userAddress: string) {
    const { data } = await client.query({
      query: gql`
        query GetUserPositions($user: String!) {
          poolShares(where: { userAddress: $user }) {
            balance
            pool {
              id
              symbol
              totalShares
              totalLiquidity
              tokens {
                symbol
                decimals
                balance
                weight
              }
            }
          }
        }
      `,
      variables: { user: userAddress.toLowerCase() }
    });

    return data.poolShares.map((share: any) => ({
      pool: {
        id: share.pool.id,
        symbol: share.pool.symbol,
        totalShares: share.pool.totalShares,
        totalLiquidity: parseFloat(share.pool.totalLiquidity),
      },
      userShare: {
        balance: share.balance,
        percentage: (parseFloat(share.balance) / parseFloat(share.pool.totalShares)) * 100,
      },
      tokens: share.pool.tokens.map((token: any) => ({
        symbol: token.symbol,
        balance: this.formatTokenAmount(token.balance, token.decimals),
        weight: parseFloat(token.weight),
      })),
    }));
  }

  private async getCurvePositions(client: ApolloClient<any>, userAddress: string) {
    const { data } = await client.query({
      query: gql`
        query GetUserPositions($user: String!) {
          account(id: $user) {
            poolBalances {
              pool {
                id
                name
                totalSupply
                virtualPrice
                baseAPY
              }
              balance
            }
          }
        }
      `,
      variables: { user: userAddress.toLowerCase() }
    });

    return data.account.poolBalances.map((position: any) => ({
      pool: {
        id: position.pool.id,
        name: position.pool.name,
        totalSupply: position.pool.totalSupply,
        virtualPrice: parseFloat(position.pool.virtualPrice),
        baseAPY: parseFloat(position.pool.baseAPY),
      },
      balance: position.balance,
      share: (parseFloat(position.balance) / parseFloat(position.pool.totalSupply)) * 100,
    }));
  }

  private async getUniswapTokenMetrics(client: ApolloClient<any>, tokenAddress: string) {
    const { data } = await client.query({
      query: gql`
        query GetUniswapTokenMetrics($tokenAddress: String!) {
          token(id: $tokenAddress) {
            id
            symbol
            name
            decimals
            volume
            volumeUSD
            txCount
            totalValueLocked
            totalValueLockedUSD
            feesUSD
            poolCount
          }
          pools(where: {or: [{token0: $tokenAddress}, {token1: $tokenAddress}]}, first: 5, orderBy: volumeUSD, orderDirection: desc) {
            id
            volumeUSD
            totalValueLockedUSD
            feeTier
            token0 {
              symbol
            }
            token1 {
              symbol
            }
          }
        }
      `,
      variables: { tokenAddress: tokenAddress.toLowerCase() }
    });

    if (!data.token) {
      throw new Error(`Token ${tokenAddress} not found in Uniswap`); 
    }

    return {
      token: {
        address: data.token.id,
        symbol: data.token.symbol,
        name: data.token.name,
        decimals: parseInt(data.token.decimals)
      },
      metrics: {
        volume: parseFloat(data.token.volume || '0'),
        volumeUSD: parseFloat(data.token.volumeUSD || '0'),
        txCount: parseInt(data.token.txCount || '0'),
        totalValueLocked: parseFloat(data.token.totalValueLocked || '0'),
        totalValueLockedUSD: parseFloat(data.token.totalValueLockedUSD || '0'),
        feesUSD: parseFloat(data.token.feesUSD || '0'),
        poolCount: parseInt(data.token.poolCount || '0'),
      },
      topPools: (data.pools || []).map((pool: any) => ({
        id: pool.id,
        pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        feeTier: parseInt(pool.feeTier),
        volumeUSD: parseFloat(pool.volumeUSD),
        tvlUSD: parseFloat(pool.totalValueLockedUSD),
      }))
    };
  }

  private async getAaveTokenMetrics(client: ApolloClient<any>, tokenAddress: string) {
    const { data } = await client.query({
      query: gql`
        query GetAaveTokenMetrics($tokenAddress: String!) {
          reserve(id: $tokenAddress) {
            id
            name
            symbol
            decimals
            usageAsCollateralEnabled
            isActive
            isFrozen
            totalDeposits
            totalBorrows
            totalDepositUSD
            totalBorrowUSD
            liquidityRate
            variableBorrowRate
            stableBorrowRate
            availableLiquidity
            price {
              priceInUSD
            }
            ltv
            liquidationThreshold
            liquidationPenalty
          }
        }
      `,
      variables: { tokenAddress: tokenAddress.toLowerCase() }
    });
    
    if (!data.reserve) {
      throw new Error(`Token ${tokenAddress} not found in Aave`);
    }

    return {
      token: {
        address: data.reserve.id,
        symbol: data.reserve.symbol,
        name: data.reserve.name,
        decimals: parseInt(data.reserve.decimals),
        priceUSD: parseFloat(data.reserve.price?.priceInUSD || '0'),
      },
      metrics: {
        totalDeposits: parseFloat(data.reserve.totalDeposits || '0'),
        totalBorrows: parseFloat(data.reserve.totalBorrows || '0'),
        totalDepositUSD: parseFloat(data.reserve.totalDepositUSD || '0'),
        totalBorrowUSD: parseFloat(data.reserve.totalBorrowUSD || '0'),
        availableLiquidity: parseFloat(data.reserve.availableLiquidity || '0'),
        utilizationRate: data.reserve.totalDeposits > 0 ? 
          parseFloat(data.reserve.totalBorrows) / parseFloat(data.reserve.totalDeposits) : 0,
      },
      rates: {
        deposit: parseFloat(data.reserve.liquidityRate || '0'),
        variableBorrow: parseFloat(data.reserve.variableBorrowRate || '0'),
        stableBorrow: parseFloat(data.reserve.stableBorrowRate || '0'),
      },
      riskParameters: {
        collateralEnabled: data.reserve.usageAsCollateralEnabled,
        isActive: data.reserve.isActive,
        isFrozen: data.reserve.isFrozen,
        ltv: parseInt(data.reserve.ltv || '0'),
        liquidationThreshold: parseInt(data.reserve.liquidationThreshold || '0'),
        liquidationPenalty: parseInt(data.reserve.liquidationPenalty || '0'),
      }
    };
  }
  
  /**
   * Formats token amounts with the correct number of decimals
   * @param amount The raw token amount as a string
   * @param decimals The number of decimals for the token
   * @returns Formatted token amount as a number
   */
  private formatTokenAmount(amount: string, decimals: number): number {
    if (!amount || amount === '0') return 0;
    
    // Convert from wei-like format to a human readable number
    const value = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(decimals);
    const beforeDecimal = value / divisor;
    const afterDecimal = value % divisor;
    
    // Format with correct decimal places
    const afterDecimalStr = afterDecimal.toString().padStart(decimals, '0');
    const formattedValue = `${beforeDecimal.toString()}.${afterDecimalStr}`;
    
    // Return as a number, truncating any trailing zeros
    return parseFloat(formattedValue);
  }
  
  /**
   * Gets token metrics for Compound Finance
   * @param client ApolloClient instance for Compound subgraph
   * @param tokenAddress Address of the token to query
   * @returns Metrics for the specified token on Compound
   */
  private async getCompoundTokenMetrics(client: ApolloClient<any>, tokenAddress: string) {
    const { data } = await client.query({
      query: gql`
        query GetCompoundTokenMetrics($tokenAddress: String!) {
          market(id: $tokenAddress) {
            id
            underlyingSymbol
            underlyingName
            underlyingDecimals
            exchangeRate
            supplyRate
            borrowRate
            totalSupply
            totalSupplyUSD
            totalBorrows
            totalBorrowsUSD
            reserveFactor
            underlyingPrice
            underlyingPriceUSD
          }
        }
      `,
      variables: { tokenAddress: tokenAddress.toLowerCase() }
    });
    
    if (!data.market) {
      throw new Error(`Token ${tokenAddress} not found in Compound`);
    }
    
    return {
      token: {
        address: data.market.id,
        symbol: data.market.underlyingSymbol,
        name: data.market.underlyingName,
        decimals: parseInt(data.market.underlyingDecimals),
        priceUSD: parseFloat(data.market.underlyingPriceUSD || '0'),
      },
      metrics: {
        totalSupply: parseFloat(data.market.totalSupply || '0'),
        totalSupplyUSD: parseFloat(data.market.totalSupplyUSD || '0'),
        totalBorrows: parseFloat(data.market.totalBorrows || '0'),
        totalBorrowsUSD: parseFloat(data.market.totalBorrowsUSD || '0'),
        utilizationRate: data.market.totalSupply > 0 ? 
          parseFloat(data.market.totalBorrows) / parseFloat(data.market.totalSupply) : 0,
      },
      rates: {
        exchangeRate: parseFloat(data.market.exchangeRate || '0'),
        supplyRate: parseFloat(data.market.supplyRate || '0'),
        borrowRate: parseFloat(data.market.borrowRate || '0'),
        reserveFactor: parseFloat(data.market.reserveFactor || '0'),
      }
    };
  }
};

// Export a singleton instance
export const graph = new GraphService();

