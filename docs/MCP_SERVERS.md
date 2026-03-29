---
## Document Context
**What**: Reference for available MCP servers (GTM, GA4, PostHog, Perplexity) with account IDs, access levels, and quick commands
**Why**: Look up MCP server configuration, account identifiers, and usage patterns when working with analytics or tag management
**Status**: Current
**Last verified**: 2026-03-29
**Agent note**: This summary should be sufficient to assess relevance. Only read further if this document matches your current task.
---

# MCP Server Reference

## Available Servers

| Server | Access | Quick Reference | Use Cases |
|--------|--------|-----------------|-----------|
| **GTM MCP** | Write | Account: `6331302038` | Create/edit tags, triggers, variables, publish versions |
| **GA4 MCP** | Read | Property: `517956149` | Query reports, sessions, page views, realtime data |
| **PostHog MCP** | Full | API key in `.vscode/mcp.json` | Feature flags, experiments, insights, event analytics |
| **Perplexity MCP** | Read | N/A | Web search, research queries |

## Quick Commands

- **GTM**: "List my GTM containers"
- **GA4**: "Get my GA4 account summaries"
- **PostHog**: "Get all feature flags in the project"

## Configuration

MCP server configs are stored in `.vscode/mcp.json`. Each server runs as a separate process and is available to all agent teammates automatically.

## Architecture Note

All tracking goes through **GTM dataLayer** — GTM routes events to GA4, PostHog, and other destinations. No direct SDK integrations. See `.claude/rules/analytics.md` for event tracking patterns.
