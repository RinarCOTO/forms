#!/bin/bash

echo "🔍 Supabase Connection Troubleshooting"
echo "======================================"
echo ""
echo "The direct connection isn't working. Let's try a few things:"
echo ""

# Test 1: Check if Supabase project is paused
echo "📋 Step 1: Check if your Supabase project is active"
echo "   Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj"
echo "   Make sure it says 'Active' and not 'Paused'"
echo ""
read -p "   Is your project Active? (y/n): " IS_ACTIVE

if [ "$IS_ACTIVE" != "y" ] && [ "$IS_ACTIVE" != "Y" ]; then
    echo ""
    echo "⚠️  Your project might be paused!"
    echo "   Go to the dashboard and click 'Restore' or 'Resume'"
    echo "   Then run this script again."
    exit 1
fi

echo ""
echo "📋 Step 2: Get the Session Mode connection string"
echo "   1. Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/database"
echo "   2. Find 'Connection pooling'"
echo "   3. You'll see two modes:"
echo "      - Transaction mode (port 6543)"
echo "      - Session mode (port 5432)"
echo "   4. Copy the 'Session mode' connection string"
echo ""
read -p "   Paste the Session mode connection string: " SESSION_CONN

if [ -n "$SESSION_CONN" ]; then
    echo ""
    echo "✅ Trying Session mode connection..."
    
    # Update .env with session mode
    cat > .env << EOF
# Supabase Database Connection
# Using Session mode for Prisma

DATABASE_URL="$SESSION_CONN"

# Supabase Project Details
SUPABASE_PROJECT_ID="weckxacnhzuzuvjvdyvj"
SUPABASE_URL="https://weckxacnhzuzuvjvdyvj.supabase.co"
EOF
    
    echo "✅ Updated .env with Session mode connection"
    echo ""
    echo "Testing connection..."
    npx prisma db push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! Database connected!"
        echo ""
        echo "Next steps:"
        echo "1. Run: ./enable-cloud-save.sh"
        echo "2. Restart: npm run dev"
        echo "3. Test 'Save to Cloud' button!"
    else
        echo ""
        echo "❌ Still not working. Let's try Transaction mode..."
        echo ""
        read -p "   Paste the Transaction mode connection string: " TRANS_CONN
        
        if [ -n "$TRANS_CONN" ]; then
            # For Next.js app, we can use Transaction mode
            cat > .env << EOF
# Supabase Database Connection  
# Using Transaction mode (works for app usage)

DATABASE_URL="$TRANS_CONN"

# Supabase Project Details
SUPABASE_PROJECT_ID="weckxacnhzuzuvjvdyvj"
SUPABASE_URL="https://weckxacnhzuzuvjvdyvj.supabase.co"
EOF
            
            echo "✅ Updated .env with Transaction mode"
            echo ""
            echo "For Prisma migrations, use this command:"
            echo "DATABASE_URL=\"$SESSION_CONN\" npx prisma db push"
        fi
    fi
else
    echo ""
    echo "ℹ️  No connection string provided"
fi

echo ""
echo "📚 Additional Help:"
echo "   • Make sure project is not paused"
echo "   • Check if you're on a free tier with connection limits"
echo "   • Verify your password is correct"
echo "   • Check Supabase status: https://status.supabase.com"
