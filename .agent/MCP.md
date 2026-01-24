# MCP (Model Context Protocol) Configuration

## Overview

StepCountLeague v3 uses Model Context Protocol (MCP) to enable AI agents to interact with external services and tools. This document describes all configured MCP servers, their authentication methods, and usage patterns.

## Configured MCP Servers

### 1. Supabase MCP
**Purpose:** Direct database access for AI agents

- **Type:** HTTP Remote
- **Endpoint:** `https://mcp.supabase.com/mcp?project_ref=nwhvkhydryulgxobqioi`
- **Authentication:** Project reference in URL (read-only), or `SUPABASE_MCP_ACCESS_TOKEN` for write operations
- **Status:** ✅ Active
- **Configuration Files:** `.mcp.json`, `.vscode/mcp.json`

**Capabilities:**
- Query database tables
- Run SELECT statements
- View schema information
- Execute stored procedures (with service role key)

**Official Documentation:** https://supabase.com/docs/guides/getting-started/mcp

---

### 2. PostHog MCP
**Purpose:** Analytics data access and querying

- **Type:** stdio via mcp-remote
- **Endpoint:** `https://mcp.posthog.com/sse`
- **Authentication:** OAuth via browser popup (first use)
- **Status:** ✅ Active
- **Configuration Files:** `.mcp.json`, `.vscode/mcp.json`

**Capabilities:**
- Query events and user data
- Analyze funnels and trends
- Access session replays metadata
- Retrieve feature flag configurations

**Authentication Flow:**
1. First use triggers browser OAuth popup
2. Sign in with PostHog account
3. Credentials cached for future sessions

**Official Documentation:** https://posthog.com/docs/model-context-protocol

---

### 3. Google Tag Manager MCP
**Purpose:** GTM container management and tag configuration

- **Type:** stdio via mcp-remote
- **Endpoint:** `https://gtm-mcp.stape.ai/mcp`
- **Authentication:** Google OAuth (browser popup on first use)
- **Provider:** Stape.io
- **Status:** ✅ Active
- **Configuration Files:** `.mcp.json`, `.vscode/mcp.json`

**GTM Container ID:** `GTM-MB2BNBH2` (informational, not used for auth)

**Capabilities:**
- List GTM containers and workspaces
- View tags, triggers, and variables
- Query tag configuration
- Analyze dataLayer events

**Authentication Flow:**
1. First use triggers browser OAuth popup
2. Sign in with Google account that has GTM access
3. Credentials cached for future sessions

**Official Documentation:** https://stape.io/helpdesk/documentation/how-to-set-up-mcp-server-for-gtm

---

### 4. Google Analytics 4 MCP
**Purpose:** GA4 data querying and reporting

- **Type:** stdio via mcp-remote
- **Endpoint:** `https://mcp-ga.stape.ai/mcp`
- **Authentication:** Google OAuth (browser popup on first use)
- **Provider:** Stape.io
- **Status:** ✅ Active
- **Configuration Files:** `.mcp.json`, `.vscode/mcp.json`

**GA4 Measurement ID:** `G-FREXL0RBLB` (informational, not used for auth)

**Capabilities:**
- Run GA4 reports
- Query dimensions and metrics
- Analyze user behavior
- Access real-time data

**Authentication Flow:**
1. First use triggers browser OAuth popup
2. Sign in with Google account that has GA4 access
3. Credentials cached for future sessions

**Official Documentation:** https://stape.io/helpdesk/documentation/how-to-set-up-mcp-server-for-ga4

---

### 5. Playwright MCP
**Purpose:** Browser automation and testing

- **Type:** stdio via npx
- **Command:** `npx -y @executeautomation/playwright-mcp-server`
- **Authentication:** None required (local tool)
- **Provider:** ExecuteAutomation (enhanced community version)
- **Status:** ✅ Active
- **Configuration Files:** `.mcp.json`, `.vscode/mcp.json`

**Capabilities:**
- Browser automation (Chromium, Firefox, WebKit)
- Device emulation (mobile, tablet)
- Screenshot capture
- DOM inspection
- Network monitoring

**Why ExecuteAutomation version:**
- Enhanced device emulation support
- Additional mobile testing features
- Community-maintained with active updates

**Alternative:** Microsoft's official `@playwright/mcp` also available

**Official Documentation:** https://github.com/executeautomation/mcp-playwright

---

## Configuration Files

### Primary Configuration: `.mcp.json`
**Location:** `D:\Vasso\coding projects\SCL v3 AG\scl-v3\.mcp.json`
**Purpose:** Claude Code MCP server configuration
**Format:** JSON with environment variable substitution

**Key Features:**
- Environment variable support: `${VAR_NAME}` or `${VAR_NAME:-default}`
- Both HTTP and stdio server types
- Server descriptions for clarity
- Git-safe (no hardcoded secrets)

### VS Code Configuration: `.vscode/mcp.json`
**Location:** `D:\Vasso\coding projects\SCL v3 AG\scl-v3\.vscode\mcp.json`
**Purpose:** VS Code MCP extension compatibility
**Status:** Maintained separately for backward compatibility

---

## Environment Variables

All MCP-related credentials are stored in `.env.local`:

```env
# Supabase MCP
SUPABASE_MCP_ACCESS_TOKEN=sbp_xxx...

# PostHog MCP (different token format than app token)
POSTHOG_MCP_TOKEN=phx_xxx...

# OAuth-based (no env vars needed)
# - Google Tag Manager MCP
# - Google Analytics 4 MCP

# Local tool (no auth needed)
# - Playwright MCP
```

