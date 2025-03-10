import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { ethers } from 'ethers';

// List of common protocols to select from
const PROTOCOLS = [
  'Uniswap',
  'Aave',
  'Compound',
  'Curve',
  'Balancer',
  'SushiSwap',
  'Yearn',
  'Convex',
  'MakerDAO',
  'Other'
];

// List of common tokens with their addresses on Ethereum mainnet
const COMMON_TOKENS: { [key: string]: string } = {
  'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  'COMP': '0xc00e94Cb662C3520282E6f5717214004A7f26888',
  'CRV': '0xD533a949740bb3306d119CC777fa900bA034cd52'
};

interface AddPositionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddPositionForm: React.FC<AddPositionFormProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const {
    walletConnected,
    connectWallet,
    addPosition,
    loading,
    error,
    isContractConnected
  } = usePortfolio();

  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [protocol, setProtocol] = useState<string>(PROTOCOLS[0]);
  const [amount, setAmount] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [customProtocol, setCustomProtocol] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Update token address when a common token is selected
  useEffect(() => {
    if (selectedToken && selectedToken !== 'Custom') {
      setTokenAddress(COMMON_TOKENS[selectedToken]);
    } else if (selectedToken === 'Custom') {
      setTokenAddress(customTokenAddress);
    }
  }, [selectedToken, customTokenAddress]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      // Validate inputs
      if (!tokenAddress) {
        setFormError('Please enter a valid token address');
        return;
      }

      if (!ethers.utils.isAddress(tokenAddress)) {
        setFormError('Invalid Ethereum address format');
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        setFormError('Please enter a valid amount');
        return;
      }

      if (!entryPrice || parseFloat(entryPrice) <= 0) {
        setFormError('Please enter a valid entry price');
        return;
      }

      // Determine the protocol to use
      const protocolValue = protocol === 'Other' ? customProtocol : protocol;
      
      if (protocol === 'Other' && !customProtocol) {
        setFormError('Please enter a protocol name');
        return;
      }

      // Call the hook's addPosition method
      await addPosition(tokenAddress, protocolValue, amount, entryPrice);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setSelectedToken('');
      setTokenAddress('');
      setCustomTokenAddress('');
      setProtocol(PROTOCOLS[0]);
      setCustomProtocol('');
      setAmount('');
      setEntryPrice('');
      
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add position');
      console.error('Error adding position:', err);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Add New Position</h2>
      
      {!walletConnected && (
        <div className="mb-6">
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      )}
      
      {walletConnected && !isContractConnected && (
        <div className="mb-6 p-4 bg-yellow-800 bg-opacity-30 border border-yellow-700 rounded-md">
          <p className="text-yellow-300">
            Contract not connected. Please make sure you're on a supported network.
          </p>
        </div>
      )}
      
      {walletConnected && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Token</label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a token</option>
              {Object.keys(COMMON_TOKENS).map((token) => (
                <option key={token} value={token}>{token}</option>
              ))}
              <option value="Custom">Custom token</option>
            </select>
          </div>
          
          {selectedToken === 'Custom' && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Custom Token Address</label>
              <input
                type="text"
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Protocol</label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROTOCOLS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          {protocol === 'Other' && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Custom Protocol Name</label>
              <input
                type="text"
                value={customProtocol}
                onChange={(e) => setCustomProtocol(e.target.value)}
                placeholder="Protocol name..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.000001"
                min="0"
                placeholder="0.0"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Entry Price (USD)</label>
            <div className="relative">
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {(error || formError) && (
            <div className="mb-4 p-3 bg-red-800 bg-opacity-30 border border-red-700 rounded-md">
              <p className="text-red-300">
                {formError || (error instanceof Error ? error.message : 'An error occurred')}
              </p>
            </div>
          )}
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !walletConnected || !isContractConnected}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Add Position'}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AddPositionForm;

