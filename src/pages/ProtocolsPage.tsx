import React, { useState } from 'react';
import { Code, Shield, LineChart, ArrowUpRightFromCircle, Wallet, Settings, Cpu } from 'lucide-react';

export function ProtocolsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Cpu className="w-16 h-16 mx-auto text-emerald-500" />
          <h1 className="text-4xl font-bold">Protocol AI Assistant</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Empower your DeFi protocol with an AI assistant that understands your specific protocol data and helps users make informed decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {integrationFeatures.map((feature, index) => (
            <div key={index} className="p-6 rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <feature.icon className="w-8 h-8 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg">
          <div className="border-b border-slate-800">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-emerald-500 text-emerald-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Protocol-Specific AI Assistant</h2>
                <p className="text-slate-400">
                  Our AI assistant integrates deeply with your protocol's data to provide users with 
                  personalized insights, risk assessments, and strategy recommendations. The assistant 
                  understands your protocol's unique features, tokenomics, and market conditions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-lg border border-slate-800">
                      <benefit.icon className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium mb-1">{benefit.title}</h3>
                        <p className="text-sm text-slate-400">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'integration' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Simple Integration</h3>
                    <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm text-slate-300">
                        {`import { Framew0xrk } from '@framew0xrk/sdk';

const assistant = new Framew0xrk({
  apiKey: 'your-api-key',
  protocol: {
    id: 'your-protocol-id',
    name: 'Your Protocol',
    // Protocol-specific configuration
    config: {
      features: ['lending', 'staking'],
      dataEndpoints: {
        pools: '/api/v1/pools',
        stats: '/api/v1/stats',
        tvl: '/api/v1/tvl'
      },
      // Custom training data
      docs: ['docs/api.md', 'docs/guide.md']
    }
  }
});

// Mount the assistant UI
assistant.mount('#assistant-container');

// Subscribe to events
assistant.on('strategy:suggested', (data) => {
  console.log('Strategy:', data);
});

assistant.on('user:interaction', (data) => {
  analytics.track('AI Assistant Used', data);
});`}
                      </code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Protocol Data Integration</h3>
                    <div className="space-y-4">
                      {apiEndpoints.map((endpoint, index) => (
                        <div key={index} className="p-4 rounded-lg border border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${endpoint.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {endpoint.method}
                            </span>
                            <code className="text-sm">{endpoint.path}</code>
                          </div>
                          <p className="text-sm text-slate-400">{endpoint.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customization' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Customization Options</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Assistant Configuration</h3>
                    <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm text-slate-300">
                        {`{
  "assistant": {
    "name": "DeFi Helper",
    "avatar": "https://your-domain.com/avatar.png",
    "greeting": "How can I help you with [protocol_name]?",
    "capabilities": [
      "strategy_analysis",
      "risk_assessment",
      "position_management",
      "yield_optimization"
    ]
  },
  "ui": {
    "theme": {
      "primary": "#10B981",
      "secondary": "#1F2937",
      "accent": "#6366F1"
    },
    "layout": "floating" // or "embedded"
  },
  "data": {
    "refreshInterval": 30,
    "metrics": ["tvl", "apy", "volume"],
    "customMetrics": {
      "impermanentLoss": {
        "endpoint": "/api/v1/il-calculator",
        "refreshInterval": 60
      }
    }
  }
}`}
                      </code>
                    </pre>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Training & Customization</h3>
                    <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm text-slate-300">
                        {`{
  "training": {
    "data": {
      "docs": ["protocol_docs/*"],
      "guides": ["user_guides/*"],
      "faqs": "faqs.json"
    },
    "custom_responses": {
      "high_risk": "Consider reducing your position...",
      "optimal_strategy": "Based on current market..."
    }
  },
  "plugins": {
    "analytics": {
      "provider": "segment",
      "options": {
        "trackInteractions": true
      }
    },
    "notifications": {
      "enabled": true,
      "channels": ["in-app", "email"]
    }
  }
}`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold">Ready to Enhance Your Protocol?</h2>
            <p className="text-slate-400">
              Add an AI-powered assistant that understands your protocol and helps users make better decisions.
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg px-6 py-2 hover:bg-emerald-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                Request Demo
              </button>
              <button className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-6 py-2 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500/50">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const integrationFeatures = [
  {
    icon: Cpu,
    title: 'Protocol-Aware AI',
    description: 'AI assistant trained on your protocol\'s specific features, mechanics, and data.',
  },
  {
    icon: Code,
    title: 'Easy Integration',
    description: 'Simple SDK that can be integrated into any DeFi interface in minutes.',
  },
  {
    icon: Shield,
    title: 'Custom Training',
    description: 'Trained on your protocol\'s documentation, guides, and historical data.',
  },
];

const tabs = [
  { id: 'overview', name: 'Overview', icon: LineChart },
  { id: 'integration', name: 'Integration', icon: Code },
  { id: 'customization', name: 'Customization', icon: Settings },
];

const benefits = [
  {
    icon: Cpu,
    title: 'Protocol-Specific Insights',
    description: 'AI assistant provides insights based on your protocol\'s unique features and data.',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Helps users understand and manage protocol-specific risks.',
  },
  {
    icon: ArrowUpRightFromCircle,
    title: 'User Education',
    description: 'Educates users about your protocol\'s features and best practices.',
  },
  {
    icon: Wallet,
    title: 'Strategy Optimization',
    description: 'Suggests optimal strategies based on user goals and market conditions.',
  },
];

const apiEndpoints = [
  {
    method: 'POST',
    path: '/api/v1/assistant/train',
    description: 'Train the assistant on your protocol\'s documentation and data',
  },
  {
    method: 'POST',
    path: '/api/v1/assistant/analyze',
    description: 'Get AI analysis of user positions or strategies',
  },
  {
    method: 'GET',
    path: '/api/v1/assistant/metrics',
    description: 'Retrieve protocol-specific metrics and insights',
  },
];