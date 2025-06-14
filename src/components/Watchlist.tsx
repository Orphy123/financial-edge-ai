
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  added_at: string;
}

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const availableSymbols = [
    { symbol: 'US30', name: 'Dow Jones Industrial Average' },
    { symbol: 'US100', name: 'NASDAQ 100' },
    { symbol: 'EUR/USD', name: 'Euro to US Dollar' },
    { symbol: 'GBP/USD', name: 'British Pound to US Dollar' },
    { symbol: 'USD/JPY', name: 'US Dollar to Japanese Yen' },
    { symbol: 'GOLD', name: 'Gold Futures' },
  ];

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user?.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setWatchlist(data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to load watchlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, name: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .insert([
          {
            user_id: user?.id,
            symbol,
            name,
          }
        ]);

      if (error) throw error;

      fetchWatchlist();
      toast({
        title: "Added to Watchlist",
        description: `${symbol} has been added to your watchlist`,
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to add to watchlist",
        variant: "destructive",
      });
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchWatchlist();
      toast({
        title: "Removed from Watchlist",
        description: "Item has been removed from your watchlist",
      });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove from watchlist",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-400" />
            <span>Watchlist</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center">
            Please sign in to create your watchlist
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Heart className="h-5 w-5 text-red-400" />
          <span>My Watchlist</span>
          <Badge variant="outline" className="text-blue-400 border-blue-400/30">
            {watchlist.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Watchlist */}
          {watchlist.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-gray-300 text-sm font-medium">Watching</h3>
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                >
                  <div>
                    <span className="text-white font-medium">{item.symbol}</span>
                    <p className="text-gray-400 text-xs">{item.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromWatchlist(item.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Symbols */}
          <div className="space-y-2">
            <h3 className="text-gray-300 text-sm font-medium">Add to Watchlist</h3>
            <div className="grid grid-cols-1 gap-2">
              {availableSymbols
                .filter(item => !watchlist.some(w => w.symbol === item.symbol))
                .map((item) => (
                  <div
                    key={item.symbol}
                    className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div>
                      <span className="text-white font-medium">{item.symbol}</span>
                      <p className="text-gray-400 text-xs">{item.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addToWatchlist(item.symbol, item.name)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {watchlist.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">
                Your watchlist is empty. Add some symbols to get started!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Watchlist;
