
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  confidence: number;
}

const NewsPanel = () => {
  const [newsItems] = useState<NewsItem[]>([
    {
      id: '1',
      title: 'Federal Reserve Signals Potential Rate Changes',
      summary: 'Fed officials hint at possible monetary policy adjustments based on latest inflation data, potentially impacting USD strength.',
      symbol: 'EUR/USD',
      sentiment: 'bearish',
      impact: 'high',
      timestamp: '2 minutes ago',
      confidence: 87
    },
    {
      id: '2',
      title: 'Tech Earnings Exceed Expectations',
      summary: 'Major technology companies report strong quarterly results, driving optimism in the NASDAQ index.',
      symbol: 'US100',
      sentiment: 'bullish',
      impact: 'high',
      timestamp: '15 minutes ago',
      confidence: 92
    },
    {
      id: '3',
      title: 'Manufacturing Data Shows Mixed Results',
      summary: 'Latest manufacturing PMI data presents mixed signals for industrial stocks and the broader market.',
      symbol: 'US30',
      sentiment: 'neutral',
      impact: 'medium',
      timestamp: '32 minutes ago',
      confidence: 73
    }
  ]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-900/30 text-green-400 border-green-400/30';
      case 'bearish':
        return 'bg-red-900/30 text-red-400 border-red-400/30';
      default:
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-400/30';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-orange-900/30 text-orange-400 border-orange-400/30';
      case 'medium':
        return 'bg-blue-900/30 text-blue-400 border-blue-400/30';
      default:
        return 'bg-gray-700/30 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-400" />
          <span>Market News & Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {newsItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-750 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Badge className={getSentimentColor(item.sentiment)}>
                    {getSentimentIcon(item.sentiment)}
                    <span className="ml-1 capitalize">{item.sentiment}</span>
                  </Badge>
                  <Badge className={getImpactColor(item.impact)}>
                    {item.impact.toUpperCase()} IMPACT
                  </Badge>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                    {item.symbol}
                  </Badge>
                  <p className="text-xs text-gray-400 mt-1">{item.timestamp}</p>
                </div>
              </div>
              
              <h3 className="text-white font-semibold mb-2 leading-tight">
                {item.title}
              </h3>
              
              <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                {item.summary}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">AI Confidence:</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-blue-400 font-medium">{item.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsPanel;
