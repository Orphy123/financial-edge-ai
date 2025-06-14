
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalysisRecord {
  id: string;
  symbol: string;
  recommendation: string;
  confidence: number;
  rationale: string[];
  ml_prediction: string;
  ml_confidence: number;
  created_at: string;
}

const AnalysisHistory = () => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(showAll ? 100 : 5);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'buy':
        return 'text-green-400 border-green-400/30';
      case 'sell':
        return 'text-red-400 border-red-400/30';
      default:
        return 'text-yellow-400 border-yellow-400/30';
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-400" />
            <span>Analysis History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center">
            Please sign in to view your analysis history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-400" />
            <span>Analysis History</span>
            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
              {history.length}
            </Badge>
          </div>
          {history.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAll(!showAll);
                fetchHistory();
              }}
              className="text-blue-400 hover:text-blue-300"
            >
              {showAll ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">
                No analysis history yet. Run some AI analysis to get started!
              </p>
            </div>
          )}

          {history.map((record) => (
            <div
              key={record.id}
              className="p-4 bg-gray-800 rounded-lg border border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold">{record.symbol}</span>
                  <Badge
                    variant="outline"
                    className={getRecommendationColor(record.recommendation)}
                  >
                    {getRecommendationIcon(record.recommendation)}
                    <span className="ml-1">{record.recommendation}</span>
                  </Badge>
                  <Badge variant="outline" className="text-gray-400 border-gray-600">
                    {record.confidence}% confidence
                  </Badge>
                </div>
                <span className="text-gray-400 text-xs">
                  {new Date(record.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <h4 className="text-gray-300 text-sm font-medium mb-1">AI Analysis</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    {record.rationale.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center space-x-4 pt-2 border-t border-gray-700">
                  <div className="text-sm">
                    <span className="text-gray-400">ML Prediction: </span>
                    <span className={`font-medium ${
                      record.ml_prediction.toLowerCase() === 'buy' ? 'text-green-400' :
                      record.ml_prediction.toLowerCase() === 'sell' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {record.ml_prediction}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">ML Confidence: </span>
                    <span className="text-white font-medium">{record.ml_confidence}%</span>
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

export default AnalysisHistory;
