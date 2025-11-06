# Quick Deploy Script for Play Store Internal Testing
# Al Ansar Masjid App

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Play Store Deployment - Quick Start" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "✗ EAS CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ EAS CLI installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ EAS CLI is installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deployment Steps" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Login to EAS" -ForegroundColor Yellow
Write-Host "   Run: eas login" -ForegroundColor White
Write-Host ""

Write-Host "2. Configure Keystore (First Time Only)" -ForegroundColor Yellow
Write-Host "   Option A (Recommended): Let EAS manage keystore" -ForegroundColor White
Write-Host "     Run: eas credentials" -ForegroundColor Gray
Write-Host "     Select: Android → production → Set up new keystore" -ForegroundColor Gray
Write-Host ""
Write-Host "   Option B: Generate your own keystore" -ForegroundColor White
Write-Host "     Run: .\android\app\generate-keystore.ps1" -ForegroundColor Gray
Write-Host "     Then create: android\keystore.properties" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Build Production AAB" -ForegroundColor Yellow
Write-Host "   Run: eas build --platform android --profile production" -ForegroundColor White
Write-Host "   (This takes 10-20 minutes)" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Download AAB" -ForegroundColor Yellow
Write-Host "   After build completes:" -ForegroundColor White
Write-Host "   Run: eas build:download --platform android --profile production" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Upload to Google Play Console" -ForegroundColor Yellow
Write-Host "   a. Go to: https://play.google.com/console" -ForegroundColor White
Write-Host "   b. Create app (if not exists)" -ForegroundColor White
Write-Host "   c. Testing → Internal testing → Create release" -ForegroundColor White
Write-Host "   d. Upload the downloaded AAB file" -ForegroundColor White
Write-Host "   e. Add release notes and rollout" -ForegroundColor White
Write-Host ""

Write-Host "6. Add Testers" -ForegroundColor Yellow
Write-Host "   a. Testing → Internal testing → Testers" -ForegroundColor White
Write-Host "   b. Create email list and add tester emails" -ForegroundColor White
Write-Host "   c. Share opt-in URL with testers" -ForegroundColor White
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Quick Commands" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Login" -ForegroundColor Gray
Write-Host "eas login" -ForegroundColor White
Write-Host ""
Write-Host "# Build" -ForegroundColor Gray
Write-Host "eas build --platform android --profile production" -ForegroundColor White
Write-Host ""
Write-Host "# Check status" -ForegroundColor Gray
Write-Host "eas build:list" -ForegroundColor White
Write-Host ""
Write-Host "# Download" -ForegroundColor Gray
Write-Host "eas build:download --platform android --profile production" -ForegroundColor White
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Full documentation: PLAY_STORE_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
