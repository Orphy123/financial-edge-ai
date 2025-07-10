import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries,
  ColorType,
  LineStyle,
  CrosshairMode,
  PriceScaleMode,
  Time,
  UTCTimestamp,
  CandlestickSeriesPartialOptions,
  LineSeriesPartialOptions,
  HistogramSeriesPartialOptions
} from 'lightweight-charts';
import { TrendingUp, TrendingDown, BarChart3, Activity, RefreshCw, Volume } from 'lucide-react';
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

interface TradingViewChartProps {
  symbol: string;
  name: string;
}

const TradingViewChart = ({ symbol, name }: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showVolume, setShowVolume] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState({ change: 0, percent: 0 });
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#1F2937' },
        textColor: '#9CA3AF',
        fontSize: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#374151',
        mode: PriceScaleMode.Normal,
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      // Note: watermark can be added separately if needed
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol]);

  // Update chart series based on type
  useEffect(() => {
    if (!chartRef.current) return;

    // Clear existing series
    if (candlestickSeriesRef.current) {
      chartRef.current.removeSeries(candlestickSeriesRef.current);
      candlestickSeriesRef.current = null;
    }
    if (lineSeriesRef.current) {
      chartRef.current.removeSeries(lineSeriesRef.current);
      lineSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }
    if (sma20SeriesRef.current) {
      chartRef.current.removeSeries(sma20SeriesRef.current);
      sma20SeriesRef.current = null;
    }
    if (sma50SeriesRef.current) {
      chartRef.current.removeSeries(sma50SeriesRef.current);
      sma50SeriesRef.current = null;
    }

    // Create new series based on chart type
    if (chartType === 'candlestick') {
      const candlestickOptions: CandlestickSeriesPartialOptions = {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      };
      candlestickSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, candlestickOptions);
    } else {
      const lineOptions: LineSeriesPartialOptions = {
        color: '#3B82F6',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      };
      lineSeriesRef.current = chartRef.current.addSeries(LineSeries, lineOptions);
    }

    // Add volume series if enabled
    if (showVolume) {
      const volumeOptions: HistogramSeriesPartialOptions = {
        color: '#6B7280',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      };
      volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, volumeOptions);
      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    // Add technical indicators if enabled
    if (showIndicators) {
      const sma20Options: LineSeriesPartialOptions = {
        color: '#F59E0B',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
      };
      sma20SeriesRef.current = chartRef.current.addSeries(LineSeries, sma20Options);

      const sma50Options: LineSeriesPartialOptions = {
        color: '#8B5CF6',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        priceLineVisible: false,
        lastValueVisible: false,
      };
      sma50SeriesRef.current = chartRef.current.addSeries(LineSeries, sma50Options);
    }

    // Update data for new series
    if (chartData.length > 0) {
      updateChartData();
    }
  }, [chartType, showVolume, showIndicators, chartData]);

  // Fetch data
  useEffect(() => {
    fetchRealChartData();
  }, [symbol, timeframe]);

  const convertToTimestamp = (dateStr: string): Time => {
    const date = new Date(dateStr);
    return (date.getTime() / 1000) as UTCTimestamp;
  };

  const updateChartData = () => {
    if (!chartRef.current || chartData.length === 0) return;

    const convertedData = chartData.map(item => ({
      time: convertToTimestamp(item.date),
      ...(chartType === 'candlestick' 
        ? { open: item.open, high: item.high, low: item.low, close: item.close }
        : { value: item.close }
      ),
    }))
    // Sort data in ascending chronological order (required by TradingView charts)
    .sort((a, b) => (a.time as number) - (b.time as number));

    // Update main price series
    if (chartType === 'candlestick' && candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(convertedData);
    } else if (chartType === 'line' && lineSeriesRef.current) {
      lineSeriesRef.current.setData(convertedData);
    }

    // Update volume series
    if (showVolume && volumeSeriesRef.current) {
      const volumeData = chartData.map(item => ({
        time: convertToTimestamp(item.date),
        value: item.volume,
        color: item.close >= item.open ? '#10B98155' : '#EF444455',
      }))
      // Sort volume data in ascending chronological order
      .sort((a, b) => (a.time as number) - (b.time as number));
      volumeSeriesRef.current.setData(volumeData);
    }

    // Update technical indicators
    if (showIndicators) {
      if (sma20SeriesRef.current) {
        const sma20Data = chartData
          .filter(item => item.sma20 !== undefined)
          .map(item => ({
            time: convertToTimestamp(item.date),
            value: item.sma20!,
          }))
          // Sort SMA20 data in ascending chronological order
          .sort((a, b) => (a.time as number) - (b.time as number));
        sma20SeriesRef.current.setData(sma20Data);
      }

      if (sma50SeriesRef.current) {
        const sma50Data = chartData
          .filter(item => item.sma50 !== undefined)
          .map(item => ({
            time: convertToTimestamp(item.date),
            value: item.sma50!,
          }))
          // Sort SMA50 data in ascending chronological order
          .sort((a, b) => (a.time as number) - (b.time as number));
        sma50SeriesRef.current.setData(sma50Data);
      }
    }

    // Fit content to visible range
    chartRef.current.timeScale().fitContent();
  };

  const fetchCurrentPrice = async () => {
    try {
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

  const generateFallbackData = (basePrice: number): ChartData[] => {
    const data: ChartData[] = [];
    const dataPoints = timeframe === '1D' ? 48 : timeframe === '1W' ? 168 : 720;
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date();
      const interval = timeframe === '1D' ? 30 : timeframe === '1W' ? 60 : 120;
      date.setMinutes(date.getMinutes() - (dataPoints - i) * interval);
      
      const volatility = 0.01;
      const change = (Math.random() - 0.5) * volatility;
      const price = i === 0 ? basePrice : data[i-1].close * (1 + change);
      
      const open = i === 0 ? price : data[i-1].close;
      const high = price * (1 + Math.random() * 0.005);
      const low = price * (1 - Math.random() * 0.005);
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      data.push({
        date: date.toISOString(),
        price: price,
        open: open,
        high: high,
        low: low,
        close: price,
        volume: volume,
        ...(showIndicators && i >= 19 && {
          sma20: calculateSMA(data.slice(Math.max(0, i-19), i+1).map(d => d.close)),
        }),
        ...(showIndicators && i >= 49 && {
          sma50: calculateSMA(data.slice(Math.max(0, i-49), i+1).map(d => d.close)),
        }),
      });
    }
    
    return data;
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

  const fetchRealChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching chart data for ${symbol} with timeframe ${timeframe}`);
      
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
            date: item.date,
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
      
      const fallbackData = generateFallbackData(currentPrice);
      setChartData(fallbackData);
      setError(`Using simulated data: ${err.message}`);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="h-96 bg-gray-700 rounded"></div>
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
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candlestick')}
              className="text-xs"
            >
              Candles
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="text-xs"
            >
              Line
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
            <div className="flex space-x-2">
              <Button
                variant={showVolume ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowVolume(!showVolume)}
                className="text-xs"
              >
                <Volume className="h-3 w-3 mr-1" />
                Volume
              </Button>
              <Button
                variant={showIndicators ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowIndicators(!showIndicators)}
                className="text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                Indicators
              </Button>
            </div>
          </div>

          <div 
            ref={chartContainerRef}
            className="w-full h-96 border border-gray-700 rounded-lg"
          />

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

export default TradingViewChart; 