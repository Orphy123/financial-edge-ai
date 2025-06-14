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
  // Forex (Finnhub format)
  'EUR/USD': 'Euro to US Dollar',
  'GBP/USD': 'British Pound to US Dollar',
  'USD/JPY': 'US Dollar to Japanese Yen',
  'AUD/USD': 'Australian Dollar to US Dollar',
  // Crypto
  'BTC/USD': 'Bitcoin to US Dollar',
  'ETH/USD': 'Ethereum to US Dollar'
};

// Fallback data for when APIs fail
const generateFallbackQuote = (symbol: string) => {
  const basePrice = symbol.includes('BTC') ? 45000 : 
                   symbol.includes('ETH') ? 2500 :
                   symbol.includes('EUR') ? 1.08 :
                   symbol.includes('GBP') ? 1.26 :
                   symbol.includes('JPY') ? 0.0067 :
                   symbol.includes('AUD') ? 0.65 :
                   Math.random() * 200 + 50;
  
  const change = (Math.random() - 0.5) * basePrice * 0.02;
  const price = basePrice + change;
  
  return {
    symbol: symbol,
    name: SUPPORTED_SYMBOLS[symbol] || symbol,
    price: parseFloat(price.toFixed(symbol.includes('/') ? 4 : 2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(((change / basePrice) * 100).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000).toString(),
    high: parseFloat((price * 1.02).toFixed(symbol.includes('/') ? 4 : 2)),
    low: parseFloat((price * 0.98).toFixed(symbol.includes('/') ? 4 : 2)),
    open: parseFloat((price * (0.98 + Math.random() * 0.04)).toFixed(symbol.includes('/') ? 4 : 2)),
    timestamp: new Date().toISOString()
  };
};

const generateFallbackHistoricalData = (symbol: string, dataPoints: number = 100) => {
  const data = [];
  const basePrice = symbol.includes('BTC') ? 45000 : 
                   symbol.includes('ETH') ? 2500 :
                   Math.random() * 200 + 50;
  
  let currentPrice = basePrice;
  
  for (let i = dataPoints; i >= 0; i--) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (i * 5)); // 5-minute intervals
    
    const volatility = 0.01;
    const change = (Math.random() - 0.5) * volatility;
    currentPrice = currentPrice * (1 + change);
    
    const open = i === dataPoints ? basePrice : data[data.length - 1]?.close || currentPrice;
    const high = Math.max(open, currentPrice) * (1 + Math.random() * 0.005);
    const low = Math.min(open, currentPrice) * (1 - Math.random() * 0.005);
    
    data.push({
      date: date.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
  }
  
  return data.reverse();
};

const fetchFinnhubQuote = async (symbol: string, apiKey: string) => {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { timeout: 5000 }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Finnhub returns: c (current), h (high), l (low), o (open), pc (previous close), t (timestamp)
    if (data.c && data.c > 0) {
      const change = data.c - data.pc;
      const changePercent = (change / data.pc) * 100;
      
      return {
        symbol: symbol,
        name: SUPPORTED_SYMBOLS[symbol] || symbol,
        price: parseFloat(data.c.toFixed(symbol.includes('/') ? 4 : 2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: '0', // Finnhub quote doesn't include volume
        high: parseFloat(data.h.toFixed(symbol.includes('/') ? 4 : 2)),
        low: parseFloat(data.l.toFixed(symbol.includes('/') ? 4 : 2)),
        open: parseFloat(data.o.toFixed(symbol.includes('/') ? 4 : 2)),
        timestamp: new Date(data.t * 1000).toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching Finnhub quote for ${symbol}:`, error);
    return null;
  }
};

const fetchFinnhubCandles = async (symbol: string, resolution: string, from: number, to: number, apiKey: string) => {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`,
      { timeout: 10000 }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.s === 'no_data' || data.s === 'error') {
      throw new Error('No data available');
    }

    if (data.c && data.c.length > 0) {
      const chartData = [];
      for (let i = 0; i < data.c.length; i++) {
        chartData.push({
          date: new Date(data.t[i] * 1000).toISOString(),
          open: parseFloat(data.o[i]),
          high: parseFloat(data.h[i]),
          low: parseFloat(data.l[i]),
          close: parseFloat(data.c[i]),
          volume: parseInt(data.v[i] || 0)
        });
      }
      return chartData;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching Finnhub candles for ${symbol}:`, error);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, symbol, timeframe = '1day', interval = '1min' } = await req.json();
    console.log('Request params:', { symbols, symbol, timeframe, interval });
    
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
    
    // If requesting specific symbol with timeframe, get historical data
    if (symbol && timeframe) {
      return await getHistoricalData(symbol, timeframe, interval, finnhubKey);
    }

    // Otherwise get real-time quotes for multiple symbols
    const symbolList = symbols || Object.keys(SUPPORTED_SYMBOLS);
    const results = [];
    let apiSuccess = false;

    if (finnhubKey) {
      // Limit to 5 symbols to avoid rate limits
      for (const sym of symbolList.slice(0, 5)) {
        console.log(`Attempting to fetch data for ${sym}`);
        
        const quote = await fetchFinnhubQuote(sym, finnhubKey);
        if (quote) {
          results.push(quote);
          apiSuccess = true;
        } else {
          console.log(`Failed to fetch data for ${sym}, using fallback`);
        }
        
        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // If no API success or no API key, use fallback data for all symbols
    if (!apiSuccess || results.length === 0) {
      console.log('Using fallback data due to API limitations');
      for (const sym of symbolList) {
        results.push(generateFallbackQuote(sym));
      }
    }

    return new Response(JSON.stringify({ 
      data: results,
      usingFallback: !apiSuccess,
      message: !apiSuccess ? 'Using simulated data due to API limits or configuration' : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in market-data function:', error);
    
    // Return fallback data even on complete failure
    const fallbackResults = Object.keys(SUPPORTED_SYMBOLS).map(sym => generateFallbackQuote(sym));
    
    return new Response(JSON.stringify({ 
      data: fallbackResults,
      usingFallback: true,
      message: 'Using simulated data due to service error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getHistoricalData(symbol: string, timeframe: string, interval: string, apiKey: string | undefined) {
  console.log(`Getting historical data for ${symbol}, timeframe: ${timeframe}, interval: ${interval}`);
  
  // Try Finnhub API first if key is available
  if (apiKey) {
    try {
      // Map timeframes to Finnhub resolution and time range
      const now = Math.floor(Date.now() / 1000);
      let from = now;
      let resolution = '1';
      
      switch (timeframe) {
        case '1D':
          from = now - (24 * 60 * 60); // 1 day ago
          resolution = '5'; // 5-minute intervals
          break;
        case '1W':
          from = now - (7 * 24 * 60 * 60); // 1 week ago
          resolution = '30'; // 30-minute intervals
          break;
        case '1M':
          from = now - (30 * 24 * 60 * 60); // 1 month ago
          resolution = '60'; // 1-hour intervals
          break;
        case '3M':
          from = now - (90 * 24 * 60 * 60); // 3 months ago
          resolution = 'D'; // Daily intervals
          break;
        case '1Y':
          from = now - (365 * 24 * 60 * 60); // 1 year ago
          resolution = 'D'; // Daily intervals
          break;
      }
      
      const chartData = await fetchFinnhubCandles(symbol, resolution, from, now, apiKey);
      
      if (chartData && chartData.length > 0) {
        console.log(`Successfully fetched ${chartData.length} data points for ${symbol}`);
        
        return new Response(JSON.stringify({ 
          symbol,
          data: chartData,
          meta: { symbol, interval: resolution, exchange: 'Finnhub' },
          usingFallback: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Error fetching real historical data:', error);
    }
  }
  
  // Fall back to generated data
  console.log(`Using fallback historical data for ${symbol}`);
  const fallbackData = generateFallbackHistoricalData(symbol, 100);
  
  return new Response(JSON.stringify({ 
    symbol,
    data: fallbackData,
    meta: { symbol, interval, exchange: 'Simulated' },
    usingFallback: true,
    message: 'Using simulated historical data'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
