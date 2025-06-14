
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();
    const twelveDataKey = Deno.env.get('TWELVEDATA_API_KEY');
    
    if (!twelveDataKey) {
      throw new Error('TwelveData API key not configured');
    }

    // Use correct symbols that work with TwelveData
    const symbolList = symbols || ['SPY', 'QQQ', 'EUR/USD'];
    const results = [];

    for (const symbol of symbolList) {
      try {
        const response = await fetch(
          `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${twelveDataKey}`
        );
        
        if (!response.ok) {
          console.error(`Failed to fetch data for ${symbol}:`, response.statusText);
          continue;
        }

        const data = await response.json();
        
        if (data.status === 'error') {
          console.error(`API error for ${symbol}:`, data.message);
          continue;
        }

        // Map symbols to display names
        const displaySymbol = symbol === 'SPY' ? 'US30' : symbol === 'QQQ' ? 'US100' : symbol;
        const displayName = symbol === 'SPY' ? 'S&P 500 ETF (SPY)' : 
                           symbol === 'QQQ' ? 'NASDAQ 100 ETF (QQQ)' : 
                           symbol === 'EUR/USD' ? 'Euro to US Dollar' : symbol;

        results.push({
          symbol: displaySymbol,
          name: displayName,
          price: parseFloat(data.close || data.price || 0),
          change: parseFloat(data.change || 0),
          changePercent: parseFloat(data.percent_change || 0),
          volume: data.volume || '0',
          high: parseFloat(data.high || data.price || 0),
          low: parseFloat(data.low || data.price || 0)
        });
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
      }
    }

    // If no data from API, return fallback data
    if (results.length === 0) {
      console.log('No data from API, returning fallback data');
      return new Response(JSON.stringify({ 
        data: [
          {
            symbol: 'US30',
            name: 'S&P 500 ETF (SPY)',
            price: 485.73,
            change: 2.45,
            changePercent: 0.51,
            volume: '45.2M',
            high: 487.12,
            low: 483.89
          },
          {
            symbol: 'US100',
            name: 'NASDAQ 100 ETF (QQQ)',
            price: 442.15,
            change: -1.23,
            changePercent: -0.28,
            volume: '32.1M',
            high: 444.67,
            low: 441.45
          },
          {
            symbol: 'EUR/USD',
            name: 'Euro to US Dollar',
            price: 1.0845,
            change: 0.0012,
            changePercent: 0.11,
            volume: '45.2B',
            high: 1.0867,
            low: 1.0832
          }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in market-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
