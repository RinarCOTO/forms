#!/bin/bash

# Quick Setup Script for Database Connection
# Run this after you update DATABASE_URL in .env file

echo "🚀 Setting up Database Connection"
echo "=================================="
echo ""

# Check if DATABASE_URL is set
if grep -q "prisma+postgres://localhost" .env; then
    echo "⚠️  WARNING: You're still using local database URL"
    echo ""
    echo "Please update .env file with your Supabase connection string:"
    echo "1. Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/database"
    echo "2. Copy the 'Connection string' (URI format)"
    echo "3. Replace DATABASE_URL in .env file"
    echo ""
    echo "After updating, run this script again."
    exit 1
fi

echo "✅ Step 1: Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Step 2: Pushing schema to database..."
npx prisma db push

echo ""
echo "✅ Step 3: Testing connection..."
npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Database is connected!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your dev server: npm run dev"
    echo "2. Try the 'Save to Cloud' button in your form"
    echo "3. Check if data saves successfully"
    echo ""
    echo "To re-enable 'Save to Cloud' button:"
    echo "  Edit: app/rpfaas/building-structure/fill/page.tsx"
    echo "  Change: disabled={true} to disabled={isSaving}"
else
    echo ""
    echo "❌ Connection test failed"
    echo "Please verify your DATABASE_URL in .env file"
fi
