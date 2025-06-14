
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

    const symbolList = symbols || ['DJI', 'IXIC', 'EURUSD'];
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

        results.push({
          symbol: symbol === 'DJI' ? 'US30' : symbol === 'IXIC' ? 'US100' : symbol,
          name: symbol === 'DJI' ? 'Dow Jones Industrial Average' : 
                symbol === 'IXIC' ? 'NASDAQ 100' : 
                symbol === 'EURUSD' ? 'Euro to US Dollar' : symbol,
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
