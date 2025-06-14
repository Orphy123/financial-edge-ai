
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp } from 'lucide-react';

interface MarketSearchProps {
  onSymbolSelect: (symbol: string, name: string) => void;
}

const SUPPORTED_SYMBOLS = {
  // US Equities & ETFs
  'AAPL': 'Apple Inc.',
  'MSFT': 'Microsoft Corporation',
  'TSLA': 'Tesla Inc.',
  'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ ETF',
  'DIA': 'SPDR Dow Jones ETF',
  // Forex
  'EUR/USD': 'Euro to US Dollar',
  'GBP/USD': 'British Pound to US Dollar',
  'USD/JPY': 'US Dollar to Japanese Yen',
  'AUD/USD': 'Australian Dollar to US Dollar',
  // Crypto
  'BTC/USD': 'Bitcoin to US Dollar',
  'ETH/USD': 'Ethereum to US Dollar'
};

const MarketSearch = ({ onSymbolSelect }: MarketSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length > 0) {
      const filtered = Object.keys(SUPPORTED_SYMBOLS).filter(symbol => 
        symbol.toLowerCase().includes(value.toLowerCase()) ||
        SUPPORTED_SYMBOLS[symbol as keyof typeof SUPPORTED_SYMBOLS].toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSymbols(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSymbolSelect = (symbol: string) => {
    const name = SUPPORTED_SYMBOLS[symbol as keyof typeof SUPPORTED_SYMBOLS];
    onSymbolSelect(symbol, name);
    setSearchTerm(`${symbol} - ${name}`);
    setShowSuggestions(false);
  };

  const popularSymbols = ['AAPL', 'MSFT', 'TSLA', 'SPY', 'EUR/USD', 'BTC/USD'];

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Search className="h-5 w-5 text-blue-400" />
          <span>Search Financial Markets</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search stocks, forex, crypto... (e.g., AAPL, EUR/USD, BTC)"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          
          {showSuggestions && filteredSymbols.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredSymbols.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => handleSymbolSelect(symbol)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                >
                  <div className="text-white font-medium">{symbol}</div>
                  <div className="text-gray-400 text-sm">
                    {SUPPORTED_SYMBOLS[symbol as keyof typeof SUPPORTED_SYMBOLS]}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <h3 className="text-white text-sm font-medium mb-3">Popular Symbols</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {popularSymbols.map((symbol) => (
              <Button
                key={symbol}
                variant="outline"
                size="sm"
                onClick={() => handleSymbolSelect(symbol)}
                className="justify-start text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
              >
                <TrendingUp className="h-3 w-3 mr-2" />
                {symbol}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSearch;
