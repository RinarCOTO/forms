#!/bin/bash

echo "🗄️  Creating Supabase Tables"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Please create .env.local with your Supabase credentials first."
    exit 1
fi

# Check if DATABASE_URL contains YOUR-PASSWORD
if grep -q "YOUR-PASSWORD" .env.local; then
    echo "❌ Please update .env.local with your actual database password!"
    echo ""
    echo "1. Open .env.local"
    echo "2. Replace 'YOUR-PASSWORD' with your Supabase database password"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Environment file found"
echo ""

echo "📦 Generating Prisma client..."
npx prisma generate

echo ""
echo "🚀 Pushing schema to Supabase..."
echo "This will create the following tables:"
echo "  - building_structures"
echo "  - land_improvements"  
echo "  - machinery"
echo ""

npx prisma db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tables created successfully!"
    echo ""
    echo "🎉 Your Supabase database is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Visit your Supabase dashboard: https://supabase.com/dashboard/project/weckxacnhzuzuvjvdyvj"
    echo "2. Go to 'Table Editor' to see your tables"
    echo "3. Start your app: npm run dev"
else
    echo ""
    echo "❌ Failed to create tables"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check your DATABASE_URL in .env.local"
    echo "2. Verify your database password is correct"
    echo "3. Make sure your Supabase project is active"
fi
