# Set MCP Environment Variables for Claude Code
# Run this script as Administrator (optional) or as current user

Write-Host "Setting MCP Environment Variables for Claude Code..." -ForegroundColor Cyan
Write-Host ""

# PostHog MCP Token
$posthogToken = "phx_jZDleihYFRLpBzEiJyUKWHmZPquYtkwgjs2wVs7Pz59mQEN"
Write-Host "Setting POSTHOG_MCP_TOKEN..." -ForegroundColor Yellow

try {
    [System.Environment]::SetEnvironmentVariable('POSTHOG_MCP_TOKEN', $posthogToken, 'User')
    Write-Host "SUCCESS: POSTHOG_MCP_TOKEN set successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to set POSTHOG_MCP_TOKEN: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Environment variables have been set!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: You must restart Claude Desktop for changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "Verification:" -ForegroundColor Cyan
Write-Host "  POSTHOG_MCP_TOKEN = $posthogToken"
Write-Host ""
