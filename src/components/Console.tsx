import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import { StrategyList } from './StrategyList';
import api, { AnalyzeRequestContext } from '../utils/api';

interface Message {
  type: 'user' | 'system';
  content: string;
  context?: {
    protocol?: string;
    chain?: string;
    intent?: 'analysis' | 'risk' | 'strategy' | 'yield';
  };
  loading?: boolean;
}

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

export function Console() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const analyzeUserInput = async (input: string) => {
    try {
      const context: AnalyzeRequestContext = {
        protocol: 'uniswap', // Default protocol, can be made dynamic
        chain: 'ethereum', // Default chain, can be made dynamic
        features: ['swap', 'liquidity', 'yield'], // Default features
      };

      const data = await api.analyzeMessage(input, context);
      
      // If the response includes a strategy, add it to the strategies list
      if (data.strategy) {
        setStrategies(prev => [...prev, {
          ...data.strategy,
          status: 'pending',
          timestamp: new Date().toISOString(),
        }]);
      }

      return {
        content: data.content,
        context: data.context,
      };
    } catch (error) {
      console.error('Analysis error:', error);
      return {
        content: "I apologize, but I'm having trouble analyzing your request right now. Please try again in a moment.",
        context: { intent: 'error' }
      };
    }
  };

  const executeStrategy = async (strategyId: string) => {
    try {
      // Update strategy status to executing
      setStrategies(prev => prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, status: 'executing' }
          : strategy
      ));

      const data = await api.executeStrategy(strategyId);

      // Update strategy status based on execution result
      setStrategies(prev => prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, status: data.success ? 'completed' : 'failed' }
          : strategy
      ));

      // Add execution result message
      setMessages(prev => [...prev, {
        type: 'system',
        content: data.message || 'Strategy executed successfully.',
      }]);
    } catch (error) {
      console.error('Strategy execution error:', error);
      
      // Update strategy status to failed
      setStrategies(prev => prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, status: 'failed' }
          : strategy
      ));

      // Add error message
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'Failed to execute strategy. Please try again.',
      }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: userInput 
    }]);

    // Add loading message
    setMessages(prev => [...prev, { 
      type: 'system', 
      content: '...',
      loading: true 
    }]);

    try {
      const response = await analyzeUserInput(userInput);

      // Update loading message with response
      setMessages(prev => prev.map((msg, index) => {
        if (index === prev.length - 1 && msg.loading) {
          return {
            type: 'system',
            content: response.content,
            context: response.context
          };
        }
        return msg;
      }));
    } catch (error) {
      console.error('Request processing error:', error);
      // Update loading message with error
      setMessages(prev => prev.map((msg, index) => {
        if (index === prev.length - 1 && msg.loading) {
          return {
            type: 'system',
            content: 'An error occurred while processing your request. Please try again.',
          };
        }
        return msg;
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="framew0rk-console flex flex-col h-[480px] bg-[#0D1117] backdrop-blur-sm rounded-lg border border-slate-800 hover:border-emerald-500/50 transition-colors">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-slate-400 text-center text-sm">
              Type a message to start your DeFi strategy analysis
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.type === 'user'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800/50 text-slate-200 border border-slate-700'
                  }`}
                >
                  {message.loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: marked(message.content, { breaks: true }) 
                      }}
                      className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0"
                    />
                  )}
                </div>
              </div>
            ))}

            {strategies.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Available Strategies</h3>
                <StrategyList
                  strategies={strategies}
                  onExecuteStrategy={executeStrategy}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-slate-800 p-3">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about DeFi strategies, yields, or risks..."
              className="flex-1 bg-slate-800/50 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder-slate-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing}
              className={`bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg px-3 py-2 hover:bg-emerald-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}