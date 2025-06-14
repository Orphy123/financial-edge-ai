
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
    const { symbol } = await req.json();
    console.log(`Generating forecast for ${symbol}`);
    
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
    
    if (!finnhubKey) {
      console.log('No Finnhub API key found, using fallback forecast');
      const fallbackForecast = generateFallbackForecast(symbol);
      return new Response(JSON.stringify(fallbackForecast), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get historical data from Finnhub for forecasting
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (7 * 24 * 60 * 60); // 7 days ago
    
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=60&from=${startTime}&to=${endTime}&token=${finnhubKey}`,
      { timeout: 10000 }
    );
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.s === 'no_data' || data.s === 'error' || !data.c || data.c.length < 50) {
      console.log(`Insufficient data for ${symbol}, using fallback forecast`);
      const fallbackForecast = generateFallbackForecast(symbol);
      return new Response(JSON.stringify(fallbackForecast), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process the data for forecasting
    const prices = data.c.map((close: number, index: number) => ({
      price: close,
      volume: data.v[index] || 0,
      high: data.h[index],
      low: data.l[index],
      timestamp: data.t[index]
    }));

    console.log(`Successfully fetched ${prices.length} data points for ${symbol}`);
    const forecast = generateForecast(prices, symbol);

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in forecast function:', error);
    
    // Generate fallback forecast on any error
    const { symbol } = await req.json().catch(() => ({ symbol: 'UNKNOWN' }));
    const fallbackForecast = generateFallbackForecast(symbol);
    
    return new Response(JSON.stringify(fallbackForecast), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackForecast(symbol: string) {
  console.log(`Generating fallback forecast for ${symbol}`);
  
  // Generate realistic base price based on symbol
  const basePrice = symbol.includes('BTC') ? 45000 : 
                   symbol.includes('ETH') ? 2500 :
                   symbol === 'AAPL' ? 180 :
                   symbol === 'MSFT' ? 350 :
                   symbol === 'TSLA' ? 200 :
                   Math.random() * 200 + 50;
  
  // Generate market sentiment based on randomization
  const sentiment = Math.random();
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 50 + Math.floor(Math.random() * 30); // 50-80%
  let targetPrice = basePrice;
  
  if (sentiment > 0.6) {
    signal = 'BUY';
    targetPrice = basePrice * (1.02 + Math.random() * 0.03); // 2-5% increase
  } else if (sentiment < 0.4) {
    signal = 'SELL';
    targetPrice = basePrice * (0.95 + Math.random() * 0.03); // 2-5% decrease
  }
  
  // Generate mock technical indicators
  const sma30 = basePrice * (0.98 + Math.random() * 0.04);
  const sma120 = basePrice * (0.96 + Math.random() * 0.08);
  const rsi = 30 + Math.random() * 40; // 30-70 range
  const vwap = basePrice * (0.995 + Math.random() * 0.01);
  
  return {
    signal,
    confidence,
    currentPrice: parseFloat(basePrice.toFixed(2)),
    targetPrice: parseFloat(targetPrice.toFixed(2)),
    priceRange: {
      min: parseFloat((targetPrice * 0.99).toFixed(2)),
      max: parseFloat((targetPrice * 1.01).toFixed(2))
    },
    technicals: {
      sma30: parseFloat(sma30.toFixed(2)),
      sma120: parseFloat(sma120.toFixed(2)),
      rsi: parseFloat(rsi.toFixed(1)),
      vwap: parseFloat(vwap.toFixed(2)),
      priceDeviation: parseFloat(((basePrice - vwap) / vwap * 100).toFixed(2))
    },
    timeframe: '1H',
    timestamp: new Date().toISOString(),
    usingFallback: true,
    message: 'Using simulated forecast data'
  };
}

function generateForecast(prices: Array<{price: number, volume: number, high: number, low: number, timestamp: number}>, symbol: string) {
  if (prices.length < 20) {
    return generateFallbackForecast(symbol);
  }
  
  const currentPrice = prices[prices.length - 1].price;
  
  // Calculate Simple Moving Averages
  const recentPrices = prices.slice(-30).map(p => p.price);
  const longerPrices = prices.slice(-Math.min(120, prices.length)).map(p => p.price);
  
  const sma30 = calculateSMA(recentPrices);
  const sma120 = calculateSMA(longerPrices);
  
  // Calculate RSI
  const rsiPrices = prices.slice(-14).map(p => p.price);
  const rsi = calculateRSI(rsiPrices);
  
  // Calculate VWAP
  const vwap = calculateVWAP(prices);
  const priceDeviation = ((currentPrice - vwap) / vwap) * 100;
  
  // Generate forecast based on technical analysis
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 50;
  let targetPrice = currentPrice;
  
  const smaTrend = ((sma30 - sma120) / sma120) * 100;
  const momentum = ((currentPrice - prices[Math.max(0, prices.length - 10)].price) / prices[Math.max(0, prices.length - 10)].price) * 100;
  
  // Technical analysis logic
  if (sma30 > sma120 && rsi < 70 && momentum > 0) {
    signal = 'BUY';
    confidence = Math.min(85, 50 + Math.abs(smaTrend) * 10 + (momentum > 2 ? 15 : 0));
    targetPrice = currentPrice * (1 + (confidence / 1000));
  } else if (sma30 < sma120 && rsi > 30 && momentum < 0) {
    signal = 'SELL';
    confidence = Math.min(85, 50 + Math.abs(smaTrend) * 10 + (momentum < -2 ? 15 : 0));
    targetPrice = currentPrice * (1 - (confidence / 1000));
  } else {
    // Market uncertainty or sideways movement
    confidence = 40 + Math.random() * 20;
    targetPrice = currentPrice * (0.99 + Math.random() * 0.02);
  }
  
  return {
    signal,
    confidence: Math.round(confidence),
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    targetPrice: parseFloat(targetPrice.toFixed(2)),
    priceRange: {
      min: parseFloat((targetPrice * 0.985).toFixed(2)),
      max: parseFloat((targetPrice * 1.015).toFixed(2))
    },
    technicals: {
      sma30: parseFloat(sma30.toFixed(2)),
      sma120: parseFloat(sma120.toFixed(2)),
      rsi: parseFloat(rsi.toFixed(1)),
      vwap: parseFloat(vwap.toFixed(2)),
      priceDeviation: parseFloat(priceDeviation.toFixed(2))
    },
    timeframe: '1H',
    timestamp: new Date().toISOString(),
    usingFallback: false
  };
}

function calculateSMA(prices: number[]): number {
  if (prices.length === 0) return 0;
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateVWAP(prices: Array<{price: number, volume: number}>): number {
  let totalVolume = 0;
  let totalVolumePrice = 0;
  
  for (const item of prices) {
    if (item.volume > 0) {
      totalVolume += item.volume;
      totalVolumePrice += item.price * item.volume;
    }
  }
  
  return totalVolume > 0 ? totalVolumePrice / totalVolume : prices[prices.length - 1].price;
}