**Security Notes:**
- `.env.local` is gitignored
- Never commit tokens to version control
- PostHog has separate tokens for app (`phc_`) and MCP (`phx_`)
- Supabase token is optional (project_ref provides read-only access)

---

## Verification & Testing

### Check MCP Server Status
In Claude Code CLI:
```bash
/mcp
```
This lists all configured servers and their connection status.

### Test Individual Servers

**Supabase:**
```typescript
// Use ToolSearch to load Supabase MCP
// Query: "select:mcp__supabase__..."
// Test with: SELECT * FROM profiles LIMIT 5
```

**PostHog:**
```typescript
// Use ToolSearch to load PostHog MCP
// Test with: Query events from last 24 hours
```

**Playwright:**
```typescript
// Use ToolSearch to load Playwright tools
// Test with: Navigate to https://example.com
```

---

## Troubleshooting

### Common Issues

#### MCP Server Not Listed
1. Check `.mcp.json` syntax (valid JSON)
2. Verify environment variables in `.env.local`
3. Restart Claude Code CLI
4. Run `/mcp` to refresh server list

#### Authentication Failures

**PostHog:**
- Verify `POSTHOG_MCP_TOKEN` is set in `.env.local`
- Ensure token starts with `phx_` (not `phc_`)
- Generate new token at https://app.posthog.com/settings/user-api-keys

**GTM/GA4:**
- Browser OAuth popup may be blocked - check popup blocker
- Ensure Google account has access to GTM/GA4 properties
- Clear cached credentials and re-authenticate

**Supabase:**
- Project reference `nwhvkhydryulgxobqioi` must be correct
- For write operations, verify `SUPABASE_MCP_ACCESS_TOKEN`

#### npx Command Failures
```bash
# Verify npx is available
where npx
# Should return: C:\Program Files\nodejs\npx.cmd

# Clear npx cache
npx clear-npx-cache

# Test manual execution
npx -y @executeautomation/playwright-mcp-server
```

#### Windows-Specific Issues
- Use forward slashes in paths (not backslashes)
- Ensure npx.cmd is in PATH
- Default browser must be configured for OAuth flows
- Check Windows Firewall isn't blocking npx

---

## Adding New MCP Servers

### Step 1: Choose Server Type

**HTTP Server:**
```json
{
  "server-name": {
    "type": "http",
    "url": "https://example.com/mcp",
    "headers": {
      "Authorization": "Bearer ${TOKEN_NAME}"
    },
    "description": "Server description"
  }
}
```

**stdio Server (npx):**
```json
{
  "server-name": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "package-name"],
    "description": "Server description"
  }
}
```

### Step 2: Add to `.mcp.json`
Edit `D:\Vasso\coding projects\SCL v3 AG\scl-v3\.mcp.json`

### Step 3: Add Environment Variables
If needed, update `.env.local`:
```env
# New MCP Server
# Description of what it does
SERVER_TOKEN=xxx...
```

### Step 4: Document
Add server details to this file (`.agent/MCP.md`)

### Step 5: Test
```bash
/mcp  # Verify server appears
# Use ToolSearch to load and test
```

---

## Best Practices

### Security
- ✅ Use environment variables for all tokens
- ✅ Never commit `.env.local` to git
- ✅ Rotate tokens periodically
- ✅ Use minimal permissions (read-only when possible)
- ✅ Keep separate tokens for dev/staging/production

### Performance
- ✅ Use mcp-remote for OAuth-based servers (faster initialization)
- ✅ Cache OAuth credentials persist across sessions
- ✅ stdio servers are spawned on-demand (low overhead when unused)

### Maintenance
- ✅ Document all servers in this file
- ✅ Keep `.mcp.json` and `.vscode/mcp.json` in sync for common servers
- ✅ Test servers after adding/updating
- ✅ Update version pins for stability (e.g., `mcp-remote@0.1.30`)

---

## References

### Official MCP Resources
- **MCP Specification:** https://spec.modelcontextprotocol.io/
- **Claude Code MCP Docs:** https://docs.anthropic.com/en/docs/claude-code/mcp

### Configured Server Documentation
- **Supabase MCP:** https://supabase.com/docs/guides/getting-started/mcp
- **PostHog MCP:** https://posthog.com/docs/model-context-protocol
- **Stape GTM MCP:** https://stape.io/helpdesk/documentation/how-to-set-up-mcp-server-for-gtm
- **Stape GA4 MCP:** https://stape.io/helpdesk/documentation/how-to-set-up-mcp-server-for-ga4
- **Playwright MCP:** https://github.com/executeautomation/mcp-playwright

### Community Resources
- **MCP Registry:** https://mcp.directory/
- **Awesome MCP Servers:** https://github.com/punkpeye/awesome-mcp-servers

---

## Changelog

### 2026-01-24 - Initial MCP Setup
- Created `.mcp.json` with 5 MCP servers
- Migrated PostHog token to environment variable
- Documented all configured servers
- Added troubleshooting guide

---

**Last Updated:** 2026-01-24
**Maintained By:** AI Agents (Claude Code, Cursor)
**Related Files:** `.mcp.json`, `.vscode/mcp.json`, `.env.local`, `CLAUDE.md`
