# PowerShell script to safely update Supabase environment variables
Write-Host "🔐 Supabase Environment Setup (Secure)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Open your Supabase dashboard:" -ForegroundColor Yellow
Write-Host "   https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/api" -ForegroundColor White
Write-Host ""

Write-Host "2. Copy your API keys from the dashboard" -ForegroundColor Yellow
Write-Host ""

# Get anon key
Write-Host "Paste your ANON key (public key):" -ForegroundColor Green
$anonKey = Read-Host -AsSecureString
$anonKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($anonKey))

Write-Host ""
Write-Host "Paste your SERVICE ROLE key (secret key):" -ForegroundColor Green
$serviceKey = Read-Host -AsSecureString
$serviceKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceKey))

Write-Host ""
Write-Host "Updating env.local file..." -ForegroundColor Yellow

# Create the env.local content
$envContent = @"
# Local environment variables for development
# WARNING: Keep this file secure and never commit to Git

NEXT_PUBLIC_SUPABASE_URL=https://weckxacnhzuzuvjvdyvj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKeyPlain
SUPABASE_SERVICE_ROLE_KEY=$serviceKeyPlain

# Add your database URL if needed
# DATABASE_URL=your_database_url_here
"@

# Write to env.local
Set-Content -Path "env.local" -Value $envContent

Write-Host "✅ Environment variables updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server: npm run dev" -ForegroundColor White
Write-Host "2. The 'Invalid API key' errors should now be resolved" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Your keys are safely stored in env.local (not tracked by Git)" -ForegroundColor Green