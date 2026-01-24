# Add Supabase and PostHog MCPs to Claude Desktop Configuration
# This script modifies the project-level Claude settings to enable MCP servers

Write-Host "Adding Supabase and PostHog MCPs to Claude Desktop..." -ForegroundColor Cyan
Write-Host ""

# Path to Claude configuration for this project
$claudeConfigPath = "$env:USERPROFILE\.claude.json"
$projectPath = "D:\\Vasso\\coding projects\\SCL v3 AG\\scl-v3"

Write-Host "Reading Claude configuration from: $claudeConfigPath" -ForegroundColor Yellow

# Read the current configuration
try {
    $configContent = Get-Content -Path $claudeConfigPath -Raw | ConvertFrom-Json
} catch {
    Write-Host "ERROR: Failed to read Claude configuration: $_" -ForegroundColor Red
    exit 1
}

# Ensure the project exists in the configuration
if (-not $configContent.projects) {
    $configContent | Add-Member -NotePropertyName "projects" -NotePropertyValue @{} -Force
}

if (-not $configContent.projects.$projectPath) {
    $configContent.projects | Add-Member -NotePropertyName $projectPath -NotePropertyValue @{
        allowedTools = @()
        mcpContextUris = @()
        enabledMcpjsonServers = @()
        disabledMcpjsonServers = @()
        hasTrustDialogAccepted = $true
        projectOnboardingSeenCount = 0
        hasClaudeMdExternalIncludesApproved = $false
        hasClaudeMdExternalIncludesWarningShown = $false
    } -Force
}

# Get the project configuration
$projectConfig = $configContent.projects.$projectPath

# Add MCP servers to enabledMcpjsonServers if not already present
$mcpServersToAdd = @("supabase", "posthog")

Write-Host "Current enabled MCP servers: $($projectConfig.enabledMcpjsonServers -join ', ')" -ForegroundColor Gray

foreach ($serverName in $mcpServersToAdd) {
    if ($projectConfig.enabledMcpjsonServers -notcontains $serverName) {
        $projectConfig.enabledMcpjsonServers += $serverName
        Write-Host "  [+] Added: $serverName" -ForegroundColor Green
    } else {
        Write-Host "  [~] Already enabled: $serverName" -ForegroundColor Yellow
    }
}

# Remove from disabled list if present
foreach ($serverName in $mcpServersToAdd) {
    if ($projectConfig.disabledMcpjsonServers -contains $serverName) {
        $projectConfig.disabledMcpjsonServers = $projectConfig.disabledMcpjsonServers | Where-Object { $_ -ne $serverName }
        Write-Host "  [-] Removed from disabled: $serverName" -ForegroundColor Green
    }
}

# Save the updated configuration
try {
    $configContent | ConvertTo-Json -Depth 10 | Set-Content -Path $claudeConfigPath -Force
    Write-Host ""
    Write-Host "SUCCESS: Configuration updated successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to save configuration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Updated enabled MCP servers: $($projectConfig.enabledMcpjsonServers -join ', ')" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Restart Claude Desktop for changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "The following MCPs should now be available:" -ForegroundColor Cyan
Write-Host "  - supabase: https://mcp.supabase.com/mcp?project_ref=nwhvkhydryulgxobqioi" -ForegroundColor Gray
Write-Host "  - posthog: OAuth via mcp-remote (https://mcp.posthog.com/sse)" -ForegroundColor Gray
Write-Host ""
