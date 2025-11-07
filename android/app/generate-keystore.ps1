# Script to generate Android upload keystore
# Run this script to create a production keystore for Play Store deployment

Write-Host "Generating Android Upload Keystore..." -ForegroundColor Green
Write-Host ""
Write-Host "You will be prompted for the following information:" -ForegroundColor Yellow
Write-Host "  - Keystore password (remember this!)"
Write-Host "  - Key alias: use 'upload' or your preferred alias"
Write-Host "  - Key password (can be the same as keystore password)"
Write-Host "  - Your name and organization details"
Write-Host ""

$keystorePath = "$PSScriptRoot\upload-keystore.keystore"

keytool -genkeypair -v `
  -storetype PKCS12 `
  -keystore $keystorePath `
  -alias upload `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Keystore generated successfully at: $keystorePath" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Keep the following information secure:" -ForegroundColor Red
    Write-Host "  1. Keystore file: android/app/upload-keystore.keystore"
    Write-Host "  2. Keystore password"
    Write-Host "  3. Key alias: upload"
    Write-Host "  4. Key password"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Create android/keystore.properties with your credentials"
    Write-Host "  2. Add keystore.properties to .gitignore"
    Write-Host "  3. Configure build.gradle to use the keystore"
} else {
    Write-Host ""
    Write-Host "✗ Failed to generate keystore" -ForegroundColor Red
    Write-Host "Make sure Java keytool is installed and in your PATH"
}
