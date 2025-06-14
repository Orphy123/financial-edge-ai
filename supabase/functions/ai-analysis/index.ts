
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
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const symbolList = symbols || ['US30', 'US100', 'EUR/USD'];
    const analyses = [];

    for (const symbol of symbolList) {
      const prompt = `Provide a brief trading analysis for ${symbol}. Include:
      1. A recommendation (BUY/SELL/HOLD)
      2. Confidence level (60-95)
      3. 3-4 bullet points of rationale
      4. ML prediction (BUY/SELL)
      5. ML confidence (55-95)
      6. Risk level (LOW/MEDIUM/HIGH)
      
      Keep it concise and professional. Format as JSON with keys: recommendation, confidence, rationale (array), mlPrediction, mlConfidence, riskLevel`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a professional financial analyst providing trading insights.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        try {
          const analysisData = JSON.parse(aiResponse);
          analyses.push({
            symbol,
            recommendation: analysisData.recommendation || 'HOLD',
            confidence: analysisData.confidence || 75,
            rationale: analysisData.rationale || ['Analysis in progress'],
            mlPrediction: analysisData.mlPrediction || 'HOLD',
            mlConfidence: analysisData.mlConfidence || 70,
            timeframe: '24h analysis',
            riskLevel: analysisData.riskLevel || 'MEDIUM'
          });
        } catch (parseError) {
          console.error('Failed to parse AI response for', symbol, parseError);
          // Fallback analysis
          analyses.push({
            symbol,
            recommendation: 'HOLD',
            confidence: 75,
            rationale: ['Market analysis in progress', 'Awaiting clearer signals'],
            mlPrediction: 'HOLD',
            mlConfidence: 70,
            timeframe: '24h analysis',
            riskLevel: 'MEDIUM'
          });
        }
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
      }
    }

    return new Response(JSON.stringify({ data: analyses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
