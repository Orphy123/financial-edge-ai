import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPPORTED_SYMBOLS = {
  // US Equities & ETFs
  'AAPL': 'Apple Inc.',
  'MSFT': 'Microsoft Corporation',
  'TSLA': 'Tesla Inc.',
  'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ ETF',
  'DIA': 'SPDR Dow Jones ETF',
  // Forex
  'EUR/USD': 'Euro to US Dollar',
  'GBP/USD': 'British Pound to US Dollar',
  'USD/JPY': 'US Dollar to Japanese Yen',
  'AUD/USD': 'Australian Dollar to US Dollar',
  // Crypto
  'BTC/USD': 'Bitcoin to US Dollar',
  'ETH/USD': 'Ethereum to US Dollar'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, symbol, timeframe = '1day', interval = '1min' } = await req.json();
    const twelveDataKey = Deno.env.get('TWELVEDATA_API_KEY');
    
    if (!twelveDataKey) {
      throw new Error('TwelveData API key not configured');
    }

    // If requesting specific symbol with timeframe, get historical data
    if (symbol && timeframe) {
      return await getHistoricalData(symbol, timeframe, interval, twelveDataKey);
    }

    // Otherwise get real-time quotes for multiple symbols
    const symbolList = symbols || Object.keys(SUPPORTED_SYMBOLS);
    const results = [];

    for (const sym of symbolList) {
      try {
        const response = await fetch(
          `https://api.twelvedata.com/quote?symbol=${sym}&apikey=${twelveDataKey}`
        );
        
        if (!response.ok) {
          console.error(`Failed to fetch data for ${sym}:`, response.statusText);
          continue;
        }

        const data = await response.json();
        
        if (data.status === 'error') {
          console.error(`API error for ${sym}:`, data.message);
          continue;
        }

        results.push({
          symbol: sym,
          name: SUPPORTED_SYMBOLS[sym] || sym,
          price: parseFloat(data.close || data.price || 0),
          change: parseFloat(data.change || 0),
          changePercent: parseFloat(data.percent_change || 0),
          volume: data.volume || '0',
          high: parseFloat(data.high || data.price || 0),
          low: parseFloat(data.low || data.price || 0),
          open: parseFloat(data.open || data.price || 0),
          timestamp: data.datetime || new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error processing ${sym}:`, error);
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

async function getHistoricalData(symbol: string, timeframe: string, interval: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=5000&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message);
    }

    const chartData = data.values?.map((item: any) => ({
      date: item.datetime,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume || 0)
    })).reverse() || [];

    return new Response(JSON.stringify({ 
      symbol,
      data: chartData,
      meta: data.meta 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
