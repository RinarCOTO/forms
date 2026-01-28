#!/bin/bash

# Supabase Database Setup Script
# This script will help you connect to your Supabase database

echo "🚀 Supabase Database Setup"
echo "=========================="
echo ""
echo "Your Supabase Project: weckxacnhzuzuvjvdyvj"
echo ""

# Step 1: Get the database password
echo "📝 Step 1: Get Your Database Password"
echo "--------------------------------------"
echo "1. Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/database"
echo "2. Under 'Database Settings', find your database password"
echo "   (If you forgot it, you can reset it on the same page)"
echo ""
read -p "Enter your Supabase database password: " DB_PASSWORD
echo ""

# Step 2: Get connection string format
echo "📝 Step 2: Building Connection String"
echo "--------------------------------------"

# Supabase connection string format for pooler (recommended for serverless)
CONNECTION_POOLING="postgresql://postgres.weckxacnhzuzuvjvdyvj:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (for migrations)
DIRECT_CONNECTION="postgresql://postgres.weckxacnhzuzuvjvdyvj:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

echo "✅ Connection strings generated"
echo ""

# Step 3: Update .env file
echo "📝 Step 3: Updating .env File"
echo "--------------------------------------"

# Backup existing .env
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ Backed up existing .env to .env.backup"
fi

# Update or create .env
cat > .env << EOF
# Supabase Database Connection
# Generated on $(date)

# Connection pooling (for app usage - recommended for Next.js)
DATABASE_URL="${CONNECTION_POOLING}"

# Direct connection (for Prisma migrations)
DIRECT_URL="${DIRECT_CONNECTION}"

# Supabase Project Details
SUPABASE_PROJECT_ID="weckxacnhzuzuvjvdyvj"
SUPABASE_URL="https://weckxacnhzuzuvjvdyvj.supabase.co"

# Note: Keep your .env.local for NEXT_PUBLIC variables
EOF

echo "✅ Updated .env file with Supabase connection"
echo ""

# Step 4: Generate Prisma Client
echo "📝 Step 4: Generating Prisma Client"
echo "--------------------------------------"
npx prisma generate
echo ""

# Step 5: Push schema to Supabase
echo "📝 Step 5: Creating Tables in Supabase"
echo "--------------------------------------"
echo "This will create the following tables in your Supabase database:"
echo "  • building_structures"
echo "  • land_improvements"
echo "  • machinery"
echo ""
read -p "Continue? (y/n): " CONTINUE

if [ "$CONTINUE" = "y" ] || [ "$CONTINUE" = "Y" ]; then
    npx prisma db push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Tables created successfully in Supabase!"
        echo ""
        
        # Step 6: Test connection
        echo "📝 Step 6: Testing Connection"
        echo "--------------------------------------"
        npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Connection test successful!"
            echo ""
            echo "🎉 SUCCESS! Your database is fully set up!"
            echo ""
            echo "Next steps:"
            echo "1. Restart your dev server: npm run dev"
            echo "2. Re-enable 'Save to Cloud' button:"
            echo "   • Edit: app/rpfaas/building-structure/fill/page.tsx"
            echo "   • Find: disabled={true}"
            echo "   • Change to: disabled={isSaving}"
            echo "3. Test saving to cloud!"
            echo ""
            echo "You can now:"
            echo "  • Save forms to Supabase"
            echo "  • Access data from Supabase dashboard"
            echo "  • View tables at: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/editor"
            echo ""
        else
            echo "⚠️  Connection test failed"
            echo "Please check your password and try again"
        fi
    else
        echo ""
        echo "❌ Failed to push schema to database"
        echo "Please check the error above and try again"
    fi
else
    echo "Setup cancelled"
fi
