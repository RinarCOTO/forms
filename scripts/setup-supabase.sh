#!/bin/bash

# Supabase Setup Script
# This script helps you quickly set up Supabase for your project

echo "🚀 Supabase Setup Script"
echo "========================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Create .env.local from example
if [ -f .env.local.example ]; then
    cp .env.local.example .env.local
    echo "✅ Created .env.local from template"
else
    echo "❌ .env.local.example not found!"
    exit 1
fi

echo ""
echo "📝 Please provide your Supabase credentials:"
echo "(You can find these in your Supabase Dashboard > Settings > API)"
echo ""

# Get Supabase URL
read -p "Enter your Supabase Project URL: " supabase_url
if [ -z "$supabase_url" ]; then
    echo "❌ URL cannot be empty"
    exit 1
fi

# Get Supabase Anon Key
read -p "Enter your Supabase Anon Key: " supabase_anon_key
if [ -z "$supabase_anon_key" ]; then
    echo "❌ Anon key cannot be empty"
    exit 1
fi

# Get Database URL
echo ""
echo "(You can find this in Supabase Dashboard > Settings > Database > Connection string)"
read -p "Enter your Database URL: " database_url
if [ -z "$database_url" ]; then
    echo "❌ Database URL cannot be empty"
    exit 1
fi

# Update .env.local with actual values
sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$supabase_url|g" .env.local
sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabase_anon_key|g" .env.local
sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$database_url|g" .env.local
sed -i.bak "s|DIRECT_URL=.*|DIRECT_URL=$database_url|g" .env.local

# Remove backup file
rm .env.local.bak

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database schema..."
npx prisma generate
npx prisma db push

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Visit http://localhost:3000"
echo "3. Try accessing /signup to create an account"
echo ""
echo "📚 For more details, see SUPABASE_SETUP.md"
