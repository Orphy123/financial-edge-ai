
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
    const twelveDataKey = Deno.env.get('TWELVEDATA_API_KEY');
    
    if (!twelveDataKey) {
      throw new Error('TwelveData API key not configured');
    }

    // Get 24h of 1-minute data for forecasting
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&outputsize=1440&apikey=${twelveDataKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message);
    }

    const prices = data.values?.map((item: any) => ({
      price: parseFloat(item.close),
      volume: parseInt(item.volume || 0),
      high: parseFloat(item.high),
      low: parseFloat(item.low)
    })).reverse() || [];

    if (prices.length < 120) {
      throw new Error('Insufficient data for forecasting');
    }

    const forecast = generateForecast(prices);

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in forecast function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateForecast(prices: Array<{price: number, volume: number, high: number, low: number}>) {
  const currentPrice = prices[prices.length - 1].price;
  
  // Calculate Simple Moving Averages
  const sma30 = calculateSMA(prices.slice(-30).map(p => p.price));
  const sma120 = calculateSMA(prices.slice(-120).map(p => p.price));
  
  // Calculate RSI
  const rsi = calculateRSI(prices.slice(-14).map(p => p.price));
  
  // Calculate VWAP for 24h
  const vwap = calculateVWAP(prices);
  const priceDeviation = ((currentPrice - vwap) / vwap) * 100;
  
  // Heuristic classification
  let signal = 'HOLD';
  let confidence = 50;
  let targetPrice = currentPrice;
  let priceRange = { min: currentPrice * 0.98, max: currentPrice * 1.02 };
  
  const smaDiff = ((sma30 - sma120) / sma120) * 100;
  
  if (sma30 > sma120 && rsi < 60) {
    signal = 'BUY';
    confidence = Math.min(90, 40 + Math.abs(smaDiff) * 100);
    targetPrice = currentPrice * (1 + (confidence / 1000));
    priceRange = { 
      min: currentPrice * 1.005, 
      max: currentPrice * (1 + (confidence / 500))
    };
  } else if (sma30 < sma120 && rsi > 40) {
    signal = 'SELL';
    confidence = Math.min(90, 40 + Math.abs(smaDiff) * 100);
    targetPrice = currentPrice * (1 - (confidence / 1000));
    priceRange = { 
      min: currentPrice * (1 - (confidence / 500)), 
      max: currentPrice * 0.995
    };
  }
  
  return {
    signal,
    confidence: Math.round(confidence),
    currentPrice,
    targetPrice: Math.round(targetPrice * 100) / 100,
    priceRange: {
      min: Math.round(priceRange.min * 100) / 100,
      max: Math.round(priceRange.max * 100) / 100
    },
    technicals: {
      sma30: Math.round(sma30 * 100) / 100,
      sma120: Math.round(sma120 * 100) / 100,
      rsi: Math.round(rsi * 100) / 100,
      vwap: Math.round(vwap * 100) / 100,
      priceDeviation: Math.round(priceDeviation * 100) / 100
    },
    timeframe: '1H',
    timestamp: new Date().toISOString()
  };
}

function calculateSMA(prices: number[]): number {
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
    totalVolume += item.volume;
    totalVolumePrice += item.price * item.volume;
  }
  
  return totalVolume > 0 ? totalVolumePrice / totalVolume : prices[prices.length - 1].price;
}
