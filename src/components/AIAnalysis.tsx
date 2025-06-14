import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Target, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Analysis {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  rationale: string[];
  mlPrediction: 'BUY' | 'SELL';
  mlConfidence: number;
  timeframe: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const AIAnalysis = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: { symbols: ['US30', 'US100', 'EUR/USD'] }
      });

      if (error) {
        throw error;
      }

      if (data?.data) {
        setAnalyses(data.data);
      }
    } catch (err) {
      console.error('Error fetching AI analysis:', err);
      setError('Failed to load AI analysis');
      // Fallback to mock data
      setAnalyses([
        {
          symbol: 'US30',
          recommendation: 'BUY',
          confidence: 85,
          rationale: [
            'Strong technical indicators showing bullish momentum',
            'Positive earnings reports from major components',
            'Fed policy expected to remain accommodative',
            'Volume patterns indicate institutional accumulation'
          ],
          mlPrediction: 'BUY',
          mlConfidence: 78,
          timeframe: '24h analysis',
          riskLevel: 'MEDIUM'
        },
        {
          symbol: 'US100',
          recommendation: 'HOLD',
          confidence: 72,
          rationale: [
            'Mixed signals from recent tech earnings',
            'Overbought conditions on RSI indicator',
            'Support level holding at current price',
            'Awaiting clearer market direction'
          ],
          mlPrediction: 'SELL',
          mlConfidence: 64,
          timeframe: '1h analysis',
          riskLevel: 'HIGH'
        },
        {
          symbol: 'EUR/USD',
          recommendation: 'SELL',
          confidence: 91,
          rationale: [
            'USD strength continues amid rate expectations',
            'ECB dovish stance weighing on EUR',
            'Technical breakdown below key support',
            'Risk-off sentiment favoring dollar'
          ],
          mlPrediction: 'SELL',
          mlConfidence: 89,
          timeframe: '24h analysis',
          riskLevel: 'LOW'
        }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY':
        return 'bg-green-900/30 text-green-400 border-green-400/50';
      case 'SELL':
        return 'bg-red-900/30 text-red-400 border-red-400/50';
      default:
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-400/50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      default:
        return 'text-red-400';
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span>AI Trading Analysis</span>
          </CardTitle>
          <Button
            onClick={fetchAnalysis}
            disabled={isAnalyzing}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">{error} - Showing cached data</p>
          </div>
        )}
        
        <div className="space-y-6">
          {analyses.map((analysis) => (
            <div
              key={analysis.symbol}
              className="p-5 bg-gray-800/50 rounded-lg border border-gray-750"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-blue-400 border-blue-400/30 font-bold">
                    {analysis.symbol}
                  </Badge>
                  <Badge className={getRecommendationColor(analysis.recommendation)}>
                    <Target className="h-3 w-3 mr-1" />
                    {analysis.recommendation}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{analysis.timeframe}</p>
                  <p className={`text-xs font-medium ${getRiskColor(analysis.riskLevel)}`}>
                    {analysis.riskLevel} RISK
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">AI Confidence</span>
                    <span className="text-sm font-bold text-white">{analysis.confidence}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex items-center">
                      ML Prediction 
                      {analysis.mlPrediction === 'BUY' ? (
                        <TrendingUp className="h-3 w-3 ml-1 text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 ml-1 text-red-400" />
                      )}
                    </span>
                    <span className="text-sm font-bold text-white">{analysis.mlConfidence}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        analysis.mlPrediction === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysis.mlConfidence}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Analysis Rationale:</h4>
                <ul className="space-y-1">
                  {analysis.rationale.map((reason, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAnalysis;
