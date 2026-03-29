# PRD Backlog (Emergent Items)

> Items discovered during PRD creation or implementation that should become their own PRDs.
> Review periodically and promote to full PRDs when ready.
>
> **Agent instruction**: Any time during work you discover something that needs its own PRD, add a row here immediately. Do NOT wait until the end of the session. Include enough context that the item makes sense months later.

---

| Date | Discovered During | Item | Priority | Notes |
|------|-------------------|------|----------|-------|
| 2026-03-29 | PRD 70-80 creation | Create `.claude/agents/prd-worker.md` and `.claude/agents/orchestrator.md` agent definitions for Agent Teams | Medium | Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` flag. Would enable true worktree isolation per PRD. Currently using subagent pattern instead. Revisit when agent teams feature is stable. |
| 2026-03-29 | PRD 70-80 creation | Create `parallel-execution` skill documenting orchestrator/worker patterns, batching strategy, conflict prevention | Low | Pattern is documented in `prd-creation` skill v2.2 and `SPRINT_EFG_CONTEXT.md`. May warrant own skill if pattern is reused beyond PRD execution (e.g., parallel refactoring, parallel test runs). |
| 2026-03-29 | PRD 74 planning | Email notification system for payment events (failed payments, subscription renewals, receipts) | Medium | Ties into PRD 38 (Notification Infrastructure, schema-only complete). Should build on existing notification DB schema. |
| 2026-03-30 | PRD 70 execution | Convert remaining `.docx` files in `docs/artifacts/` to markdown or archive them | Low | 3 `.docx` files remain: Agent Mode Product Testing, Module-by-Module Assessment, Comprehensive Product & Strategy Review. Can't add context headers to binary files. |
| 2026-03-30 | PRD 70 execution | Audit `docs/StepLeague_Alpha_Testing_Checklist.xlsx` — may be superseded by `docs/ALPHA_TESTING_CHECKLIST.md` | Low | Binary Excel file at docs root. If redundant, archive it. If complementary, convert to `.md`. |
| 2026-03-30 | PRD 72 research | Tax compliance layer for non-MoR payment providers (Paystack/Stripe) | Medium | If migrating from Paddle (MoR) to Paystack or Stripe, need multi-jurisdiction VAT/GST calculation and remittance. Evaluate TaxJar, Avalara, or Stripe Tax as solutions. Only needed if switching away from MoR provider. |
| 2026-03-30 | PRD 72 research | Evaluate Wise Business account as payment intermediary | Low | Wise Business provides multi-currency accounts (USD, ZAR, VND). Useful if choosing Stripe Atlas path — US bank account from Atlas LLC can route through Wise to FNB. Not needed if using Paddle (direct worldwide payout) or Paystack (native FNB). |
| 2026-03-30 | PRD 71 verification | Add `IDENTITY_DESCRIPTION` disclosure text to signup page | Low | `identity.ts` has the text ("how you appear to other members in leagues and leaderboards") but `sign-up/page.tsx` doesn't render it below the display name field. Currently only shown on profile settings page. 15-min fix. |
| 2026-03-30 | PRD 71 verification | E2E tests for alpha critical flows (signup → dashboard → submit → leaderboard) | Medium | PRD 71 verified flows via code review only. Committing Playwright E2E tests covering these flows would prevent silent regressions before beta. See PRD 71 proactive consideration #1. |
| 2026-03-30 | PRD 73 business refresh | LinkedIn Insight Tag installation for website visitor retargeting | Low | Only viable when ad budget reaches $200+/mo. Install tag early to build retargeting audience. LinkedIn retargeting is the only cost-effective LinkedIn Ads play at low budget. |
| 2026-03-30 | PRD 73 business refresh | Threads cross-posting automation (monitor platform growth) | Low | Threads has 400M MAU and 127.8% YoY DAU growth. Currently consumer-skewed, not B2B. Monitor and revisit Q3 2026. Cross-post LinkedIn content as minimal-effort experiment. |
| 2026-03-30 | PRD 73 business refresh | Purchasing Power Parity (PPP) pricing implementation | Low | Primary users in South Africa and Southeast Asia. Single USD pricing may limit adoption. Implement after international usage data validates demand. Affects payment provider requirements (PRD 72). |
| 2026-03-30 | PRD 73 business refresh | Social media monitoring agent — automated platform snapshots, reports, and post drafting | Medium | Build AI agents that log into social media accounts (Facebook, LinkedIn, Reddit), take snapshots of post performance and trends, generate reports, and feed insights into the human-writer skill to draft platform-specific posts. Automates the marketing loop for a solo dev. Could use Claude Code Agent SDK + MCP servers for browser automation. Depends on having active accounts and initial content to monitor. |
