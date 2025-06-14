
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Brain, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForecastData {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  currentPrice: number;
  targetPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  technicals: {
    sma30: number;
    sma120: number;
    rsi: number;
    vwap: number;
    priceDeviation: number;
  };
  timeframe: string;
  timestamp: string;
}

interface RealForecastProps {
  symbol: string;
  currentPrice: number;
}

const RealForecast = ({ symbol, currentPrice }: RealForecastProps) => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateForecast();
  }, [symbol]);

  const generateForecast = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('forecast', {
        body: { symbol }
      });

      if (error) throw error;

      setForecast(data);
    } catch (err) {
      console.error('Error generating forecast:', err);
      setError('Failed to generate forecast. This may be due to insufficient data or API limits.');
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-900/30 text-green-400 border-green-400/30';
      case 'SELL':
        return 'bg-red-900/30 text-red-400 border-red-400/30';
      default:
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-400/30';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp className="h-4 w-4" />;
      case 'SELL':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span>AI Price Forecast - {symbol}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">{error}</p>
            <Button
              onClick={generateForecast}
              variant="outline"
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) return null;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span>AI Price Forecast - {symbol}</span>
          </CardTitle>
          <Button
            onClick={generateForecast}
            disabled={loading}
            size="sm"
            variant="outline"
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Signal */}
          <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-750">
            <Badge className={`${getSignalColor(forecast.signal)} mb-3`}>
              {getSignalIcon(forecast.signal)}
              <span className="ml-2 text-lg font-bold">{forecast.signal}</span>
            </Badge>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-gray-400 text-sm">Target Price</div>
                <div className="text-white text-xl font-bold">
                  ${forecast.targetPrice}
                </div>
                <div className={`text-sm ${
                  forecast.targetPrice > forecast.currentPrice ? 'text-green-400' : 'text-red-400'
                }`}>
                  {forecast.targetPrice > forecast.currentPrice ? '+' : ''}
                  {((forecast.targetPrice - forecast.currentPrice) / forecast.currentPrice * 100).toFixed(2)}%
                </div>
              </div>
              
              <div>
                <div className="text-gray-400 text-sm">Confidence</div>
                <div className="text-white text-xl font-bold">{forecast.confidence}%</div>
                <div className="w-full h-2 bg-gray-700 rounded-full mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${forecast.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-750">
            <div className="text-white font-semibold mb-3">Expected Price Range ({forecast.timeframe})</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-xs">Minimum</div>
                <div className="text-red-400 text-lg font-bold">${forecast.priceRange.min}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Maximum</div>
                <div className="text-green-400 text-lg font-bold">${forecast.priceRange.max}</div>
              </div>
            </div>
          </div>

          {/* Technical Analysis */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-750">
            <div className="text-white font-semibold mb-3">Technical Analysis</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">SMA 30</div>
                <div className="text-white font-medium">${forecast.technicals.sma30}</div>
              </div>
              <div>
                <div className="text-gray-400">SMA 120</div>
                <div className="text-white font-medium">${forecast.technicals.sma120}</div>
              </div>
              <div>
                <div className="text-gray-400">RSI</div>
                <div className={`font-medium ${
                  forecast.technicals.rsi > 70 ? 'text-red-400' : 
                  forecast.technicals.rsi < 30 ? 'text-green-400' : 'text-white'
                }`}>
                  {forecast.technicals.rsi}
                </div>
              </div>
              <div>
                <div className="text-gray-400">VWAP</div>
                <div className="text-white font-medium">${forecast.technicals.vwap}</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date(forecast.timestamp).toLocaleString()}
            <br />
            This is a lightweight heuristic model for educational purposes only.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealForecast;
