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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, symbol, timeframe = '1day', interval = '1min' } = await req.json();
    console.log('Request params:', { symbols, symbol, timeframe, interval });
    
    const twelveDataKey = Deno.env.get('TWELVEDATA_API_KEY');
    
    // If requesting specific symbol with timeframe, get historical data
    if (symbol && timeframe) {
      return await getHistoricalData(symbol, timeframe, interval, twelveDataKey);
    }

    // Otherwise get real-time quotes for multiple symbols
    const symbolList = symbols || Object.keys(SUPPORTED_SYMBOLS);
    const results = [];
    let apiSuccess = false;

    if (twelveDataKey) {
      for (const sym of symbolList.slice(0, 3)) { // Limit to 3 symbols to conserve API calls
        try {
          console.log(`Attempting to fetch data for ${sym}`);
          
          const response = await fetch(
            `https://api.twelvedata.com/quote?symbol=${sym}&apikey=${twelveDataKey}`,
            { timeout: 5000 }
          );
          
          if (!response.ok) {
            console.error(`HTTP error for ${sym}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          
          if (data.status === 'error') {
            console.error(`API error for ${sym}:`, data.message);
            continue;
          }

          if (data.close || data.price) {
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
            apiSuccess = true;
          }
        } catch (error) {
          console.error(`Error processing ${sym}:`, error);
        }
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
  
  // Try real API first if key is available
  if (apiKey) {
    try {
      const response = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=100&apikey=${apiKey}`,
        { timeout: 10000 }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status !== 'error' && data.values && data.values.length > 0) {
          const chartData = data.values.map((item: any) => ({
            date: item.datetime,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume || 0)
          })).reverse();

          console.log(`Successfully fetched ${chartData.length} data points for ${symbol}`);
          
          return new Response(JSON.stringify({ 
            symbol,
            data: chartData,
            meta: data.meta,
            usingFallback: false
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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
