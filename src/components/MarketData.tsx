
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
}

const MarketData = () => {
  const [marketData, setMarketData] = useState<MarketItem[]>([
    {
      symbol: 'US30',
      name: 'Dow Jones Industrial Average',
      price: 37420.45,
      change: 245.67,
      changePercent: 0.66,
      volume: '2.4M',
      high: 37485.23,
      low: 37155.89
    },
    {
      symbol: 'US100',
      name: 'NASDAQ 100',
      price: 16890.23,
      change: -89.45,
      changePercent: -0.53,
      volume: '1.8M',
      high: 16945.67,
      low: 16820.12
    },
    {
      symbol: 'EUR/USD',
      name: 'Euro to US Dollar',
      price: 1.0845,
      change: 0.0012,
      changePercent: 0.11,
      volume: '45.2B',
      high: 1.0867,
      low: 1.0832
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => ({
        ...item,
        price: item.price + (Math.random() - 0.5) * (item.price * 0.001),
        change: item.change + (Math.random() - 0.5) * 5,
        changePercent: item.changePercent + (Math.random() - 0.5) * 0.1
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {marketData.map((item) => (
        <Card key={item.symbol} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-white">
              <span className="text-xl font-bold">{item.symbol}</span>
              <Activity className="h-5 w-5 text-blue-400" />
            </CardTitle>
            <p className="text-gray-400 text-sm">{item.name}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  ${item.price.toFixed(item.symbol.includes('/') ? 4 : 2)}
                </span>
                <div className={`flex items-center space-x-1 ${
                  item.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {item.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                  </span>
                  <span className="text-sm">
                    ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Volume</p>
                  <p className="text-white font-medium">{item.volume}</p>
                </div>
                <div>
                  <p className="text-gray-400">High</p>
                  <p className="text-green-400 font-medium">
                    ${item.high.toFixed(item.symbol.includes('/') ? 4 : 2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Low</p>
                  <p className="text-red-400 font-medium">
                    ${item.low.toFixed(item.symbol.includes('/') ? 4 : 2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MarketData;
