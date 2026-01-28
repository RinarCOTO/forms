#!/bin/bash

# Re-enable "Save to Cloud" button after Supabase setup

echo "🔓 Re-enabling 'Save to Cloud' Button"
echo "======================================"
echo ""

FILE="app/rpfaas/building-structure/fill/page.tsx"

if [ -f "$FILE" ]; then
    # Check if button is currently disabled
    if grep -q "disabled={true}" "$FILE"; then
        echo "✅ Found disabled button, re-enabling..."
        
        # Replace disabled={true} with disabled={isSaving}
        sed -i.bak 's/disabled={true}/disabled={isSaving}/g' "$FILE"
        
        echo "✅ Button re-enabled!"
        echo ""
        echo "Changes made to: $FILE"
        echo "Backup saved to: $FILE.bak"
        echo ""
        echo "Next step: Restart your dev server"
        echo "  npm run dev"
        echo ""
    else
        echo "ℹ️  Button is already enabled or not found"
        echo "No changes needed"
    fi
else
    echo "❌ File not found: $FILE"
    echo "Please check the file path"
fi
