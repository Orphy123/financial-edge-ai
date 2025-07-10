# API Configuration Setup Guide

## Problem
Your application is showing "Using simulated historical data - API limits reached" because the required API keys are not configured for the Supabase Edge Functions.

## Solution

### Step 1: Create Environment Files

1. **Create `.env` file in project root:**
```bash
# Frontend Environment Variables
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Keys for Edge Functions
FINNHUB_API_KEY=your_finnhub_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

2. **Create `supabase/.env` file:**
```bash
# Production Environment Variables for Supabase Edge Functions
FINNHUB_API_KEY=your_finnhub_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Create `supabase/.env.local` file for local development:**
```bash
# Local Development Environment Variables
FINNHUB_API_KEY=your_finnhub_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 2: Get API Keys

#### Finnhub API Key
1. Go to https://finnhub.io/
2. Sign up for a free account
3. Go to your dashboard and copy your API key
4. Free tier includes 60 API calls per minute

#### OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (you won't see it again)

### Step 3: Configure Supabase Environment Variables

#### For Local Development:
```bash
# Serve functions with environment file
supabase functions serve --env-file ./supabase/.env.local
```

#### For Production:
```bash
# Set secrets in Supabase
supabase secrets set --env-file ./supabase/.env

# Or set individually
supabase secrets set FINNHUB_API_KEY=your_actual_key_here
supabase secrets set OPENAI_API_KEY=your_actual_key_here
```

#### Verify secrets are set:
```bash
supabase secrets list
```

### Step 4: Deploy Updated Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy market-data
```

### Step 5: Test the Configuration

After setting up the API keys, your application should:
- Show real market data instead of simulated data
- No longer display "API limits reached" message
- Return actual stock prices and historical data

### Troubleshooting

1. **Still seeing simulated data?**
   - Check that API keys are correctly set: `supabase secrets list`
   - Verify API keys are valid by testing them directly
   - Check the browser console for any error messages

2. **500 errors from Edge Functions?**
   - Check the Supabase function logs in your dashboard
   - Ensure all environment variables are set correctly
   - Make sure you've deployed the functions after setting secrets

3. **API rate limits reached?**
   - Finnhub free tier has 60 calls/minute limit
   - Consider upgrading to a paid plan for higher limits
   - Implement caching to reduce API calls

### What Each Function Does

- **market-data**: Fetches real-time stock prices and historical data from Finnhub
- **financial-news**: Gets financial news from Finnhub
- **forecast**: Generates price forecasts using historical data
- **ai-analysis**: Provides AI-powered market analysis using OpenAI
- **ai-chat**: Handles AI chat functionality

### API Key Security

- Never commit `.env` files to version control
- Use different API keys for development and production
- Monitor your API usage to avoid unexpected charges
- Rotate API keys periodically 