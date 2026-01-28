#!/bin/bash

# Add Supabase environment variables to Vercel
# Run this script: ./scripts/add-vercel-env.sh

echo "Adding Supabase environment variables to Vercel..."

# Add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development <<EOF
https://weckxacnhzuzuvjvdyvj.supabase.co
EOF

# Add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development <<EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY2t4YWNuaHp1enV2anZkeXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTYxNjQsImV4cCI6MjA4NTA3MjE2NH0.LuSQvKyMOfgwQKwnrZyw4iVBnQJaVj9nz9E3GIq95H8
EOF

echo "✅ Environment variables added!"
echo "Now redeploy your project: vercel --prod"
