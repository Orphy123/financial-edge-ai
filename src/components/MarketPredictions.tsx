
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Brain, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Prediction {
  timeframe: string;
  predictedPrice: number;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  support: number;
  resistance: number;
}

interface PredictionData {
  date: string;
  actual: number;
  predicted: number;
  upperBand: number;
  lowerBand: number;
}

interface MarketPredictionsProps {
  symbol: string;
  currentPrice: number;
}

const MarketPredictions = ({ symbol, currentPrice }: MarketPredictionsProps) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionChart, setPredictionChart] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generatePredictions();
  }, [symbol, currentPrice]);

  const generatePredictions = () => {
    setLoading(true);

    // Generate ML-style predictions with confidence intervals
    const timeframes = ['1H', '4H', '1D', '1W', '1M'];
    const newPredictions: Prediction[] = [];

    timeframes.forEach((timeframe, index) => {
      const volatility = 0.02 + (index * 0.01); // Increasing volatility for longer timeframes
      const randomWalk = (Math.random() - 0.5) * 2; // -1 to 1
      const trendStrength = Math.random();
      
      const priceChange = currentPrice * volatility * randomWalk;
      const predictedPrice = Math.max(0.01, currentPrice + priceChange);
      
      const trend = priceChange > currentPrice * 0.005 ? 'bullish' : 
                   priceChange < -currentPrice * 0.005 ? 'bearish' : 'neutral';
      
      const confidence = Math.max(60, 95 - (index * 5) + (Math.random() * 10));
      
      newPredictions.push({
        timeframe,
        predictedPrice,
        confidence: Math.round(confidence),
        trend,
        support: predictedPrice * (0.95 - volatility),
        resistance: predictedPrice * (1.05 + volatility)
      });
    });

    setPredictions(newPredictions);
    generatePredictionChart();
    setLoading(false);
  };

  const generatePredictionChart = () => {
    const data: PredictionData[] = [];
    const hours = 24;
    
    for (let i = 0; i < hours; i++) {
      const time = new Date();
      time.setHours(time.getHours() + i);
      
      const trend = (Math.random() - 0.5) * 0.02;
      const noise = (Math.random() - 0.5) * 0.01;
      const price = currentPrice * (1 + trend + noise);
      
      const predicted = currentPrice * (1 + trend);
      const confidence = 0.05; // 5% confidence band
      
      data.push({
        date: i === 0 ? 'Now' : `+${i}h`,
        actual: i === 0 ? currentPrice : null as any,
        predicted: predicted,
        upperBand: predicted * (1 + confidence),
        lowerBand: predicted * (1 - confidence)
      });
    }
    
    setPredictionChart(data);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Target className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'bg-green-900/30 text-green-400 border-green-400/30';
      case 'bearish':
        return 'bg-red-900/30 text-red-400 border-red-400/30';
      default:
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-400/30';
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

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span>AI Price Predictions - {symbol}</span>
            </CardTitle>
            <Button
              onClick={generatePredictions}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((prediction, index) => (
              <div
                key={prediction.timeframe}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-750"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-semibold">{prediction.timeframe}</span>
                  <Badge className={getTrendColor(prediction.trend)}>
                    {getTrendIcon(prediction.trend)}
                    <span className="ml-1 capitalize">{prediction.trend}</span>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="text-gray-400 text-xs">Predicted Price</div>
                    <div className="text-white text-lg font-bold">
                      ${prediction.predictedPrice.toFixed(2)}
                    </div>
                    <div className={`text-sm ${
                      prediction.predictedPrice > currentPrice ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {prediction.predictedPrice > currentPrice ? '+' : ''}
                      {((prediction.predictedPrice - currentPrice) / currentPrice * 100).toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-400">Support</div>
                      <div className="text-red-400 font-medium">${prediction.support.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Resistance</div>
                      <div className="text-green-400 font-medium">${prediction.resistance.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Confidence</span>
                      <span className="text-blue-400 font-medium">{prediction.confidence}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">24H Price Prediction Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionChart}>
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
                  dataKey="upperBand"
                  stroke="#10B981"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  stroke="#EF4444"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
                <ReferenceLine 
                  y={currentPrice} 
                  stroke="#F59E0B" 
                  strokeDasharray="5 5" 
                  label={{ value: "Current", position: "right" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-gray-400">Actual</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-purple-500"></div>
              <span className="text-gray-400">Predicted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }}></div>
              <span className="text-gray-400">Upper Band</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }}></div>
              <span className="text-gray-400">Lower Band</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketPredictions;
