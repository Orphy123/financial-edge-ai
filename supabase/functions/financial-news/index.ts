
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
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
    
    if (!finnhubKey) {
      throw new Error('Finnhub API key not configured');
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    const newsData = await response.json();
    
    const processedNews = newsData.slice(0, 3).map((item: any, index: number) => {
      const sentiments = ['bullish', 'bearish', 'neutral'];
      const impacts = ['high', 'medium', 'low'];
      const symbols = ['US30', 'US100', 'EUR/USD'];
      
      return {
        id: `${index + 1}`,
        title: item.headline || 'Market Update',
        summary: item.summary || 'Latest market developments and analysis.',
        symbol: symbols[index % symbols.length],
        sentiment: sentiments[index % sentiments.length],
        impact: impacts[index % impacts.length],
        timestamp: new Date(item.datetime * 1000).toLocaleString() + ' ago',
        confidence: Math.floor(Math.random() * 30) + 70
      };
    });

    return new Response(JSON.stringify({ data: processedNews }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in financial-news function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
