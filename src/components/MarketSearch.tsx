
import React, { useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

interface MarketSearchProps {
  onSymbolSelect: (symbol: string, name: string) => void;
}

const MarketSearch = ({ onSymbolSelect }: MarketSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Popular symbols for quick access
  const popularSymbols = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stock', exchange: 'NASDAQ' },
    { symbol: 'SPY', name: 'S&P 500 ETF', type: 'ETF', exchange: 'NYSE' },
    { symbol: 'EUR/USD', name: 'Euro to US Dollar', type: 'Forex', exchange: 'FX' },
  ];

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    // Simulate search - in real app, this would call an API
    setTimeout(() => {
      const filtered = popularSymbols.filter(
        item => 
          item.symbol.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    handleSearch(value);
  };

  const selectSymbol = (symbol: string, name: string) => {
    onSymbolSelect(symbol, name);
    setSearchQuery(`${symbol} - ${name}`);
    setShowResults(false);
  };

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
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search stocks, ETFs, forex... (e.g., Apple, AAPL, MSFT)"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          {showResults && (
            <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
              <Command className="bg-gray-800">
                <CommandList className="max-h-64">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-400">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <CommandGroup>
                      {searchResults.map((result) => (
                        <CommandItem
                          key={result.symbol}
                          onSelect={() => selectSymbol(result.symbol, result.name)}
                          className="cursor-pointer hover:bg-gray-700 text-white"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-semibold">{result.symbol}</div>
                              <div className="text-sm text-gray-400">{result.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-blue-400">{result.type}</div>
                              <div className="text-xs text-gray-500">{result.exchange}</div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty className="text-gray-400 p-4 text-center">
                      No results found. Try searching for stocks like "Apple" or "AAPL"
                    </CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-white text-sm font-medium mb-3">Popular Symbols</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {popularSymbols.slice(0, 8).map((item) => (
              <Button
                key={item.symbol}
                variant="outline"
                size="sm"
                onClick={() => selectSymbol(item.symbol, item.name)}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 text-left justify-start"
              >
                <div>
                  <div className="font-semibold text-xs">{item.symbol}</div>
                  <div className="text-xs text-gray-400 truncate">{item.name.slice(0, 15)}...</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSearch;
