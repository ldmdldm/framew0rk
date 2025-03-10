import React from 'react';
import { StrategyCard } from './StrategyCard';

interface Strategy {
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
}

interface StrategyListProps {
  strategies: Strategy[];
  onExecuteStrategy: (strategyId: string) => void;
}

export function StrategyList({ strategies, onExecuteStrategy }: StrategyListProps) {
  if (strategies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No strategies available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {strategies.map((strategy) => (
        <StrategyCard
          key={strategy.id}
          strategy={strategy}
          onExecute={() => onExecuteStrategy(strategy.id)}
        />
      ))}
    </div>
  );
}