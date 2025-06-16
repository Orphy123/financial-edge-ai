import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      throw new Error('Invalid request body');
    }

    const { message, symbol, context } = body;

    // Validate required fields
    if (!message) {
      throw new Error('Message is required');
    }

    // Get and validate OpenAI API key
    const openaiKey = Deno.env.get('VITE_OPENAI_API_KEY');
    console.log('OpenAI API key present:', !!openaiKey);
    
    if (!openaiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are a professional financial analyst and trading assistant. You provide expert analysis on financial markets, stocks, and trading strategies. 

Current focus: ${symbol || 'General Markets'}

Key guidelines:
- Provide actionable insights based on technical and fundamental analysis
- Be clear about risk factors and market conditions
- Use specific terminology but explain complex concepts
- Always remind users that this is not financial advice
- Be concise but informative
- Reference current market trends when relevant

When discussing ${symbol}, consider:
- Recent price movements and trends
- Technical indicators and chart patterns
- Market sentiment and news impact
- Risk-reward ratios
- Support and resistance levels`
      }
    ];

    // Add conversation context
    if (context && Array.isArray(context) && context.length > 0) {
      console.log('Adding conversation context:', context);
      context.slice(-4).forEach((msg: any) => {
        if (msg && typeof msg === 'object' && 'type' in msg && 'content' in msg) {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('Sending request to OpenAI API with messages:', messages);
    
    const openaiRequest = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      }),
    };
    
    console.log('OpenAI request config:', {
      ...openaiRequest,
      headers: {
        ...openaiRequest.headers,
        'Authorization': 'Bearer [REDACTED]'
      }
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', openaiRequest);

    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response data:', data);
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('Successfully received response from OpenAI API');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorResponse = {
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    };
    console.error('Sending error response:', errorResponse);
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
