#!/bin/bash

# 🚀 Quick Deploy Script for Vercel
# This script helps you deploy to an existing Vercel project

echo "🚀 RPFAAS Forms - Vercel Deployment Script"
echo "=========================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed."
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
    echo ""
fi

# Check if project is linked
if [ ! -d ".vercel" ]; then
    echo "🔗 Project not linked to Vercel."
    echo "📝 Let's link it now..."
    vercel link
    echo ""
fi

# Ask for deployment type
echo "Choose deployment type:"
echo "1. Production (live site)"
echo "2. Preview (testing)"
echo ""
read -p "Enter choice (1 or 2): " choice

echo ""
echo "🔍 Pre-deployment checks..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "Make sure environment variables are set in Vercel Dashboard"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Build locally to check for errors
echo "🔨 Building project locally..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo ""
echo "✅ Local build successful!"
echo ""

# Deploy based on choice
if [ "$choice" == "1" ]; then
    echo "🚀 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "🚀 Deploying to PREVIEW..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Test your deployment URL"
echo "   2. Create a user account at /signup"
echo "   3. Test authentication and forms"
echo ""
echo "🔗 Useful commands:"
echo "   vercel logs          - View deployment logs"
echo "   vercel open          - Open project in browser"
echo "   vercel env pull      - Pull environment variables"
echo ""
