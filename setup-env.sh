#!/bin/bash

# Financial Edge AI - Environment Setup Script
# This script helps you set up the required environment variables

echo "🚀 Financial Edge AI - Environment Setup"
echo "========================================"
echo

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Create root .env file
echo "📝 Creating root .env file..."
cat > .env << EOF
# Frontend Environment Variables
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Keys for Edge Functions
FINNHUB_API_KEY=your_finnhub_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
EOF

# Create supabase directory if it doesn't exist
mkdir -p supabase

# Check if supabase/.env already exists
if [ -f "supabase/.env" ]; then
    echo "⚠️  supabase/.env file already exists. Backing up to supabase/.env.backup"
    cp supabase/.env supabase/.env.backup
fi

# Create supabase .env file
echo "📝 Creating supabase/.env file..."
cat > supabase/.env << EOF
# Production Environment Variables for Supabase Edge Functions
FINNHUB_API_KEY=your_finnhub_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
EOF

# Create supabase .env.local file for local development
echo "📝 Creating supabase/.env.local file..."
cat > supabase/.env.local << EOF
# Local Development Environment Variables
FINNHUB_API_KEY=your_finnhub_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
EOF

echo
echo "✅ Environment files created successfully!"
echo
echo "📋 Next Steps:"
echo "1. Edit the .env files and replace placeholder values with your actual API keys"
echo "2. Get your Finnhub API key from: https://finnhub.io/"
echo "3. Get your OpenAI API key from: https://platform.openai.com/"
echo "4. Get your Supabase URL and keys from your Supabase dashboard"
echo
echo "🔐 Set production secrets:"
echo "   supabase secrets set --env-file ./supabase/.env"
echo
echo "🚀 Start local development:"
echo "   supabase functions serve --env-file ./supabase/.env.local"
echo
echo "📖 Read the API_SETUP_GUIDE.md for detailed instructions"
echo
echo "⚠️  Remember: Never commit .env files to version control!" 