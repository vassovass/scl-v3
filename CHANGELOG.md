# Changelog

All notable changes to StepLeague v3.

> **Format**: [Keep a Changelog](https://keepachangelog.com/) with date-based versioning.
> **AI agents**: Update this file on every commit.

---

## [2026-01-03]

### Added

- **PRD 19: League Settings & Start Date** - New modular settings system for leagues
  - **League Settings Page** (`/league/[id]/settings`) for owners/admins
  - **Start Date** - Configure a `counting_start_date` to ignore previous step history (fresh start)
  - **Modular Settings Components**:
    - `GeneralSettings`: Name, Description, Category, Week Start
    - `CompetitionSettings`: Start Date, Daily Step Goal, Max Members
    - `RulesSettings`: Manual Entry, Photo Requirements, Public Visibility
    - `DangerZone`: Delete league actions
  - **API Updates**: `PUT /api/leagues/[id]` for updating settings, Leaderboard filtering by start date

---

## [2026-01-03]

### Added

- **PRD 18: Documentation** - Created comprehensive system documentation
  - **System Overview** (`docs/feedback-roadmap-system.md`) - Architecture, Components, and API reference
  - **Architecture Diagram** (`docs/diagrams/feedback-flow.md`) - Mermaid graph of data flow
  - **Documentation Links** - Updated `README.md` and `AGENTS.md` with pointers to new docs

---

## [2026-01-02]

### Added

- **PRD 17: Public Roadmap Polish** - Comprehensive UI/UX improvements for the roadmap
  - **Reusable Celebration System** (`Confetti.tsx`) - Canvas-based, mobile-friendly confetti for achievements and shipping features
  - **Completion Impulse Chart** (`CompletionMiniChart.tsx`) - Sparkline visualization of shipping velocity in the "Done" column
  - **Detailed Subscribe Component** (`RoadmapSubscribe.tsx`) - Options for Email (auth redirect) and RSS feed copy
  - **RSS 2.0 Feed** (`/api/roadmap/rss`) - Feed of recently shipped features

### Changed

- **Roadmap Visuals** - Migrated to theme-aware CSS variables and added color-coded column accents
- **Badge System** - Migrated `RoadmapCard` to use the standardized `Badge` component
- **Mobile Experience** - Added horizontal scroll snapping, sticky headers, and larger touch targets (44px min)
- **Accessibility** - Added ARIA region roles, article roles, visible focus rings, and keyboard navigation support

---

## [2026-01-02]

### Added

- **PRD 16: Import/Export System** - Comprehensive CSV import/export with round-trip editing support

  **Export System:**
  - `useExport<T>` hook - Reusable, generic export hook with CSV/JSON support
  - `presets.ts` - Column definitions with format/parse functions for round-trip
  - Formula injection prevention (OWASP) - Sanitizes `=`, `+`, `-`, `@` characters
  - UTF-8 BOM for Excel compatibility
  - Date in filename (`StepLeague-kanban-export-2026-01-02.csv`)
  - Analytics tracking (`export_completed` event)
  - Migrated `KanbanBoard.tsx` (removed 60 lines of inline code)
  - Migrated `RoadmapView.tsx` (removed 55 lines of inline code)

  **Import System:**
  - `csvParser.ts` - Robust CSV parsing with quote/newline handling
  - `useImport<T>` hook - File parsing, preview, validation, API integration
  - `ImportModal.tsx` - Drag-and-drop upload, preview (update vs create), error display
  - `/api/admin/feedback/import` - Upsert endpoint (update by ID, create if no ID)
  - Fuzzy column matching (Title = Subject, Status = board_status)
  - Import button added to Kanban board (green, next to Export)

  **Architecture:**
  - Fully generic/modular - works with any entity type via type parameter
  - Column presets: `KANBAN_COLUMNS`, `ROADMAP_COLUMNS` (extensible for future entities)
  - Validation via Zod schemas (`bulkImportSchema`)

---

## [2025-12-31]

### Added

- **Vercel Speed Insights** - Performance metrics collection for Real Experience Score (RES)
  - Installed `@vercel/speed-insights` package
  - Added `<SpeedInsights />` component to root layout
  - Tracks FCP, LCP, INP, CLS, FID, TTFB metrics via Vercel dashboard

- **Universal Filter Persistence System** - Filters now survive page refresh and are shareable via URL
  - `useFilterPersistence` hook - Generic, reusable hook for persisting any filter state
  - `filterStorage.ts` - localStorage utilities for per-page/context filter preferences
  - URL params as primary source (shareable, bookmarkable)
  - localStorage fallback for user preferences when no URL params present
  - Hydration handling to prevent SSR/client mismatch

### Fixed

- **Leaderboard Period Reset** - Fixed bug where selecting "All Time" and refreshing would reset to "This Week"
  - Migrated leaderboard page to use `useFilterPersistence` hook
  - All filters (period, sort, verified) now persist in URL
  - Added Suspense boundary for proper hydration

---

## [2025-12-31]

### Added

- **PRD 15: Page Layout System** - Reusable, modular page structure components

  - `PageLayout.tsx` - Orchestrator for header, loading, empty, and content states
  - `PageHeader.tsx` - Title, subtitle, actions, breadcrumbs with analytics tracking
  - `EmptyState.tsx` - Configurable empty state with icons, descriptions, and CTAs
  - `LoadingSkeleton.tsx` - Multiple variants: list, cards, table, content, custom
  - **Analytics Integration**: `data-track-*` attributes, `trackComponentView()` on mount
  - **SEO**: Semantic HTML (`<header>`, `<main>`), unique IDs, proper heading hierarchy
  - **A/B Testing**: `data-variant` attributes for experiment tracking via GTM
  - **Accessibility**: ARIA roles, `aria-busy`, `aria-label`, focus management
  - **Extensibility**: Slot pattern (`headerSlot`, `beforeContent`, `afterContent`)
  - **Sleek Animations**: Uses existing `animate-fade-in`, `animate-fade-slide` utilities
  - Migrated `/admin/feedback` and `/admin/kanban` pages as proof of concept

---

## [2025-12-31]

### Changed

- **Leaderboard API** - Migrated `/api/leaderboard` to `withApiHandler` pattern (fixes Vercel static rendering error)
  - Removed manual auth/membership checks (now handled by handler)
  - Extended `withApiHandler` to support `league_id` from URL query params
  - Eliminated `export const dynamic = 'force-dynamic'` workaround

### Added

- **PRD 14: Analytics GTM & GA4** - Comprehensive analytics infrastructure
  - `vanilla-cookieconsent@3.0.1` (pinned) for GDPR/CCPA cookie consent
  - `GoogleTagManager.tsx` - GTM script with Consent Mode v2 defaults
  - `CookieConsentBanner.tsx` - Cookie consent banner with category toggles
    - Performance and error tracking
  - User identity management for cross-tool per-user analytics
  - No frontend delays - all via GTM dataLayer
  - **Event Tracking**:
    - Authentication (login, sign_up, logout) with method and user_id differentiation
    - Conversion events: `league_created`, `league_joined`, `steps_submitted`
    - Engagement events: `share` (achievements, invites, analytics page)
    - Full GTM Data Layer integration for all key actions

### Fixed

- **Share Event Tracking** - Fixed race condition where share events weren't tracked
  - Moved tracking to capture "intent" immediately on click
  - Ensures events fire even if user cancels native share dialog
- **Analytics & Tracking Framework** in AGENTS.md
  - Prescriptive naming conventions (snake_case events, PascalCase components)
  - Data attribute conventions for GTM auto-tracking
  - Event category taxonomy
  - Module-specific tracking patterns
  - Future tools integration guide (Hotjar, PostHog, etc.)
- **PRD Documentation Updates** - Reordered PRDs 14-20
  - Analytics moved to PRD 14 (immediate next priority)
  - Page Layout System → PRD 15
  - Export Utility → PRD 16
  - Public Roadmap Polish → PRD 17
  - Documentation → PRD 18
  - League Start Date → PRD 19
  - Expandable Cards → PRD 20

### Changed

- `src/app/layout.tsx` - Added GTM and CookieConsent components
- `.env.example` - Added GTM/GA4 environment variable documentation
- `AGENTS.md` - Added comprehensive Analytics & Tracking section

---

## [2025-12-29]

### Added

- **PRD 12: Merge Items & AI Chat** - Advanced feedback consolidation and assistance
  - **Merge Items Feature**: Admins can now merge multiple feedback items into a primary one
    - Transfers all attachments (screenshots) from secondary items to primary
    - Combines vote counts and archives secondary items
    - AI-assisted description generation using Gemini 2.5 Flash
  - **Interactive AI Chat Panel**: Persistent, collapsible chat assistant
    - Accessible globally in admin area via floating button
    - Context-aware: can analyze feedback, kanban, and roadmap items
    - Powered by Gemini with multimodality (understands screenshot context)
  - **Merge API**: `POST /api/admin/feedback/merge` with `preview` mode
  - **AI Chat API**: `POST /api/ai/chat` for conversational interactions
  - `MergeModal` component with diff-like preview and "Generate with AI" button
- **PRD 13: Saved Views** - Save and restore filter combinations
  - localStorage-based storage (`src/lib/filters/savedViews.ts`)
  - Dropdown component (`src/components/admin/SavedViewsDropdown.tsx`)
  - Preset views: All Items, New This Week, Public Roadmap
  - WCAG 2.2 accessible with keyboard navigation and ARIA
  - Integrated into UniversalFilters and enabled on `/admin/feedback`
  
### Changed

- `UniversalFilters.tsx` - Added `enableSavedViews` prop
- `FeedbackList.tsx` - Enabled saved views feature
  
### Fixed

- **Auth Redirect** - Confirmed `window.location.origin` usage and identified Supabase Site URL configuration as the fix for Vercel URL redirects

---

## [2025-12-28]

### Added

- **Homepage Responsiveness & Animations** - Improved above-the-fold experience
  - New animation utilities: `animate-fade-slide`, `animate-slide-up` with staggered delays
  - `@media (prefers-reduced-motion)` support for accessibility
  - `hero-image-container` class for edge-to-edge mobile layout
  - `section-full-width` utility for breaking out of containers
- **Mobile Public Menu** - Hamburger menu now appears for non-authenticated users on public pages
  - Animated slide-down drawer with Features, Roadmap, Beta Info links
  - Sign in button included in mobile drawer

### Changed

- **Homepage hero** - Uses CSS variable `--bg-base` for light mode compatibility
- **Typography** - Fixed "League" text descender clipping with `leading-[1.1] pb-2`
- **Public Nav Menu** - Removed emojis for sleeker appearance, added animated underline on hover
- **NavHeader** - Hamburger button now shows for public pages, not just authenticated users

---

## [2025-12-28]

### Added

- **PRD 9: Admin Feedback Page Polish** - Enhanced user feedback management
  - `AdminFeedbackClient.tsx` - View toggle (List/Kanban) with localStorage persistence
  - User feedback page now shows only user-submitted feedback (user_id IS NOT NULL)
  - Inline status dropdown for quick status changes
  - Roadmap visibility toggle (🌐/🔒) on each item
  - "NEW" badge with highlight for items < 24 hours old
  - Skeleton loader during data fetch
  - Empty state with icon
  - Uses Badge component from PRD 06
  - Non-superadmins redirected to dashboard (access control)
- **PRD 10: Bulk Actions API** - Backend APIs for bulk operations
  - `src/lib/schemas/feedback.ts` - Zod schemas for bulk operations
  - `PATCH /api/admin/feedback/bulk` - Bulk update (status, priority, visibility, release)
  - `POST /api/admin/feedback/bulk/archive` - Bulk archive items to "done" status
  - Atomic operations with proper validation (1-100 items per request)
  - Uses `withApiHandler` for consistent auth/error handling
- **PRD 11: Multi-Select UI** - Bulk selection in admin views
  - `BulkActionsBar.tsx` - Floating action bar with status/archive/visibility controls
  - Checkboxes on FeedbackList items with select-all header
  - Checkboxes on KanbanBoard cards with selection highlighting
  - Keyboard shortcuts: Escape to clear, Ctrl+A to select all (list view)
  - Selection clears automatically after bulk action

### Changed

- `FeedbackList.tsx` - Added `userFeedbackOnly` prop, quick actions, Badge integration
- `UniversalFilters.tsx` - Added `userFeedbackOnly` preset (no source filter)
- `/admin/feedback` page - Now fetches only user-submitted feedback, uses AdminFeedbackClient

### Fixed

- **Feedback API** - Now returns proper error on insert failure instead of silent success
- **Kanban API** - Added `source` filter support (`user_submitted` / `admin_created`)
- **Feedback submission** - Now sets `board_status: "backlog"` so items appear in kanban

---

## [2025-12-27]

### Added

- **PRD 6: Badge & Color System** - Centralized badge configuration eliminating duplicates
  - `src/lib/badges.ts` - Single source of truth for all badge definitions (type, status, release, achievement)
  - `src/components/ui/Badge.tsx` - Reusable badge component with size variants
  - Utility functions: `getBadgeClass()`, `getBadgeConfig()`, `getBadgeLabel()`, `getBadgeIcon()`
  - Backward-compatible exports: `TYPE_COLORS`, `STATUS_COLORS`, `RELEASE_OPTIONS`, `BADGE_INFO`
  - Design system page updated with Badge component examples
- **PRD 7: Navigation Across All Pages** - Consistent NavHeader on all pages
  - 8 new layout files: `admin/`, `roadmap/`, `feedback/`, `settings/`, `beta/`, `privacy/`, `security/`, `terms/`
  - NavHeader adapts for logged-in (full menu) vs non-logged-in (logo + Sign in) users
  - GlobalFooter included on all pages
  - Admin dropdown visible to superadmins on every page
- **PRD 7 Part B: Menu Locations System** - WordPress-style context-aware menus
  - `MenuLocation` type: `public_header`, `app_header`, `admin_header`, `footer`
  - `PUBLIC_MENU` for marketing pages (Features, Roadmap, Beta Info)
  - `MENU_LOCATIONS` config maps locations to menu sets
  - `detectMenuLocation()` auto-detects appropriate menu based on pathname
  - `NavHeader` accepts optional `location` prop for override
- **PRD 8: Homepage Swap** - Promoted new Strava-inspired homepage
  - Replaced simple homepage with immersive hero design from `/home-preview`
  - Added `variant` prop to NavHeader ('default' | 'transparent') for hero overlays
  - Created `(home)` route group with transparent nav for sleek homepage design
  - Deleted `/home-preview` route and folder

### Changed

- `feedbackFilters.ts` - Now re-exports colors from `badges.ts`
- `KanbanBoard.tsx` - Uses central `badges.ts` for TYPE_COLORS and RELEASE_OPTIONS
- `RoadmapView.tsx` - Uses `getBadgeConfig()` and `getBadgeClass()` from badges.ts
- `leaderboard/page.tsx` - Imports BADGE_INFO from `badges.ts`

---

## [2025-12-26]

### Added

- **PRD 1: Feedback Timestamp Tracking** - Database schema updates for admin feedback system
  - `status_changed_at` column auto-updated when `board_status` changes
  - Trigger function `update_feedback_timestamps()` for automatic timestamp management
  - Composite indexes: `(board_status, type)`, `(status_changed_at DESC)`, `(updated_at DESC)`
  - Backward compatible: existing records initialized with current timestamps
- **PRD 2: Admin Feedback APIs** - Enhanced APIs for feedback management
  - GET `/api/admin/kanban` now supports pagination, filtering, and search
  - Query params: `page`, `limit`, `type`, `status`, `search`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`
  - POST `/api/admin/feedback/bulk` for bulk updates (up to 100 items at once)
  - Returns pagination metadata with total count and pages
- **PRD 3: Filter & Search UI** - Filter controls for admin feedback page
  - `FeedbackFilters.tsx` component with type/status/visibility dropdowns
  - Debounced search (300ms) across title and description
  - Date presets (Today, This Week, This Month, Custom range)
  - Active filter badges with clear all button
  - `FeedbackList.tsx` client component with API fetching and pagination
- **PRD 4: Unified API Handler** - Reusable wrapper eliminating boilerplate from API routes
  - `withApiHandler()` function in `src/lib/api/handler.ts`
  - 6 auth levels: `none`, `required`, `superadmin`, `league_member`, `league_admin`, `league_owner`
  - Auto Zod schema validation with helpful error messages
  - Consistent error handling across all routes
  - Migrated `feedback/route.ts` and `admin/kanban/route.ts` as examples
- **PRD 5: Universal Data Fetching** - Standardized `useFetch` hook
  - Eliminates boilerplate for fetching, loading, and error states
  - Supports automatic refetching, caching options, and type safety
  - Migrated Dashboard and FeedbackList components

---

## [2025-12-24]

### Added

- **Agent Work Tracking** - Roadmap auto-updates based on what AI agents are working on
  - New `/api/agent/current-work` endpoint (POST/GET/PATCH/DELETE)
  - "Building Now" badge with blue glow for active agent work in roadmap "Now" column
  - Auto-stale: agent work cleared after 24 hours
  - Database: `is_agent_working`, `agent_work_started_at` columns on feedback table
  - Workflow: `.agent/workflows/update-roadmap.md` with agent instructions
- **Feature Completion Detection** - Robust lifecycle tracking for roadmap items
  - States: `backlog` → `in_progress` → `pending_review` → `verified` → `done`
  - Status badges: "Awaiting Review" (amber), "Needs Work" (red), "Verified" (green)
  - Only superadmin can mark items as done (verification required)
  - Database: `completion_status` column on feedback table
  - PATCH `/api/agent/current-work` to mark work as pending_review
- **Modular Menu System** - WordPress-style menu configuration with unlimited nesting
  - `menuConfig.ts` - Centralized menu definitions with role-based visibility
  - `MenuRenderer.tsx` - Universal component supporting dropdown, accordion, vertical, horizontal variants
  - Role filtering: guest → member → admin → owner → superadmin
  - Feedback integration via `data-module-id` attributes on all menu items
- **Internal Kanban Board** (`/admin/kanban`) - Drag-and-drop task management for superadmins
  - Five columns: Backlog → Todo → In Progress → Review → Done
  - Quick toggle for public/private visibility
  - Uses `@hello-pangea/dnd` for smooth drag-and-drop
- **Public Roadmap Page** (`/roadmap`) - Users can view and vote on planned features
  - Three sections: In Progress, Planned, Completed (changelog)
  - Priority voting (1-10 scale) with average displayed
  - Sign-in required to vote, viewing is public
- **Roadmap Voting API** (`/api/roadmap/vote`) - Submit/update priority votes
- **Database Schema Extensions**:
  - `feedback` table extended with `board_status`, `is_public`, `priority_order`, `completed_at`
  - New `roadmap_votes` table (1-10 priority, unique per user per item)
  - New `roadmap_comments` table (for future comments feature)
  - RLS policies for votes and comments
- **Seed Script** (`supabase/seed_roadmap.sql`) - Migrates ROADMAP.md content to database
- **ModuleFeedback Component** - Restored as passthrough wrapper (fixes build error)
- **Artifact Storage Rule** in AGENTS.md - Artifacts now live in `docs/artifacts/`
- **Date Awareness Rule** in AGENTS.md - Reminder for AI agents to use current date

### Changed

- **NavHeader.tsx** - Refactored to use MenuRenderer for all dropdowns (League, Actions, Help, Admin, User)
- **MobileMenu.tsx** - Refactored to use centralized menuConfig with accordion submenus
- **GlobalFooter.tsx** - Now uses menuConfig.ts for all footer links
- **navigation.ts** - Deprecated, now re-exports from menuConfig.ts for backward compatibility
- **AGENTS.md** - Added menu system documentation, updated Key Features
- **ROADMAP.md** - Added Kanban and Roadmap to Completed section

### Removed

- **NavDropdown.tsx** - Replaced by MenuRenderer component

---

## [2025-12-23]

### Added

- **Modular Navigation System** - Refactored `NavHeader` into reusable `NavDropdown` and `MobileMenu` components
- **Navigation Config** (`src/lib/navigation.ts`) - Centralized menu items configuration
- **Menu Size Warnings** - Console warning when menus exceed 7 items (UX best practice)
- **Guided Onboarding System** with React Joyride
  - 4 role-based tours: Dashboard Basics, How to Submit Steps, Leaderboard & Filters, League Owner Guide
  - Auto-start for new users on first visit
  - Help & Guides menu in user dropdown with all tours and duration estimates
  - Tours filter to only visible elements (fixes step count issue)
  - Feedback modal on tour completion (uses same pattern as ModuleFeedback)
  - LocalStorage persistence to remember completed tours
- **SuperAdmin dropdown menu** in NavHeader with dynamic page list
- **adminPages.ts config** - Add pages here, menu auto-updates (no code changes needed)
- **Design System Component Library** - All 19 components now documented with categories
- **Common UI Patterns** section in design system (inputs, selects, alerts)
- **Page Templates** section documenting layout patterns
- **Logo color-swap hover effect** - "Step" and "League" swap colors on hover

### Changed

- **AGENTS.md** - Added superadmin pages instructions, modularization rule, design system checklist
- **Design System page** - Now comprehensive with all components, patterns, and theme notes
- Logo hover behavior updated in NavHeader and GlobalFooter

### Fixed

- **OnboardingProvider** - Step counting now filters to only visible DOM elements

### Removed

- **ModuleFeedback** - Replaced with global FeedbackWidget

---

## [2025-12-23]

### Added

- **Global Feedback System** - Floating widget (💬) available on all pages for authenticated users
  - Supports "Bug", "Feature", "General", "Positive", "Negative" types
  - **Screenshot capture** using `html2canvas`
  - Auto-captures page URL and user agent
- **Admin Feedback Dashboard** (`/admin/feedback`)
  - List view of all feedback with status tracking
  - Screenshot preview and details
- **Feedback API** (`/api/feedback`) - Handles JSON payloads and base64 screenshots
- **Database Schema** - New `feedback` table with RLS policies

### Maintenance

- **Repository Synchronization** - Performed hard reset to `origin/main` (Commit `43c65e6`) to align local environment with GitHub source of truth, discarding erroneous local modifications.

### Changed

- **NavDropdown** and **MobileMenu** - Refactored navigation (from previous commit)
- **AGENTS.md** - Added documentation compliance check
- **ModuleFeedback** - Deprecated and removed in favor of global widget

---

## [2025-12-22]

### Added

- **Design System** - Modular CSS custom properties (design tokens) in `globals.css`
  - Brand colors, backgrounds, text, status colors all configurable from `:root`
  - Utility classes: `.btn-primary`, `.btn-ghost`, `.glass-card`, `.card-glow`
  - Text effects: `.text-gradient`, `.glow-text`
  - Background effects: `.bg-gradient-mesh`, `.bg-gradient-primary`
  - Animations: `.animate-float`, `.animate-pulse-glow`, `.animate-fade-in`
- **Home Page Preview** at `/home-preview` - Strava-inspired dark design
  - Animated gradient mesh background
  - Glassmorphism feature cards
  - How It Works section with step indicators
  - Stats strip with social proof
- **Design System Page** at `/admin/design-system` (superadmin-only)
  - Live examples of all design tokens and utility classes
  - Color palette, typography, buttons, cards, animations reference
- **Proxy Members** - League owners/admins can create placeholder profiles for people who haven't signed up yet
  - Submit steps on behalf of proxy members (verified or unverified)
  - Link proxy to a real user when they join, transferring all submissions
  - Proxy members appear on leaderboard with their own rankings
- **ProxyMemberManagement** component with create, link, and delete functionality
- **Proxy member API routes** (`/api/leagues/[id]/proxy-members`)
- **Members list** added to league API response for admin tools

### Changed

- **AGENTS.md** updated with design token documentation and new rule requiring design system page updates

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
- Analytics share button now visible on mobile (header stacks vertically)

### Added

- **Submit Another Batch** button after completing batch submission
- **Compact calendar heatmap** - smaller squares, submission ratio on hover
- **Dynamic OG share links** - shareable URLs with preview images showing rank, steps, period
- **Share page** (/share/[id]) with dynamic Open Graph metadata for social previews
- **OG image API** (/api/og) generates branded preview images with rank and steps
- **Enhanced share modal** - WhatsApp, Twitter, Copy buttons with time period in messages

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
- Gemini verification using correct model (2.0 Flash)

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

Initial v3 setup. Complete rewrite from deprecated v2 (Cloudflare) to production v3 (Vercel).
