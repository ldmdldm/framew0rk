import React from 'react';
import { Terminal } from 'lucide-react';
import { Console } from '../components/Console';

export function UserPage() {
  return (
    <main className="container mx-auto px-4 min-h-[calc(100vh-80px)] flex items-center">
      <div className="max-w-3xl mx-auto w-full py-12 space-y-12">
        <div className="text-center space-y-6">
          <Terminal className="w-16 h-16 mx-auto text-emerald-500" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Framew0rk
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Your personal AI DeFi strategy assistant. Get personalized insights and optimize your crypto portfolio through advanced blockchain analysis.
          </p>
        </div>

        <Console />
      </div>
    </main>
  );
}