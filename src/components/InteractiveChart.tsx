
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, CandlestickChart } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';

interface ChartData {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi: number;
  macd: number;
  signal: number;
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

  useEffect(() => {
    generateMockChartData();
  }, [symbol, timeframe]);

  const generateMockChartData = () => {
    setLoading(true);
    
    // Generate realistic mock data
    const dataPoints = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
    const basePrice = Math.random() * 200 + 50;
    const data: ChartData[] = [];

    for (let i = 0; i < dataPoints; i++) {
      const previousPrice = i === 0 ? basePrice : data[i - 1].close;
      const change = (Math.random() - 0.5) * previousPrice * 0.05;
      const open = previousPrice;
      const close = Math.max(0.01, previousPrice + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      
      data.push({
        date: timeframe === '1D' ? 
          `${9 + i}:00` : 
          timeframe === '1W' ? 
            ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] :
            `${i + 1}/12`,
        price: close,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000),
        rsi: 30 + Math.random() * 40,
        macd: (Math.random() - 0.5) * 5,
        signal: (Math.random() - 0.5) * 3,
      });
    }

    setChartData(data);
    setLoading(false);
  };

  const getCurrentPrice = () => {
    if (chartData.length === 0) return 0;
    return chartData[chartData.length - 1].close;
  };

  const getPriceChange = () => {
    if (chartData.length < 2) return { change: 0, percent: 0 };
    const current = chartData[chartData.length - 1].close;
    const previous = chartData[0].close;
    const change = current - previous;
    const percent = (change / previous) * 100;
    return { change, percent };
  };

  const timeframes = ['1D', '1W', '1M', '3M', '1Y'];
  const priceChange = getPriceChange();

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
                ${getCurrentPrice().toFixed(2)}
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
          </div>
          <div className="flex space-x-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="text-xs"
            >
              Line
            </Button>
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candlestick')}
              className="text-xs"
            >
              Candles
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
                  dataKey="price"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                {showIndicators && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="rsi"
                      stroke="#F59E0B"
                      strokeWidth={1}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="macd"
                      stroke="#10B981"
                      strokeWidth={1}
                      dot={false}
                      strokeDasharray="3 3"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {showIndicators && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-xs text-gray-400">RSI (14)</div>
                <div className="text-white font-semibold">
                  {chartData[chartData.length - 1]?.rsi.toFixed(1) || '0.0'}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-xs text-gray-400">MACD</div>
                <div className="text-white font-semibold">
                  {chartData[chartData.length - 1]?.macd.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-xs text-gray-400">Signal</div>
                <div className="text-white font-semibold">
                  {chartData[chartData.length - 1]?.signal.toFixed(2) || '0.00'}
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
