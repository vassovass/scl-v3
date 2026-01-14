# Changelog

All notable changes to StepLeague v3.

> **Format**: [Keep a Changelog](https://keepachangelog.com/) with date-based versioning.
> **AI agents**: Update this file on every commit.

---

## [2026-01-14]

### Added

- **Proxy Management Settings Page** (`/settings/proxies`) - Dedicated page for managing proxy profiles
  - Wired up `ProxyMemberManagement` component with claim link functionality
  - Users can create proxies and copy "Claim Link" to share with others
  - Added "Proxies" tab to settings navigation across profile and preferences pages

### Changed

- **ProxyMemberManagement Component Refactor** - Theme system compliance
  - Replaced hardcoded `slate-*` colors with CSS variables (`--foreground`, `--card`, `--border`, `--muted-foreground`, `--destructive`, `--success`, `--warning`)
  - Migrated to shadcn components (`Button`, `Input`, `Dialog`) for consistency
  - Now fully supports light/dark mode switching

---

## [2026-01-13]

### Added
- **Bulk Submission Management**: Adjustable pagination (10-100), global "Select All", and bulk actions (Delete, Date Edit, Resubmit).
- **Proxy Context Switching**: "View As" dropdown for Admins to view and manage proxy member submissions as if they were their own.
- **Bulk APIs**: Dedicated endpoints for bulk Delete, Patch (date), and AI Re-analysis.
- **Resubmit to AI**: Capacity to re-process failed or stale submissions in bulk (rate-limited).

### Fixed
- **Bulk Delete Limits**: Resolved payload size issues for large bulk deletions (>100 items) via backend limit increase and frontend chunking.
- **Pagination**: Corrected "Showing X-Y of Z" display logic.
- **Proxy Permissions**: Hardened permission checks for modifying proxy data.
- **Desktop dropdown navigation**: Fixed desktop menu items (e.g. “Submit Steps”) not navigating due to a conflicting outside-click handler with Radix portals.
- **League overview stats 404**: Added missing `/api/leagues/[id]/stats` endpoint used by the league overview page.
- **Submissions API resilience**: Prevented schema-drift 500s by using `select("*")` for submissions listing.
- **Edge middleware compatibility**: Removed `supabase-js`/`@supabase/ssr` dependency from middleware to avoid Edge runtime incompatibilities.
- **Workbox noise**: Reduced noisy Workbox “no-response” errors for commonly blocked analytics/telemetry endpoints.

### Changed
- **Analytics loading**: Gate GTM + Vercel Analytics/Speed Insights behind cookie consent and online status.
- **PWA build artifacts**: Stop tracking generated service-worker/workbox files in `public/` (build-time outputs).
- **Theme tokens**: Replaced hardcoded Tailwind colors in Feedback + Install Prompt UI with semantic design tokens (light/dark safe).

## [2026-01-12]

### Added

- **SuperAdmin Theme Mode Controls** - Configure default theme and allowed modes (dark/light/system) globally
- **PRD 39: Performance Architecture & Stability** - Complete system overhaul for speed and resilience
  - **Server Components**: Refactored Dashboard to async RSC, eliminating client-side fetch waterfalls
  - **Caching Registry** (`src/lib/cache/registry.ts`): Type-safe source of truth for all cache keys/TTLs
  - **Hybrid Sync**: `HybridCacheSync` bridge ensuring zero-jitter updates between Server Cache and Client IndexedDB
  - **Resilience**: 
    - **Circuit Breaker**: `serverCache.ts` now protects DB from cascading failures (5 failures = 30s open circuit)
    - **SafeLazy**: Error-boundary protected wrapper for third-party scripts (GTM, Feedback)
  - **DevTools**: Added `CacheDevTools` for monitoring hit rates and circuit status
- **Client Version & Commit Display** - Added version and commit hash to global footer
  - **Configuration**: Exposes `NEXT_PUBLIC_APP_VERSION` and `NEXT_PUBLIC_COMMIT_SHA` via `next.config.js`
  - **UI**: Displays subtle version info (e.g., `v0.1.0 (a1b2c3d)`) next to stage badge in `GlobalFooter.tsx`
  - **Transparency**: Helps users/testers identify exactly which deploy they are using
- **Server-Side Cache for Branding** - Implemented modular `serverCache.ts` utility
  - **Performance**: Fixed GTmetrix/PageSpeed timeouts via `unstable_cache` with 3s timeout
  - **Auto-Invalidation**: Admin branding updates instantly bust cache (`revalidateTag`)
  - **Modular Design**: Reusable `createCachedFetcher` factory for future SSR needs
  - **Safety**: Graceful fallback to default values on timeout or error
- **Enhanced AI Step Verification System** - Comprehensive improvements to extraction accuracy and error handling
  - **Multilingual Date Support**: Added support for 7 languages (English, Chinese, Spanish, German, Korean, French, Japanese)
  - **App-Specific Pattern Recognition**: Added guidance for Samsung Health, Google Fit, Apple Health, Xiaomi Mi Fit, Fitbit
  - **Confidence Scoring**: AI now returns "high", "medium", or "low" confidence with explanatory notes
  - **Enhanced Error Reporting**: Categorized errors (network, rate limit, extraction failure) with detailed technical info
  - **Low-Confidence Blocking**: Users must confirm low-confidence extractions before submission
  - **AI Notes Display**: Shows AI reasoning and assumptions in expandable "AI Notes" section
  - **Edge Case Handling**: Explicit instructions for hourly breakdowns, goals vs actual, partial day data, rotated images
  - **Error Details Copy Button**: Users can copy full error details for support tickets

- **Batch Submission Retry Functionality** - Smart retry system for failed extractions
  - **Auto-Retry with Exponential Backoff**: Automatically retries failed extractions (5s, 10s, 20s delays) for retryable errors
  - **Visual Countdown Timer**: Shows "Retrying in Xs (Attempt N/3)" during auto-retry
  - **Manual Retry Button**: Per-image "🔄 Retry Extraction" button for retryable failures
  - **Retry All Failed**: Bulk retry button to reprocess all retryable errors at once
  - **Retry State Tracking**: Tracks retry count, next retry time, and auto-retry status
  - **Smart Error Classification**: Distinguishes retryable (network, rate limit, timeout) vs non-retryable errors
  - **Graceful Degradation**: After 3 auto-retry attempts, shows manual retry option instead

- **Filename-Based Date Hints** - Intelligent date extraction from image filenames
  - **Automatic Date Parsing**: Extracts dates from filenames (e.g., "steps_2024-01-12.jpg", "IMG_20240112.png", "health_2024_01_12.png")
  - **Fallback Support**: Uses filename date when screenshot date is ambiguous or missing
  - **Confidence Boost**: Filename dates increase extraction confidence when screenshot is unclear
  - **Multi-Pattern Support**: Handles YYYY-MM-DD, YYYYMMDD, and YYYY_MM_DD formats
  - **Validation**: Only uses valid dates that pass Date.parse() validation

### Changed

- **Theme Toggle Availability** - Disabled theme options now stay visible with "coming soon" hover hints when not allowed.
- **Gemini Verification Prompt Logic** - Enhanced reliability for relative dates
  - **Relative Date Context**: Verification prompt now includes explicit "Today", "Yesterday", and "2 days ago" dates based on server time.
  - **Modular Prompt Generation**: Extracted `generateVerificationPrompt` for better testability and maintenance.
  - **Zod Schema Validation**: Added strict type validation for Gemini JSON responses to prevent runtime errors.
  - **Bug Fix**: Resolved duplicate key error in Leaderboard API.

### Added

- **PRD 31: Social Encouragement System ("High Fives")** - Supportive, mindful encouragement features
  - **Modular Encouragement System** (`src/lib/encouragement/`)
    - Shared configuration for "Zen" aesthetics (gentle pulsing animations, soft colors)
    - Mindful quotes engine ("We rise by lifting others")
    - Type-safe encouragement themes (High Five, Cheer, Milestone)
  - **High Fives**
    - `HighFiveButton` component: Replaces competitive interactions with supportive ones
    - Uses "Warm Glow" pulse animation instead of jarring confetti
    - Integrated into Leaderboard rows
  - **Cheer Prompts**
    - `CheerPrompt` component: Contextual, dismissible suggestions to encourage teammates
    - "Zen" entrance animations (slow fade-in)
  - **Gratitude Card**
    - Dashboard widget summarizing support received ("5 friends sent support")
    - Displays random mindful quotes
  - **Database & API**
    - `high_fives` table with unique sender/submission constraints
    - `feature_high_fives` feature flag
    - `POST /api/high-fives` and `DELETE /api/high-fives` endpoints
    - Leaderboard API updated to return support counts

- **PRD 33: Pricing & How It Works** - Marketing pages
  - Added `/pricing` page with comparison table
  - Added `/how-it-works` page with visual guide
  - Created `(public)` route group to replace `(home)`
  - Updated global navigation menu and footer

### Changed

- **Home Page Tone Softening** - Shifted from competitive to connective language to better align with retention strategy
  - Updated Hero copy: "Compete. Track. Win." → "Motivate. Connect. Thrive."
  - Updated "How It Works" to focus on verification/fairness rather than "cheating"
  - Updated Features section to emphasize progress and consistency
  - Aligned with new "Social Encouragement" features for a cohesive friendly vibe

### Fixed

- **Max Batch Uploads Setting Not Applied** - Setting now works correctly

- **Max Batch Uploads Setting Not Applied** - Setting now works correctly
  - **Root Cause**: `BatchSubmissionForm.tsx` had hardcoded `MAX_FILES = 5` instead of using app settings
  - **Fix**: Now uses `useAppSettings().getNumericSetting('max_batch_uploads', 7)` for dynamic limit
  - Updated heading text: "Batch Upload (up to X images)" reflects actual setting value
  - Updated file limit enforcement to use configurable value
- **Settings Input Debounce** - Number inputs in admin settings now debounce properly
  - `NumberSetting.tsx`: Added 500ms debounce to prevent API calls on every keystroke
  - `SettingsField.tsx`: Added 500ms debounce for text/number inputs
  - Users can type complete values before save triggers
- **Build Warning Cleanup** - Moved theme colors to viewport metadata, forced dynamic API routes that read cookies, and guarded IndexedDB cache initialization in non-browser contexts
- **Build System Fixes** - Resolved type errors and missing page handlers
  - Fixed `BrandSettings` type mismatch (`updated_at` → `updatedAt`) in `layout.tsx`
  - Fixed JSX syntax error (stray closing brace) in `GlobalFooter.tsx`
  - Added `not-found.tsx` to resolve Next.js build failure for 404 routes

### Changed

- **Max Batch Uploads Constraint** - Increased maximum from 31 to 100 in `appSettings.ts`
  - Allows SuperAdmins to set batch upload limits up to 100 images

---

## [2026-01-09]

### Added

- **PRD 27: League Hub & Navigation Redesign** - Transform league pages into a central hub
  - **League Hub Overview** (`/league/[id]/overview`)
    - Quick stats card: rank, steps this week, streak, today's status
    - Submission status CTA linking to `/submit-steps`
    - Quick action cards for Rankings, Progress, Submit
  - **LeagueNav Component** (`src/components/league/LeagueNav.tsx`)
    - Horizontal tab navigation using WordPress-style `menuConfig`
    - Uses `LEAGUE_NAV_MENU` for dynamic, admin-configurable tabs
    - Mobile-first with horizontal scroll
    - Analytics tracking for tab clicks
  - **New Components**
    - `LeagueQuickStats.tsx` - Rank, streak, and today's status at a glance
    - `SubmissionStatusCard.tsx` - CTA to submit steps (links to league-agnostic `/submit-steps`)
  - **Redirect Pattern** (`/league/[id]/page.tsx`)
    - Now redirects to `/league/[id]/overview` for flexibility
    - Easy to change default page in future without refactoring
  - **menuConfig Updates**
    - Added `LEAGUE_NAV_MENU` with Overview, Submit Steps, Rankings, Progress, Settings tabs
    - Settings tab role-restricted to admin/owner/superadmin
  - **Analytics** - Added `leagueNav.tabClicked()` and `leagueNav.hubViewed()` tracking
- **Badge Component Refactor** - Separated category-based and variant-based badges
  - **shadcn badge** (`badge.tsx`) - Standard variants: default, secondary, destructive, outline
  - **SystemBadge** (`SystemBadge.tsx`) - Category-based for roadmap/kanban (type, status, release, achievement)
  - Updated imports across 4 files to use appropriate badge component

## [2026-01-11]

### Added

- **Modular Branding System (100% COMPLETE)** - Fully integrated into WordPress-inspired settings
  - **Core Infrastructure**:
    - `src/lib/branding.ts` - Type-safe branding configuration with defaults
    - `src/lib/image-processing.ts` - Client-side compression, security validation, multi-size generation
    - Database migration `20260111000000_add_brand_settings.sql` - Singleton table for branding
    - Supabase Storage bucket `brand-assets` (public read, superadmin write)
    - NPM packages: `browser-image-compression`, `file-type`, `swr`
  - **API Layer**:
    - `GET /api/admin/branding` - Fetch current branding (public endpoint)
    - `PATCH /api/admin/branding` - Update branding (superadmin only, partial updates)
    - `POST /api/admin/branding/upload-logo` - Upload custom logo images (light + dark)
  - **Components**:
    - `Logo.tsx` - Modular component with database support, theme-aware, supports custom images or emoji
    - Updated `NavHeader.tsx` and `GlobalFooter.tsx` to use Logo component
  - **React Hook**:
    - `useBranding()` - SWR-powered hook with optimistic updates and cache management
  - **WordPress Integration**:
    - Branding appears as "Branding" tab in `/admin/settings` (not standalone page)
    - Uses custom renderer pattern (`BrandingSettingsRenderer`) for specialized UI
    - Full branding management: text-based logo, custom image upload, theme colors, live preview
    - Removed standalone `/admin/branding` page for cleaner architecture
  - **Dynamic Metadata**:
    - `layout.tsx` - Dynamic favicon URLs via `generateMetadata()` (SSR-optimized)
    - `manifest.ts` - Dynamic PWA icons based on branding settings
  - **Design System Integration**:
    - Added Logo component documentation to design system page
    - Live demos of all size variants (sm, md, lg)
  - **Updated Defaults**:
    - Uses new favicon files: `favicon.ico` (multi-size), `apple-icon.png` (180x180), `icon.png` (512x512)
  - **Security**:
    - Multi-layer validation: file extension, MIME type, magic bytes verification
    - Max file size: 5MB with client-side compression before upload
    - Row-Level Security (RLS) policies on database and storage
  - **Performance**:
    - Client-side image compression with Web Workers (non-blocking)
    - CDN delivery via Supabase Storage with 1-year cache headers
    - SWR caching (60s dedupe interval) to minimize API calls
  - **SEO Optimization**:
    - Dynamic page titles based on branding
    - Theme-aware favicons (16x16, 32x32, 180x180)
    - PWA icons (192x192, 512x512, maskable)
    - Proper theme color meta tags for light/dark mode
  - **Documentation**: Comprehensive PRD in `docs/prds/PRD_Modular_Branding_System.md` (95% complete)

## [2026-01-10]

### Added

- **PRD 38: Notification Infrastructure** - Multi-layer notification system
  - **Database Schema** (`migrations/20260110144500_notification_infrastructure.sql`)
    - `notification_types` - Reference table for all notification types
    - `notification_settings_global` - SuperAdmin platform defaults
    - `notification_settings_league` - Per-league settings (Owner/Admin)
    - `notification_preferences_user` - User preferences
    - `notification_preferences_user_league` - Per-league user overrides
    - `notifications` - Notification queue/history with league_name for display
  - **Presets** - `yesterday_only`, `three_days`, `week`, `two_weeks` for submission reminders
  - **Seed Data** - 8 notification types: submission_reminder, streak_milestone, streak_at_risk, ranking_change, league_activity, weekly_summary, high_five_received, badge_earned

- **Modular Submission Status Hook** (`src/hooks/useSubmissionStatus.ts`)
  - Reusable hook for checking step submission status
  - Configurable: `targetDate` (yesterday/today/custom), `leagueId`, `userId`
  - Used in league overview page

- **Submission Gap Analysis API** (`/api/submissions/gaps`)
  - Returns missing dates, gap count, coverage percentage
  - Configurable date range via `days` parameter
  - Research-backed notification wording

### Fixed

- **Submission Status Check** - Now checks for **yesterday's** submission instead of today's
  - `LeagueQuickStats.tsx` - "Missing yesterday" instead of "Missing today"
  - `SubmissionStatusCard.tsx` - Updated messaging and props
  - `overview/page.tsx` - Uses `useSubmissionStatus` hook

### Added

- **Kanban Delete/Archive System** - Full delete and archive functionality for Kanban items
  - **Database Migration** (`20260110103000_add_feedback_archived_at.sql`)
    - Added `archived_at` column to feedback table for soft-delete support
    - Index on `archived_at` for efficient filtering of active items
  - **DELETE API Endpoint** (`/api/admin/kanban`)
    - `DELETE` method with `hard` parameter
    - Soft delete (default): Sets `archived_at` timestamp, item can be restored
    - Hard delete: Permanently removes from database
  - **Bulk Archive API** (`/api/admin/feedback/bulk/archive`)
    - Updated to set `archived_at` (previously just moved to "done" column)
    - Added `hard` parameter for permanent bulk deletion
  - **KanbanCard Delete Button**
    - Inline delete with confirmation showing options: 📦 Archive or 🗑️ Delete Forever
    - Compact UI that expands on click with cancel option
  - **ExpandableCardModal Delete Button**
    - Footer-positioned delete with same archive/forever options
    - Confirmation step before action
  - **BulkActionsBar Updates**
    - Separate "Archive" and "Delete Forever" buttons
    - Archive is soft-delete (restorable), Delete is permanent
  - **Kanban Page Filter**
    - Now excludes archived items by default (`archived_at IS NULL`)
  - **Archived View Toggle** 📦
    - Button in header showing count of archived items
    - Toggle shows/hides expandable list of archived items
    - Each archived item has "↩️ Restore" and "🗑️ Delete Forever" options
    - Restore brings items back to the Kanban board
  - **Toast Notifications**
    - Archive action shows toast with "Undo" button to restore immediately
    - Delete forever shows confirmation toast
    - Restore shows success toast
    - Error toasts for failed operations

- **Delete League Functionality** - Implemented the "Delete League" button in league settings
  - Uses existing `/api/leagues/[id]` DELETE endpoint (already supported soft/hard delete)
  - Added `ConfirmDialog` with destructive variant for confirmation
  - Toast notification on success: "League moved to trash, permanent deletion in 7 days"
  - Redirects to dashboard after deletion
  - Reuses same patterns as Kanban delete (ConfirmDialog + toast)

### Fixed

- **Admin Dropdown Menu** - Fixed Admin and User dropdown menus not opening reliably (required triple clicks)
  - Root cause: Nested button elements - `Button` component rendered inside `DropdownMenuTrigger` with `asChild`
  - Investigation revealed actual DOM had `<button><button>content</button></button>` structure
  - Clicks sometimes hit inner button (no handlers) vs outer button (with handlers) causing unreliable behavior
  - Solution: Use `buttonVariants` function instead of `Button` component to avoid nested buttons
  - Updated `NavHeader.tsx`: Changed from `<Button variant="ghost">` to `<button className={buttonVariants({variant: "ghost"})}>`
  - Now renders single button element with correct event handlers attached

### Added

- **User Theme Preference Persistence** (PRD-25 Integration)
  - Created `useUserTheme` hook for database-synced theme management
  - Integrates `next-themes` (client-side) with `user_preferences` table
  - Loads user's saved theme on mount, syncs all changes to database automatically
  - Falls back to localStorage for anonymous users
  - Optimistic updates for instant UI feedback (no loading spinner)
- **SuperAdmin Theme Variant Management Infrastructure**
  - Added "appearance" category to app settings with Palette icon
  - Created `ThemeVariant` interface for theme definitions (id, name, description, enabled)
  - Added `theme_variants` setting (JSON type) for unlimited custom themes
  - Default variants: dark and light (both enabled by default)
  - SuperAdmins can add variants like "high-contrast", "colorblind-friendly" in future
  - Updated all presets (Development, Staging, Production) to include theme_variants
- **Comprehensive Theme System Documentation** (`docs/THEME_SYSTEM.md`)
  - Complete architecture overview (next-themes + database persistence)
  - All CSS variables documented with dark/light values
  - Component patterns: badges, dropdowns, hover states, focus indicators
  - Text overflow prevention pattern (critical `min-w-0` flexbox pattern)
  - Accessibility requirements (WCAG 2.1 AA, 4.5:1 contrast ratios)
  - Implementation history: PRD-21 Part E/F, user-reported issues, all 49 files changed
  - Common pitfalls and solutions section
  - Quick reference checklist for AI agents
- **AGENTS.md Updates**
  - Added prominent "MUST READ" warning for theme documentation
  - Quick rules: semantic variables, light/dark testing, contrast requirements
  - Updated theme system section with next-themes and database storage details
  - Added THEME_SYSTEM.md and badges.ts to Related Files section

- **PRD 26 (Complete): SuperAdmin Settings & Feature Flags System** - Full implementation
  - **TypeScript Settings Registry** (`src/lib/settings/appSettings.ts`)
    - Organized settings by category: limits, features, defaults, display, general
    - Type-safe `AppSettingKey` union type for compile-time checking
    - Helper functions: `getAppSettingDefaults()`, `getAppSettingDefinition()`, `getLeagueInheritedSettings()`
    - Category metadata with icons for UI navigation
  - **Database Migration** (`20260110000000_add_prd26_settings.sql`)
    - Added all settings: max_batch_uploads, max_backfill_days, max_league_members
    - Feature flags: feature_high_fives, feature_streak_freeze, feature_analytics_export
    - Default values: default_daily_step_goal, default_stepweek_start
    - Display settings: show_global_leaderboard, maintenance_mode
    - Created `app_settings_audit` table for change tracking
    - Created `app_settings_presets` table with Dev/Staging/Production presets
    - Updated RLS policies for visibility controls
  - **Enhanced useAppSettings Hook**
    - Added `isFeatureEnabled()` - Type-safe feature flag check
    - Added `getNumericSetting()` - Numeric setting with constraint validation
    - Added `getLeagueInheritedSettings()` - Settings shown in league settings
    - Added `updateVisibility()` - Update visibility controls
    - Added `refresh()` - Manual settings reload
  - **useFeatureFlag Hook** (`src/hooks/useFeatureFlag.ts`)
    - Simple hook: `const enabled = useFeatureFlag('feature_high_fives')`
    - With loading state: `useFeatureFlagWithLoading()`
    - Multiple flags: `useFeatureFlags(['feature_a', 'feature_b'])`
  - **API Endpoints**
    - `PATCH /api/admin/settings/:key/visibility` - Update visibility controls
    - `GET /api/admin/settings/audit` - Fetch audit log entries
    - `GET/POST /api/admin/settings/presets` - List/create presets
    - `GET/PATCH/DELETE /api/admin/settings/presets/:id` - Manage preset
    - `POST /api/admin/settings/presets/:id/apply` - Apply preset to settings
    - Added audit logging to existing `PATCH /api/admin/settings/:key`
  - **Admin Settings UI Components** (`src/components/admin/settings/`)
    - `NumberSetting` - Number input with min/max constraints
    - `BooleanSetting` - Toggle switch for feature flags
    - `SelectSetting` - Dropdown for predefined options
    - `SettingRenderer` - Dynamic renderer based on setting type
    - `VisibilityControls` - Role badges, show_in_league toggle
    - `CategoryNav` - Mobile horizontal tabs, desktop vertical sidebar
    - `SettingsAuditLog` - Expandable recent changes log
    - `PresetsManager` - Preset selector with apply/save functionality
  - **Enhanced Admin Settings Page** (`/admin/settings`)
    - Category-based navigation (Limits, Features, Defaults, Display, General)
    - Dynamic setting editors based on type
    - Visibility controls per setting
    - Preset manager at top for quick configuration
    - Audit log at bottom showing recent changes
    - Mobile-responsive design
  - **League Settings Integration**
    - `InheritedAppSettings` component shows app-level settings
    - Read-only display with "App Setting" badge
    - Automatically appears when settings have `show_in_league_settings = true`
    - Added to `/league/[id]/settings` page

### Changed

- **Comprehensive Light/Dark Mode Theme System** - WCAG 2.1 AA compliant contrast fixes across 49 files
  - **CSS Variables & Design System**
    - Added semantic status colors: `--success`, `--warning`, `--info` to `globals.css`
    - Updated light theme colors for 4.5:1 minimum contrast ratio (WCAG 2.1 AA)
    - HSL format ensures proper color adaptation between themes
  - **New Components**
    - Created shadcn `Alert` component (`src/components/ui/alert.tsx`) with semantic variants (warning, destructive, success, info)
    - Extended `SystemBadge` with status category support (verified, pending, failed)
  - **PRD-21 Part E (CSS Unification)** - Replaced hardcoded Tailwind colors with semantic CSS variables
    - **Amber/Yellow → Warning**: 16 files fixed (`text-amber-400` → `text-[hsl(var(--warning))]`)
    - **Sky/Blue → Primary/Info**: 24 files fixed (`text-sky-400` → `text-primary` or `text-[hsl(var(--info))]`)
    - **Emerald/Green → Success**: Badge colors updated (`text-emerald-400` → `text-[hsl(var(--success))]`)
    - **Slate → Semantic**: All files (`bg-slate-950` → `bg-background`, `text-slate-400` → `text-muted-foreground`)
  - **PRD-21 Part F (Joyride Integration)** - Onboarding tour dialogs now theme-aware
    - Replaced hardcoded hex colors in `OnboardingProvider.tsx` with CSS variables
    - Tour tooltips, buttons, and beacons adapt to both light and dark modes
  - **Auth Pages (3 files)** - Full theme support with proper contrast
    - `sign-in/page.tsx`, `sign-up/page.tsx`, `claim/[code]/page.tsx`
    - Error/success states use semantic `destructive` and `success` variables
    - Form inputs with semantic focus borders (`focus:border-primary`)
  - **Dashboard Pages (5 files)** - Theme-aware analytics and submissions
    - `analytics/page.tsx` - Day modal with semantic colors
    - `leaderboard/page.tsx` - 22 batch color replacements
    - `submit-steps/page.tsx` - Migrated to SystemBadge
    - `join/page.tsx`, `league/create/page.tsx` - Form theming
  - **Forms (8 components)** - Consistent semantic colors across all forms
    - SubmissionForm, BatchSubmissionForm, BatchConflictTable, ConflictResolutionDialog
    - BulkUnverifiedForm, ProxySubmissionSection, JoinLeagueForm, consent-declaration
    - Checkbox colors, selection states, file upload buttons all theme-aware
  - **Admin Components (12 files)** - Full admin UI theme support
    - design-system/page.tsx (70+ text-primary replacements)
    - Kanban (KanbanBoard, KanbanCard), Feedback (FeedbackList)
    - Import/export (ImportModal, BulkActionsBar)
    - Settings (settings/page.tsx, VisibilityControls)
  - **Roadmap (3 components)** - RoadmapView, RoadmapCard, PriorityVote
  - **League Components (4 files)** - SubmissionStatusCard, ProxyMembersDropdown, LeagueInviteControl
  - **UI Components (7 files)** - OfflineIndicator, AchievementShareCard, DatePicker, DateRangePicker, ImagePasteZone
  - **Navigation & Layout (3 files)** - NavHeader, MobileMenu, GlobalFooter with brand color consistency
  - **Core Libraries**
    - `badges.ts` - Achievement badge colors updated to use semantic variables
    - Badge definitions with backgrounds intentionally preserved (designed to work together)
  - **Technical Quality**
    - TypeScript compilation: ✓ Passes with no errors
    - Future-proof: Change theme colors in one place (globals.css)
    - Accessibility: WCAG 2.1 AA compliant contrast throughout

---

## [2026-01-07]

### Added

- **PRD 26 (Partial): Development Stage Management System** - Dynamic stage tracking and display
  - **Database Schema** (`app_settings` table)
    - Created `app_settings` table with full PRD 26 spec (key, value, metadata, visibility controls)
    - Added `development_stage` setting with 5 stages: Pre-Alpha, Alpha, Beta, Product Hunt, Production
    - Added `stage_descriptions` with full metadata (title, emoji, tagline, what_it_means, known_limitations)
    - RLS policies: SuperAdmin full access, public read for display/general categories
  - **API & Hook**
    - `GET /api/admin/settings` - Returns settings visible to current user
    - `PATCH /api/admin/settings/:key` - Update setting (SuperAdmin only)
    - `useAppSettings()` hook with `getSetting()` and `updateSetting()` methods
  - **SuperAdmin Settings Page** (`/admin/settings`)
    - Visual stage selector with color-coded cards (purple/blue/amber/orange/green)
    - Badge visibility toggle switch
    - Mobile-responsive layout
    - Placeholder for future settings categories per PRD 26
    - Added to SuperAdmin menu via `adminPages.ts`
  - **Public Stage Info Page** (`/stage-info`)
    - Dynamic content from database (stage-specific descriptions)
    - Color-coded stage banner with emoji
    - "What This Means", "Known Limitations", "Roadmap" sections
    - Backwards-compatible: `/beta` redirects to `/stage-info`
  - **Footer Badge** (GlobalFooter.tsx)
    - Reads stage from database via `useAppSettings()`
    - Color-coded badge with pulse animation (matches stage)
    - Links to `/stage-info` for details
    - Respects `badge_visible` toggle (can be hidden by SuperAdmin)
- **PRD 25: User Preferences System** - Modular, extensible settings architecture
  - **Database Schema** - `user_preferences` table with default/override pattern
    - Navigation preferences (default_landing, primary_league_id)
    - Reminder preferences (reminder_style, dismissed_until)
    - Theme preferences (dark/light/system) - future-ready
    - Notification preferences (email/push settings) - future-ready
    - RLS policies for user-only access
    - Automatic updated_at trigger
  - **Type-Safe Registry Pattern** - Follows Slash Engineering best practices
    - `src/lib/settings/types.ts` - Base types and interfaces
    - `src/lib/settings/userPreferences.ts` - User settings registry
    - Compile-time + runtime type safety with Zod validation
    - Extensible: Add new settings with just registry + DB column
  - **Reusable Settings Components** - Unified across all settings contexts
    - `SettingsLayout` - Page wrapper with header, back link, tabbed nav
    - `SettingsNav` - Tabbed navigation component
    - `SettingsSection` - Groups related settings
    - `SettingsField` - Text/textarea inputs (wraps shadcn Input/Textarea)
    - `SettingsToggle` - Boolean switches (wraps shadcn Switch)
    - `SettingsSelect` - Dropdowns (wraps shadcn Select)
    - `SettingsRadioGroup` - Radio options with descriptions
    - All components use theme-aware CSS variables
  - **API Endpoints** - RESTful preferences management
    - `GET /api/user/preferences` - Fetch with defaults if not exists
    - `PATCH /api/user/preferences` - Update with validation
  - **React Hook** - `usePreferences()` with optimistic updates
    - Automatic fetching and caching
    - Single field or bulk updates
    - Rollback on error with toast notifications
  - **Settings Pages**
    - `/settings/profile` - Name, nickname, email (refactored)
    - `/settings/preferences` - Navigation, reminders, appearance
    - Tabbed navigation between sections
    - Mobile-responsive layout
  - **shadcn Components** - Added Switch, RadioGroup
- **PRD 24: WordPress-Style Menu Backend System** - Database-backed menu management
  - **Database Schema** - New tables for menu configuration
    - `menu_definitions` - Menu metadata (id, label, description)
    - `menu_items` - Individual menu items with full MenuItem interface support
    - `menu_locations` - Location assignments (public_header, app_header, admin_header, footer)
    - RLS policies for SuperAdmin management, public read access
    - Automatic updated_at triggers
  - **Data Migration** - Seeded all existing menuConfig.ts data to database
    - Converted all 8 menus (main, help, user, admin, public, 3 footer menus)
    - Preserved nested structure, visibility rules, and special flags
    - Migrated all menu location configurations
  - **API Routes** - Full CRUD for menu management
    - `GET /api/menus` - Public endpoint with database fallback
    - `GET /api/admin/menus` - List all menus (SuperAdmin)
    - `POST /api/admin/menus` - Create menu (SuperAdmin)
    - `GET/PATCH/DELETE /api/admin/menus/:menuId` - Manage single menu
    - `POST/PUT /api/admin/menus/:menuId/items` - Add/reorder items
    - `PATCH/DELETE /api/admin/menus/:menuId/items/:itemId` - Edit/delete items
  - **Frontend Hook** - `useMenuConfig()` with static fallback
    - Fetches from database via SWR caching
    - Falls back to menuConfig.ts if database empty/error
    - Provides `useMenu()` and `useMenuLocation()` helpers
    - Re-exports all utility functions (filterMenuByRole, prepareMenuItems, etc.)
  - **Admin UI** (`/admin/menus`) - Visual menu editor
    - Left sidebar menu selector
    - Drag-and-drop reordering with @dnd-kit
    - Add/edit/delete items with modal form
    - Support for nested submenu items
    - Role visibility toggles
    - Live preview (future enhancement placeholder)
  - **Components** - Modular admin components
    - `MenuList` - Sidebar menu selector
    - `MenuItemRow` - Draggable item with actions dropdown
    - `MenuItemForm` - Add/edit modal with full field support
  - **Configuration** - Added Menu Editor to SuperAdmin pages

---

## [2026-01-06]

### Added

- **PRD 23: World Leaderboard** - Platform-wide rankings across all leagues
  - **API** (`/api/leaderboard/global`)
    - Period filters: All Time, This Year, This Month, Last 30 Days, Last 7 Days, Custom
    - Comparison mode: Previous period, Same period last year, Custom range
    - SuperAdmin visibility toggle via `site_settings.global_leaderboard_enabled`
    - Modular badge calculation system for future extensibility
  - **Page** (`/leaderboard`) - World rankings with full filtering
    - Custom date range picker using `DateRangePicker` component
    - Period comparison with improvement percentages
    - Current user highlighted with world rank badge
    - Achievement badges displayed (Million Club, 500K, 100K, streaks)
    - Proper shadcn/theme-aware styling
  - **Navigation** - Added "🌍 World Leaderboard" to main menu
  - **New Badges** - `centurion` (100+ day streak), `legend_365` (365 day streak)
  
---

## [2026-01-05]

### Fixed

- **Theme Toggle Config** - Fixed light/dark mode toggle not working
  - Updated `tailwind.config.ts` to use `selector` strategy with `data-theme` attribute (required for `next-themes` integration)
  - Updated `layout.tsx` to use theme-aware variables (`bg-background text-foreground`) instead of hardcoded dark colors
  - Ensures `dark:` variants and theme switching works correctly

### Fixed - Emergency UI Repair
- **Light Mode Palette** - Softened from Stark White to Slate-50
  - Updated `globals.css` to use `hsl(210 40% 98%)` for background to reduce glare
  - Kept Cards as Pure White `hsl(0 0% 100%)` for proper depth and contrast
- **Component Styling** - Fixed "Invisible/Broken" UI in Light Mode
  - **RoadmapView**: Replaced legacy `bg-[rgb(var(--bg-base))]` with `bg-background`
  - **DateRangePicker**: Replaced injected CSS string interpolation with valid HSL values
  - **NavHeader/Footer**: Fixed Logo hover state to be visible in both Light (Black) and Dark (White) modes
  - **Universal**: Removed all instances of hardcoded `slate-950` backgrounds in favor of `bg-card` or `bg-background`
- **Build Fix** - Fixed `DateRangePicker` variable mismatch
  - Resolved `Cannot find name 'css'` type error by updating variable reference to `customStyles`
  - Applied missing `style` prop to container for component-specific variables

---

## [2026-01-05]

### Added

- **PRD 22: PWA & Offline Support** - Robust offline submission queue
  - **Offline Storage** (`src/lib/offline/`) - IndexedDB wrapper using `idb` library
    - Secure storage of steps, dates, and proof images (blobs)
    - **Security**: Queue limit (10 items), auto-cleanup (7 days), cleared on logout
  - **Hooks** (`src/hooks/`)
    - `useOfflineQueue`: Manages local queue state and storage limits
    - `useOfflineSync`: Automatic background sync when connection restored (with retries)
  - **UI Components**
    - `OfflineIndicator` (`src/components/ui/OfflineIndicator.tsx`): Status badge in NavHeader
    - `SubmissionForm`: Detects offline status, changes button to "Save Offline" (amber), queues submission
  - **PWA Polish**
    - **Service Worker**: `@ducanh2912/next-pwa` for offline App Shell caching (app opens offline)
    - **Install Prompt**: Smart "Install App" button in Header & Mobile Menu (iOS/Android awareness)
  - **Infrastructure**: No auth tokens stored locally; secure origin-locked IndexedDB

- **PRD 35: Duplicate Submission Conflict Resolution** - Smart handling of duplicate step entries
  - **ConflictResolutionDialog** (`src/components/forms/ConflictResolutionDialog.tsx`) - Side-by-side comparison modal
    - Shows existing vs new submission with verification status
    - Smart default recommendations (favors verified screenshots over manual entries)
    - Clear visual indicators for verified (✓), unverified (⏳), screenshot (📷), manual (✎)
  - **BatchConflictTable** (`src/components/forms/BatchConflictTable.tsx`) - Bulk conflict resolution UI
    - Selectable rows with per-row action dropdowns (Keep/Use New/Skip)
    - Bulk action toolbar for "Keep All Existing", "Use All New", "Skip All"
    - Smart pre-selection based on verification status
  - **Conflict Check API** (`/api/submissions/check-conflict`) - Pre-submission conflict detection
    - Checks if submissions exist for given dates
    - Returns existing submission details for UI comparison
  - **Resolve API** (`/api/submissions/resolve`) - Bulk conflict resolution endpoint
    - Supports keep_existing, use_incoming, skip actions
    - Triggers verification for screenshot submissions
    - Uses `withApiHandler` pattern for consistency
  - **useConflictCheck Hook** (`src/hooks/useConflictCheck.ts`) - Reusable conflict handling logic
    - `checkConflicts()` and `resolveConflicts()` functions
    - Smart default helpers: `getSmartDefault()`, `getRecommendationMessage()`
  - **SubmissionForm Integration** - Dialog appears on 409 conflict instead of error message
    - User can choose to keep existing or replace with new submission
    - Cleaner UX than previous "overwrite" checkbox approach

---

## [2026-01-05]

### Changed

- **Social Sharing Rebranding** - Updated all Twitter references to X (platform rebrand)
  - `useShare.ts` - Changed `SharePlatform` type from `"twitter"` to `"x"`
  - `ShareButton.tsx` - Updated button label and icon (🐦 → 𝕏)
  - `AchievementShareCard.tsx` - Renamed `shareToTwitter` → `shareToX`, updated UI
  - `LeagueInviteControl.tsx` - Updated share platform type and button
  - `AGENTS.md` - Updated Key Features list
  - Note: API URL remains `twitter.com/intent/tweet` for backward compatibility (recommended by X)

---

## [2026-01-05]

### Added

- **Global Step Submissions (League-Agnostic)** - Submit steps once, applies to all leagues
  - **Refactored `SubmitPage`** (`/submit-steps`) - Removed league selector, submissions are now global
  - **Backend Updates** (`/api/submissions`, `/api/leaderboard`) - Handles `league_id: null` and aggregates steps across user membership
  - **Database Migration** - `20260105175600_make_submission_league_nullable.sql` to relax `league_id` constraint
  - **Offline Support** - Detected offline status and warns user (submissions queued in future update)
  - **Error Handling** - Standardized `AppError` and `toast` usage in submission flow

- **Roadmap & Documentation Update**
  - **New Priorities** - Added PRDs for PWA/Offline (22), Global Leaderboard (23), Smart Engagement (24), Pricing (25)
  - **Restructured PRDs** - Renumbered Phase 9+ (PRDs 26-34) to reflect new build order

### Changed

- Renamed `/submit` page to `/submit-steps` for clearer URL
- Updated `menuConfig.ts` to point to new URL
- Fixed build error by adding `API_FETCH_FAILED` to `ErrorCode` enum

## [2026-01-05]

### Added

- **PRD 21: shadcn/ui Integration & Toast System** - Modern notification and dialog system
  - **Toast Notifications** - Replaced all browser `alert()` calls with shadcn toasts
    - Added `<Toaster />` to root layout
    - Success toasts: clipboard copy confirmations, proxy member links
    - Warning toasts: tour navigation requirements
    - Info toasts: placeholder functionality messages
  - **Confirmation Dialogs** - Replaced browser `confirm()` with accessible dialogs
    - New `ConfirmDialog` component (`src/components/ui/confirm-dialog.tsx`)
    - Supports destructive variant for delete actions
    - Loading state for async operations
  - **Form Components** - Installed 6 new shadcn form primitives
    - `input.tsx`, `select.tsx`, `checkbox.tsx`, `label.tsx`, `textarea.tsx`, `tooltip.tsx`
  - **Theme Toggle** - Light/Dark/System mode switcher
    - `ThemeProvider` wrapper using `next-themes` with `data-theme` attribute
    - `ModeToggle` dropdown component in NavHeader
    - Theme persists across sessions
  - **Joyride CSS Variables** - Tour styling now theme-aware
    - Added `--joyride-*` variables for dark and light modes in globals.css
    - Variables reference existing color tokens for consistency
  - **Files Modified/Created**:
    - `src/app/layout.tsx` - Added Toaster, ThemeProvider
    - `src/components/ui/confirm-dialog.tsx` - New reusable confirmation dialog
    - `src/components/theme-provider.tsx` - next-themes wrapper
    - `src/components/mode-toggle.tsx` - Theme switcher dropdown
    - `src/components/navigation/NavHeader.tsx` - Added ModeToggle, replaced alert with toast
    - `src/components/league/ProxyMemberManagement.tsx` - ConfirmDialog, toast notifications
    - `src/components/league/settings/DangerZone.tsx` - Toast notification
    - `src/components/forms/SubmissionForm.tsx` - Toast notification
    - `src/app/(dashboard)/league/[id]/page.tsx` - Toast notification
    - `src/app/globals.css` - Joyride CSS variables


- **PRD 20: Expandable Cards with Image Paste** - Click-to-expand cards with attachment support
  - **ExpandableCardModal** (`src/components/admin/ExpandableCardModal.tsx`) - Full detail view modal using shadcn Dialog
    - Editable title, description, status, priority, release target
    - Integrated attachment gallery with upload capability
    - Image paste zone for Ctrl+V / Cmd+V uploads
  - **Modular Attachments System** - Generic, reusable across all entity types
    - **Database**: New `attachments` table with polymorphic `entity_type` + `entity_id` pattern
    - **Types** (`src/types/attachments.ts`) - EntityType, Attachment, upload config/validation
    - **API** (`/api/attachments`) - GET/POST/DELETE endpoints with structured error responses
    - **Hook** (`useAttachments`) - Optimistic UI, file validation, error handling
  - **Reusable UI Components**:
    - `ImagePasteZone` - Clipboard paste, drag-drop, file picker with preview
    - `AttachmentGallery` - Thumbnail grid, lightbox view, delete buttons
  - **Error Handling System** (`src/lib/errors.ts`) - Future-proof error infrastructure
    - `AppError` class with typed `ErrorCode` enum
    - `reportError()` / `reportErrorClient()` for centralized logging
    - `normalizeError()` for converting any thrown value
    - Integrates with existing `logger.ts`
  - **Integration**:
    - KanbanBoard: Double-click card opens modal, attachment count badge
    - FeedbackList: Click row opens modal with full details
    - PRD Index updated (18, 19 marked complete; 20 in progress)
  - **Performance**: Optimized Kanban board interactions (fixed INP issue) by memoizing card handlers.
  - **UX**: Replaced jarring full-page reloads with seamless `router.refresh()` for Kanban bulk actions.

---

## [2026-01-04]

### Added

- **shadcn/ui Component Library** - Production-ready, accessible UI components
  - Initialized shadcn/ui with New York style (neutral base color, CSS variables)
  - **Components Added**:
    - `toast.tsx` + `use-toast.ts` - Toast notification system
    - `sonner.tsx` - Alternative toast implementation
    - `dialog.tsx` - Modal dialogs
    - `dropdown-menu.tsx` - Accessible dropdown menus
  - **Configuration**:
    - `components.json` - shadcn registry settings
    - Updated `tailwind.config.ts` with shadcn color tokens and `tailwindcss-animate`
    - Updated `globals.css` with dark-first shadcn CSS variables
  - **Compatibility Fixes**:
    - Made dark mode default in shadcn `:root` (matching app's dark-first design)
    - Added light mode via `[data-theme="light"]` selector (consistent with existing theme system)
    - Removed body style override to preserve existing theme system
    - Restored date utilities (`formatDate`, `getTodayUtc`, `getStepWeekRange`) in `utils.ts`
  - **Dependencies**: `tailwind-merge`, `@radix-ui/react-*` primitives, `lucide-react`, `sonner`

---

## [2026-01-03]

### Added

- **PRD 19: League Settings & Start Date** - New modular settings system for leagues
  - **League Settings Page** (`/league/[id]/settings`) for owners/admins
  - **Refactored Leaderboard Date Selection** - Replaced dual date inputs with a unified `DateRangePicker`
    - Unified component using `react-day-picker` and `date-fns`
    - Preserves persistence via URL and localStorage
    - Added to Design System (`/admin/design-system`)
  - **Start Date** - Configure a `counting_start_date` to ignore previous step history (fresh start)
  - **Modular Settings Components**:
    - `GeneralSettings`: Name, Description, Category, Week Start
    - `CompetitionSettings`: Start Date (with presets: Today, This Week, This Month), Max Members
    - `RulesSettings`: Manual Entry, Photo Requirements, Public Visibility
    - `DangerZone`: Delete league actions
  - **Enforcement**:
    - Backend API (`POST /api/submissions`) enforces `require_verification_photo` and `allow_manual_entry`.
    - `SubmissionForm` dynamically adapts UI based on league rules (e.g., hides photo upload if not required).
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
- **ShareButton** component (Web Share API + WhatsApp/X fallback)
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
