#!/bin/bash

echo "🔑 Getting Supabase Connection String"
echo "======================================"
echo ""
echo "Follow these steps to get the EXACT connection string:"
echo ""
echo "1. Open this URL in your browser:"
echo "   https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/database"
echo ""
echo "2. Scroll down to find the 'Connection string' section"
echo ""
echo "3. You'll see several tabs. Click on 'URI'"
echo ""
echo "4. Copy the ENTIRE connection string shown there"
echo "   It will look something like:"
echo "   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
echo "   OR"
echo "   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres"
echo ""
echo "5. Paste it below (we'll encode the password automatically):"
echo ""
read -p "Paste your Supabase connection string here: " CONN_STRING
echo ""

# Extract password from connection string
if [[ $CONN_STRING =~ postgres://([^:]+):([^@]+)@(.+) ]]; then
    USERNAME="${BASH_REMATCH[1]}"
    PASSWORD="${BASH_REMATCH[2]}"
    HOST_AND_REST="${BASH_REMATCH[3]}"
    
    echo "✅ Extracted credentials:"
    echo "   Username: $USERNAME"
    echo "   Password: $PASSWORD (will be URL-encoded)"
    echo "   Host: $HOST_AND_REST"
    echo ""
    
    # URL encode the password
    ENCODED_PASSWORD=$(node -e "console.log(encodeURIComponent('$PASSWORD'))")
    
    # Rebuild connection string with encoded password
    NEW_CONN_STRING="postgresql://${USERNAME}:${ENCODED_PASSWORD}@${HOST_AND_REST}"
    
    echo "✅ Properly formatted connection string:"
    echo ""
    echo "DATABASE_URL=\"$NEW_CONN_STRING\""
    echo ""
    
    # Update .env file
    read -p "Update .env file now? (y/n): " UPDATE
    
    if [ "$UPDATE" = "y" ] || [ "$UPDATE" = "Y" ]; then
        # Backup existing .env
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        
        # Update DATABASE_URL
        if grep -q "DATABASE_URL=" .env; then
            # Replace existing
            sed -i.tmp "s|DATABASE_URL=.*|DATABASE_URL=\"$NEW_CONN_STRING\"|" .env
            rm .env.tmp
        else
            # Add new
            echo "" >> .env
            echo "DATABASE_URL=\"$NEW_CONN_STRING\"" >> .env
        fi
        
        echo ""
        echo "✅ .env file updated!"
        echo ""
        echo "Next step: Test the connection"
        echo "Run: npx prisma db push"
    fi
else
    echo "❌ Could not parse connection string"
    echo "Please make sure you copied the entire URI from Supabase"
fi
