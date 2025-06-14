
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, TrendingDown, Minus, RefreshCw, Bell } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
  isBreaking: boolean;
}

interface SymbolNewsProps {
  symbol: string;
  name: string;
}

const SymbolNews = ({ symbol, name }: SymbolNewsProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSymbolNews();
  }, [symbol]);

  const generateSymbolNews = () => {
    setLoading(true);

    // Generate symbol-specific news
    const newsTemplates = [
      {
        title: `${name} Reports Strong Quarterly Earnings`,
        summary: `${name} (${symbol}) reported better-than-expected quarterly results, with revenue growth and improved profit margins driving investor confidence.`,
        sentiment: 'bullish' as const,
        impact: 'high' as const,
        source: 'Financial Times',
        isBreaking: true
      },
      {
        title: `Analysts Upgrade ${symbol} Price Target`,
        summary: `Multiple analysts have raised their price targets for ${symbol} following strong fundamentals and positive market outlook.`,
        sentiment: 'bullish' as const,
        impact: 'medium' as const,
        source: 'MarketWatch',
        isBreaking: false
      },
      {
        title: `${name} Announces New Product Launch`,
        summary: `${name} unveiled its latest innovation, expected to drive growth in the coming quarters and strengthen market position.`,
        sentiment: 'bullish' as const,
        impact: 'medium' as const,
        source: 'Reuters',
        isBreaking: false
      },
      {
        title: `Market Volatility Affects ${symbol}`,
        summary: `Broader market concerns and sector rotation have impacted ${symbol} trading, with investors showing caution amid uncertainty.`,
        sentiment: 'bearish' as const,
        impact: 'medium' as const,
        source: 'Bloomberg',
        isBreaking: false
      },
      {
        title: `${name} Insider Trading Activity`,
        summary: `Recent insider transactions at ${name} show mixed signals, with some executives purchasing shares while others reduce positions.`,
        sentiment: 'neutral' as const,
        impact: 'low' as const,
        source: 'SEC Filings',
        isBreaking: false
      }
    ];

    const selectedNews = newsTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
      .map((template, index) => ({
        ...template,
        id: `${symbol}-${index}`,
        timestamp: getRandomTimestamp()
      }));

    setNewsItems(selectedNews);
    setLoading(false);
  };

  const getRandomTimestamp = () => {
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    
    if (hours === 0) {
      return `${minutes} minutes ago`;
    } else {
      return `${hours} hours ago`;
    }
  };

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

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-12 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span>{symbol} News & Analysis</span>
          </CardTitle>
          <Button
            onClick={generateSymbolNews}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
                  {item.isBreaking && (
                    <Badge className="bg-red-600 text-white border-red-500">
                      <Bell className="h-3 w-3 mr-1" />
                      BREAKING
                    </Badge>
                  )}
                  <Badge className={getSentimentColor(item.sentiment)}>
                    {getSentimentIcon(item.sentiment)}
                    <span className="ml-1 capitalize">{item.sentiment}</span>
                  </Badge>
                  <Badge className={getImpactColor(item.impact)}>
                    {item.impact.toUpperCase()} IMPACT
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">{item.source}</div>
                  <div className="text-xs text-gray-500">{item.timestamp}</div>
                </div>
              </div>
              
              <h3 className="text-white font-semibold mb-2 leading-tight">
                {item.title}
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SymbolNews;
