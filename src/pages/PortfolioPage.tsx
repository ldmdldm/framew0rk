import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { usePortfolio } from '../hooks/usePortfolio';
import AddPositionForm from '../components/AddPositionForm';
import { Plus } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const NetworkBadge: React.FC<{ network: string }> = ({ network }) => {
  // Map network names to colors
  const networkColors: Record<string, string> = {
    ethereum: 'bg-blue-500',
    polygon: 'bg-purple-500',
    arbitrum: 'bg-blue-700',
    optimism: 'bg-red-500',
    base: 'bg-emerald-500',
    default: 'bg-gray-500',
  };

  const color = networkColors[network.toLowerCase()] || networkColors.default;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
      {network}
    </span>
  );
};

const PortfolioPage: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<string>('1w');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Use the portfolio hook to fetch data
  const {
    portfolio,
    positions,
    metrics,
    isLoading,
    error,
    networks,
    connectWallet,
    disconnectWallet,
  } = usePortfolio(connectedWallet, timeframe);

  // Filter positions by selected network
  const filteredPositions = selectedNetwork === 'all'
    ? positions
    : positions.filter(position => position.network.toLowerCase() === selectedNetwork.toLowerCase());

  // Handle wallet connection
  const handleConnectWallet = async () => {
    if (connectedWallet) {
      disconnectWallet();
      setConnectedWallet('');
      return;
    }

    try {
      // Try to connect using the hook's function
      const address = await connectWallet();
      if (address) {
        setConnectedWallet(address);
      } else if (walletAddress) {
        // If no wallet connection but manual address entered
        setConnectedWallet(walletAddress);
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  // Handle modal open/close
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Handle successful position add
  const handlePositionAdded = () => {
    closeModal();
    // Optionally refresh data or show a success message
  };
  const chartData = {
    labels: metrics?.timestamps || [],
    datasets: [
      {
        label: 'Portfolio Value',
        data: metrics?.values || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Portfolio Performance',
      },
    },
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Portfolio Dashboard</h1>

      {/* Wallet Connection Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Enter wallet address (0x...)"
            className="flex-1 p-2 border rounded"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            disabled={!!connectedWallet}
          />
          <button
            className={`px-4 py-2 rounded font-medium ${connectedWallet ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            onClick={handleConnectWallet}
          >
            {connectedWallet ? 'Disconnect Wallet' : 'Connect Wallet'}
          </button>
        </div>
        {connectedWallet && (
          <p className="mt-2 text-sm text-gray-600">
            Connected: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader">Loading...</div>
        </div>
      ) : connectedWallet ? (
        <>
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Total Value</h3>
              <p className="text-3xl font-bold">{formatCurrency(portfolio?.totalValue || 0)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Active Positions</h3>
              <p className="text-3xl font-bold">{positions.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Networks</h3>
              <p className="text-3xl font-bold">{networks.length}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {networks.map((network) => (
                  <NetworkBadge key={network} network={network} />
                ))}
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Performance</h2>
              <div className="flex space-x-2">
                {['1d', '1w', '1m', '3m', 'all'].map((option) => (
                  <button
                    key={option}
                    className={`px-3 py-1 text-sm rounded ${
                      timeframe === option ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => setTimeframe(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              {metrics?.values.length ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Positions List */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Positions</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={openModal}
                  className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Position</span>
                </button>
                <div className="relative">
                <select
                  className="p-2 border rounded appearance-none pr-8 bg-white"
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                >
                  <option value="all">All Networks</option>
                  {networks.map((network) => (
                    <option key={network} value={network}>
                      {network}
                    </option>
                  ))}
                </select>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              </div>
              </div>
            </div>

            {filteredPositions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPositions.map((position) => (
                      <tr key={position.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {position.asset}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {position.protocol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <NetworkBadge network={position.network} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {position.balance.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {formatCurrency(position.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No positions found</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>Connect your wallet to view your portfolio</p>
      ) : (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>Connect your wallet to view your portfolio</p>
        </div>
      )}

      {/* Modal for adding a new position */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative max-w-md w-full mx-4">
            <div className="absolute top-4 right-4">
              <button 
                onClick={closeModal}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <AddPositionForm onSuccess={handlePositionAdded} onCancel={closeModal} />
          </div>
        </div>
      )}

export default PortfolioPage;

