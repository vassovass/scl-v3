# Changelog

All notable changes to StepCountLeague v3.

> **Format**: [Keep a Changelog](https://keepachangelog.com/) with date-based versioning.
> **AI agents**: Update this file on every commit.

---

## [2025-12-21]

### Added
- **Analytics Dashboard** with calendar heatmap and daily breakdown table
- **ShareButton** component (Web Share API + WhatsApp/Twitter fallback)
- **Daily breakdown API** with flexible grouping (3-day, 5-day, weekly)
- **Calendar API** for monthly submission coverage
- **Mobile hamburger menu** with slide-out drawer
- **GlobalFooter** with legal links (Privacy, Security, Beta)
- **Dropdown navigation menus** for League, Actions, User profile
- **AGENTS.md** universal AI context file
- **ROADMAP.md** feature roadmap
- **CHANGELOG.md** (this file)
- **Resend confirmation email** button on sign-in page when email not confirmed

### Changed
- **NavHeader** now mobile-responsive with hamburger menu on small screens
- **ModuleFeedback widget** moved to floating icon in bottom-right corner
- **README.md** updated with version history, TL;DR, and doc references
- **CLAUDE.md** simplified to reference AGENTS.md
- **Landing page** redesigned with responsive heading (breaks on mobile)
- **Feature cards** now use compact inline-icon layout on mobile

### Fixed
- Feedback widget no longer interferes with table content
- Landing page heading overflow on mobile
- Sign-in page now shows resend option for unconfirmed emails
- Batch submission no longer freezes when selecting 5+ images (gracefully takes first 5, warns about rest)

### Added
- **Submit Another Batch** button after completing batch submission
- **Compact calendar heatmap** - smaller squares, submission ratio on hover

---

## [2025-12-20]

### Added
- **Batch submission** with AI extraction (multi-image upload)
- **DatePicker** component with quick-select buttons
- **Profile settings page** for nickname and display name
- **Module feedback system** (inline thumbs up/down)
- **Leaderboard filters** (period, verified, custom date range)
- **Legal pages** (privacy, security, beta)

### Changed
- Default submission mode set to batch
- Leaderboard API enhanced with year/all-time periods

### Fixed
- Rate limiting error display improvements
- Gemini verification using correct model (2.5 Flash)

---

## [2025-12-19]

### Added
- **League soft delete** (deleted_at, deleted_by columns)
- **Submission controls** (flagged, flag_reason, backfill_limit)
- **SuperAdmin utilities** and debug logs endpoint
- **Auto-redirect** from home to dashboard for logged-in users
- **Dashboard stats** (member count, user rank, weekly steps)

### Fixed
- Leaderboard RLS permission issues
- Submission API upsert logic
- League creation foreign key constraint

---

## [Earlier]

Initial v3 setup migrated from v2 (Cloudflare → Vercel).
