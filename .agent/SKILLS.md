# Agent Skills

> **Master skills file for AI coding assistants.**
> Check here for available capabilities.

---

## MCP Skills (External Connections)

MCP (Model Context Protocol) skills provide AI agents with external tool access.

| Skill | Capabilities | Status | Details |
|-------|--------------|--------|---------|
| [Supabase](skills/mcp/supabase.md) | query, schema, tables, rls | ✅ Active | Direct DB access |

### Setup

Run `npm run mcp:sync` to generate tool-specific configs from the universal source.

---

## Future Skill Categories

| Category | Folder | Purpose |
|----------|--------|---------|
| MCP | `skills/mcp/` | External tool connections |
| Prompts | `skills/prompts/` | Reusable prompt templates |
| Workflows | `skills/workflows/` | Multi-step processes |

---

## Adding New Skills

### MCP Skills

1. Add server to `.agent/mcp.json` under `servers`
2. Create skill doc in `.agent/skills/mcp/[name].md`
3. Run `npm run mcp:sync` to generate configs
4. Update this table

### Other Skills

1. Create skill file in appropriate folder
2. Add to table above
3. Document usage in the skill file

---

## Related Files

| File | Purpose |
|------|---------|
| `.agent/mcp.json` | Universal MCP configuration |
| `.agent/MCP.md` | MCP setup documentation |
| `scripts/sync-mcp.js` | Config generator script |
| `.agent/workflows/` | Workflow definitions |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-12 | Restructured: MCP skills in `skills/mcp/` subfolder |
| 2026-01-12 | Added npm run mcp:sync integration |
| 2026-01-12 | Initial creation |
