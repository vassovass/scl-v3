---
description: Verify MCP connections are working correctly
---

# MCP Health Check Workflow

Use this workflow to verify all MCP servers are connected and working.

## Steps

### 1. Check Supabase MCP

Ask the AI agent to run this test:
```
Use the list_resources tool for the supabase MCP server
```

**Expected result:** List of database tables (users, leagues, submissions, etc.)

### 2. Test Database Query

Ask the agent:
```
Query the supabase MCP: SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5
```

**Expected result:** Recent migration versions

### 3. Verify Capabilities

Ask the agent:
```
What MCP servers are available and what can they do?
```

**Expected result:** Agent references `.agent/MCP.md` capabilities table

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "MCP not found" | Restart IDE, check config file location |
| "Connection refused" | Check Supabase project is active |
| "Unauthorized" | Verify project_ref is correct |

---

## Related

- `.agent/mcp.json` - Central MCP configuration
- `.agent/MCP.md` - Full documentation
