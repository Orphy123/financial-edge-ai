import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChartData {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  sma20?: number;
  sma50?: number;
}

interface InteractiveChartProps {
  symbol: string;
  name: string;
}

const InteractiveChart = ({ symbol, name }: InteractiveChartProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('line');
  const [showIndicators, setShowIndicators] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState({ change: 0, percent: 0 });
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRealChartData();
  }, [symbol, timeframe]);

  const fetchCurrentPrice = async () => {
    try {
      // Get current price from market-data function
      const { data, error: functionError } = await supabase.functions.invoke('market-data', {
        body: { symbols: [symbol] }
      });

      if (!functionError && data?.data && data.data.length > 0) {
        const symbolData = data.data[0];
        setCurrentPrice(symbolData.price);
        setPriceChange({ 
          change: symbolData.change, 
          percent: symbolData.changePercent 
        });
        return symbolData.price;
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
    
    // Fallback price generation if API fails
    const fallbackPrice = symbol.includes('BTC') ? 45000 : 
                         symbol.includes('ETH') ? 2500 :
                         symbol === 'AAPL' ? 180 :
                         symbol === 'MSFT' ? 475 :
                         symbol === 'TSLA' ? 200 :
                         Math.random() * 200 + 50;
    
    setCurrentPrice(fallbackPrice);
    setPriceChange({ change: 0, percent: 0 });
    return fallbackPrice;
  };

  const generateFallbackData = (basePrice: number) => {
    const data: ChartData[] = [];
    const dataPoints = timeframe === '1D' ? 48 : timeframe === '1W' ? 168 : 720;
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date();
      const interval = timeframe === '1D' ? 30 : timeframe === '1W' ? 60 : 120;
      date.setMinutes(date.getMinutes() - (dataPoints - i) * interval);
      
      const volatility = 0.01; // Reduced volatility for more realistic data
      const change = (Math.random() - 0.5) * volatility;
      const price = i === 0 ? basePrice : data[i-1].close * (1 + change);
      
      const open = i === 0 ? price : data[i-1].close;
      const high = price * (1 + Math.random() * 0.005);
      const low = price * (1 - Math.random() * 0.005);
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      data.push({
        date: formatDateForTimeframe(date.toISOString(), timeframe),
        price: price,
        open: open,
        high: high,
        low: low,
        close: price,
        volume: volume
      });
    }
    
    return data;
  };

  const fetchRealChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching chart data for ${symbol} with timeframe ${timeframe}`);
      
      // First get the current price
      const currentPriceValue = await fetchCurrentPrice();
      
      const intervalMap: Record<string, string> = {
        '1D': '5min',
        '1W': '30min', 
        '1M': '1h',
        '3M': '4h',
        '1Y': '1day'
      };

      const { data, error: functionError } = await supabase.functions.invoke('market-data', {
        body: { 
          symbol: symbol,
          timeframe: timeframe,
          interval: intervalMap[timeframe] || '5min'
        }
      });

      console.log('Market data response:', { data, error: functionError });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(`API Error: ${functionError.message || 'Unknown error'}`);
      }

      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        const processedData = data.data.map((item: any, index: number) => {
          const chartItem: ChartData = {
            date: formatDateForTimeframe(item.date, timeframe),
            price: parseFloat(item.close) || 0,
            open: parseFloat(item.open) || 0,
            high: parseFloat(item.high) || 0,
            low: parseFloat(item.low) || 0,
            close: parseFloat(item.close) || 0,
            volume: parseInt(item.volume) || 0
          };

          // Add technical indicators if enabled
          if (showIndicators && data.data.length > 20) {
            const prices = data.data.slice(Math.max(0, index - 13), index + 1).map((d: any) => parseFloat(d.close));
            chartItem.rsi = calculateRSI(prices);
            
            if (index >= 19) {
              const sma20Prices = data.data.slice(index - 19, index + 1).map((d: any) => parseFloat(d.close));
              chartItem.sma20 = calculateSMA(sma20Prices);
            }
            
            if (index >= 49) {
              const sma50Prices = data.data.slice(index - 49, index + 1).map((d: any) => parseFloat(d.close));
              chartItem.sma50 = calculateSMA(sma50Prices);
            }
          }

          return chartItem;
        });

        setChartData(processedData);
        setUsingFallback(data.usingFallback || false);
        if (data.usingFallback) {
          setError('Using simulated historical data - API limits reached');
        }
      } else {
        throw new Error('No valid data received from API');
      }
    } catch (err: any) {
      console.error('Error fetching chart data:', err);
      
      // Use fallback data but show warning
      const fallbackData = generateFallbackData(currentPrice);
      setChartData(fallbackData);
      setError(`Using simulated data: ${err.message}`);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForTimeframe = (dateStr: string, tf: string) => {
    const date = new Date(dateStr);
    
    switch (tf) {
      case '1D':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '1W':
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      case '1M':
      case '3M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1Y':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };

  const calculateSMA = (prices: number[]): number => {
    if (prices.length === 0) return 0;
    const validPrices = prices.filter(p => !isNaN(p) && p > 0);
    if (validPrices.length === 0) return 0;
    return validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
  };

  const calculateRSI = (prices: number[]): number => {
    if (prices.length < 2) return 50;
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
    const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <span>{symbol} - {name}</span>
            </CardTitle>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-2xl font-bold text-white">
                ${currentPrice.toFixed(2)}
              </span>
              <div className={`flex items-center space-x-1 ${priceChange.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium">
                  {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(2)}
                </span>
                <span className="text-sm">
                  ({priceChange.percent >= 0 ? '+' : ''}{priceChange.percent.toFixed(2)}%)
                </span>
              </div>
            </div>
            {(error || usingFallback) && (
              <div className="flex items-center space-x-2 mt-2 text-yellow-400 text-sm">
                {/* <AlertTriangle className="h-4 w-4" /> */}
                <span>{error || 'Using simulated historical data'}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={fetchRealChartData}
              size="sm"
              variant="outline"
              className="text-gray-400 hover:text-white"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="text-xs"
            >
              Line
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="text-xs"
            >
              Volume
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className="text-xs"
                  disabled={loading}
                >
                  {tf}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIndicators(!showIndicators)}
              className="text-xs"
            >
              <Activity className="h-3 w-3 mr-1" />
              Indicators
            </Button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                  {showIndicators && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="sma20"
                        stroke="#F59E0B"
                        strokeWidth={1}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="sma50"
                        stroke="#10B981"
                        strokeWidth={1}
                        dot={false}
                        strokeDasharray="3 3"
                      />
                    </>
                  )}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar
                    dataKey="volume"
                    fill="#3B82F6"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {showIndicators && chartData.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-xs text-gray-400">RSI (14)</div>
                <div className="text-white font-semibold">
                  {chartData[chartData.length - 1]?.rsi?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-xs text-gray-400">SMA 20</div>
                <div className="text-white font-semibold">
                  ${chartData[chartData.length - 1]?.sma20?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-xs text-gray-400">SMA 50</div>
                <div className="text-white font-semibold">
                  ${chartData[chartData.length - 1]?.sma50?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveChart;
