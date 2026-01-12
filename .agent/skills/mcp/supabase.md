# Supabase MCP Skill

**ID:** `supabase`
**Type:** MCP (Model Context Protocol)
**Status:** ✅ Active
**Project:** `nwhvkhydryulgxobqioi`

---

## Purpose

Direct database access to StepLeague PostgreSQL via Supabase.

## Capabilities

| Capability | Description |
|------------|-------------|
| `query` | Execute SQL queries directly |
| `schema` | Inspect table structures |
| `tables` | List and explore tables |
| `rls` | View Row Level Security policies |

---

## When to Use

- Query the database directly (e.g., "Show me all users with >10k steps")
- Inspect table schemas (e.g., "What columns does the feedback table have?")
- Check migration status (e.g., "Which migrations are applied?")
- Debug data issues (e.g., "Find duplicate submissions for user X")

---

## Example Prompts

```
// Check migrations
"Show the latest 5 migrations from schema_migrations"

// Inspect schema
"What columns does the submissions table have?"

// Query data
"Show all users with is_superadmin = true"

// Check relationships
"Show foreign keys on the memberships table"
```

---

## Connection Methods

### URL-Based (Claude Code, Cursor)

Uses Supabase's hosted MCP endpoint with OAuth authentication.
No credentials needed - browser auth on first use.

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=nwhvkhydryulgxobqioi"
    }
  }
}
```

### Postgres Direct (Antigravity)

Antigravity only supports stdio (command-based) MCPs, not HTTP URLs.
Uses direct PostgreSQL connection:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:YOUR_PASSWORD@db.nwhvkhydryulgxobqioi.supabase.co:5432/postgres"]
    }
  }
}
```

**Setup:**
1. Get password from Supabase Dashboard → Settings → Database
2. Replace `YOUR_PASSWORD` in the connection string
3. Create file at `~/.gemini/antigravity/mcp_config.json`

---

## Verification

Test the connection by asking the AI:
```
List the tables in the supabase database
```

Or use the tool directly:
```
Use list_resources tool for supabase
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "server not found" | Check config file location for your tool |
| "connection refused" | Verify Supabase project is active |
| "unauthorized" (URL) | Complete OAuth flow in browser |
| "password authentication failed" | Check connection string password |

---

## Related Files

- [Universal MCP Config](../../mcp.json) - Source of truth
- [MCP Documentation](../../MCP.md) - Full setup guide
- [Skills Manifest](../../SKILLS.md) - All agent skills

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-12 | Fixed Antigravity config (postgres, not URL) |
| 2026-01-12 | Initial creation |
