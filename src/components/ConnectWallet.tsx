import React, { useState } from 'react';
import { Wallet, ChevronDown, ExternalLink } from 'lucide-react';

export function ConnectWallet() {
  const [isOpen, setIsOpen] = useState(false);

  const handleConnect = async () => {
    // This is where we would implement actual wallet connection
    // For now, we'll just close the dropdown
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg px-4 py-2 hover:bg-emerald-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3">Connect Wallet</h3>
            <div className="space-y-2">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={handleConnect}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <wallet.icon className="w-5 h-5 text-emerald-500" />
                    <span>{wallet.name}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-800 p-4">
            <p className="text-xs text-slate-400 text-center">
              By connecting a wallet, you agree to Framew0rk's Terms of Service
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const walletOptions = [
  { name: 'MetaMask', icon: Wallet },
  { name: 'WalletConnect', icon: Wallet },
  { name: 'Coinbase Wallet', icon: Wallet },
];