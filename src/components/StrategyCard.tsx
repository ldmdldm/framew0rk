import React from 'react';
import { ArrowRight, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface StrategyCardProps {
  strategy: {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    protocol: string;
    details: {
      type: string;
      amount: string;
      token: string;
      apy?: string;
      risk?: string;
    };
    timestamp: string;
  };
  onExecute: () => void;
}

export function StrategyCard({ strategy, onExecute }: StrategyCardProps) {
  const getStatusIcon = () => {
    switch (strategy.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'executing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200">{strategy.name}</h3>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm capitalize text-slate-400">{strategy.status}</span>
        </div>
      </div>

      <p className="text-slate-400 text-sm">{strategy.description}</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-slate-500">Protocol</p>
          <p className="text-slate-300">{strategy.protocol}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Type</p>
          <p className="text-slate-300">{strategy.details.type}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Amount</p>
          <p className="text-slate-300">{strategy.details.amount} {strategy.details.token}</p>
        </div>
        {strategy.details.apy && (
          <div>
            <p className="text-sm text-slate-500">Expected APY</p>
            <p className="text-emerald-400">{strategy.details.apy}</p>
          </div>
        )}
      </div>

      {strategy.details.risk && (
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-sm text-slate-400">
            <span className="font-medium text-slate-300">Risk Level: </span>
            {strategy.details.risk}
          </p>
        </div>
      )}

      {strategy.status === 'pending' && (
        <button
          onClick={onExecute}
          className="w-full mt-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-colors"
        >
          Execute Strategy
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}