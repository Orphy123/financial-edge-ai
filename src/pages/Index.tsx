
import React from 'react';
import MarketData from '@/components/MarketData';
import NewsPanel from '@/components/NewsPanel';
import AIAnalysis from '@/components/AIAnalysis';
import ApiKeyManager from '@/components/ApiKeyManager';
import { TrendingUp } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Financial Mastery</h1>
              <p className="text-gray-400 text-sm">AI-Powered Trading Assistant</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Real-time Market Data</p>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Market Data Section */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <span>Live Market Data</span>
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
            </h2>
            <MarketData />
          </section>

          {/* Main Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* News Panel */}
            <section>
              <NewsPanel />
            </section>

            {/* AI Analysis */}
            <section>
              <AIAnalysis />
            </section>
          </div>

          {/* API Configuration */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <span>Configuration</span>
              <div className="h-1 w-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded" />
            </h2>
            <ApiKeyManager />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            Financial Mastery - Data-driven trading insights powered by AI. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
