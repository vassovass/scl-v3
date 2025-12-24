-- Comprehensive seed script with ALL historical features from CHANGELOG.md
-- Run this ONCE to populate the roadmap with completed features
-- Date: 2025-12-24
-- 
-- NOTE: This replaces seed_roadmap.sql with complete historical data
-- SAFE TO RE-RUN: Uses ON CONFLICT to skip existing entries

-- ============================================================================
-- 2025-12-24 Features
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, completed_at, target_release) VALUES
('feature', 'Modular Menu System', 'WordPress-style menu configuration with unlimited nesting, role-based visibility, and MenuRenderer component.', 'done', true, 1, '2025-12-24', 'now'),
('feature', 'Internal Kanban Board', 'Drag-and-drop task management at /admin/kanban for superadmins. Five columns: Backlog → Todo → In Progress → Review → Done.', 'done', true, 2, '2025-12-24', 'now'),
('feature', 'Public Roadmap Page', 'Users can view and vote on planned features at /roadmap. Trello-style Kanban layout with Now/Next/Later/Done columns.', 'done', true, 3, '2025-12-24', 'now'),
('feature', 'Roadmap Voting API', 'Priority voting system (1-10 scale) for roadmap items via /api/roadmap/vote.', 'done', true, 4, '2025-12-24', 'now'),
('feature', 'Database Schema: Roadmap Tables', 'Extended feedback table with board_status, is_public, target_release. New roadmap_votes and roadmap_comments tables with RLS.', 'done', true, 5, '2025-12-24', 'now')
ON CONFLICT (subject) WHERE is_public = true DO NOTHING;

-- ============================================================================
-- 2025-12-23 Features
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, completed_at, target_release) VALUES
('feature', 'Modular Navigation System', 'Refactored NavHeader into reusable NavDropdown and MobileMenu components with centralized config.', 'done', true, 10, '2025-12-23', 'now'),
('feature', 'Guided Onboarding System', '4 role-based tours with React Joyride: Dashboard Basics, Submit Steps, Leaderboard, League Owner. Auto-start for new users.', 'done', true, 11, '2025-12-23', 'now'),
('feature', 'SuperAdmin Dropdown Menu', 'Dynamic admin menu with auto-updating page list from adminPages.ts config.', 'done', true, 12, '2025-12-23', 'now'),
('feature', 'Design System Component Library', 'All 19 UI components documented with categories, Common UI Patterns, and Page Templates sections.', 'done', true, 13, '2025-12-23', 'now'),
('feature', 'Logo Color-Swap Hover Effect', 'Step and League text swap colors on hover in NavHeader and GlobalFooter.', 'done', true, 14, '2025-12-23', 'now'),
('feature', 'Global Feedback System', 'Floating feedback widget (💬) with screenshot capture using html2canvas. Supports Bug/Feature/General/Positive/Negative types.', 'done', true, 15, '2025-12-23', 'now'),
('feature', 'Admin Feedback Dashboard', 'List view at /admin/feedback showing all feedback with status tracking and screenshot preview.', 'done', true, 16, '2025-12-23', 'now');

-- ============================================================================
-- 2025-12-22 Features
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, completed_at, target_release) VALUES
('feature', 'Design System (CSS Design Tokens)', 'Modular CSS custom properties in globals.css: brand colors, utility classes (.btn-primary, .glass-card, .text-gradient), animations.', 'done', true, 20, '2025-12-22', 'now'),
('feature', 'Home Page Preview (Strava-inspired)', 'New /home-preview with animated gradient mesh, glassmorphism feature cards, How It Works section.', 'done', true, 21, '2025-12-22', 'now'),
('feature', 'Design System Admin Page', 'Live examples of all design tokens at /admin/design-system (superadmin-only).', 'done', true, 22, '2025-12-22', 'now'),
('feature', 'Proxy Members System', 'League owners can create placeholder profiles and submit steps on behalf of users who haven''t signed up yet.', 'done', true, 23, '2025-12-22', 'now'),
('feature', 'Proxy Member Management UI', 'Component for create, link, and delete proxy member functionality.', 'done', true, 24, '2025-12-22', 'now');

-- ============================================================================
-- 2025-12-21 Features
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, completed_at, target_release) VALUES
('feature', 'Analytics Dashboard', 'Calendar heatmap and daily breakdown table for visualizing step submission patterns.', 'done', true, 30, '2025-12-21', 'now'),
('feature', 'Social Sharing (ShareButton)', 'Web Share API with WhatsApp and Twitter fallback for sharing achievements.', 'done', true, 31, '2025-12-21', 'now'),
('feature', 'Daily Breakdown API', 'Flexible grouping (3-day, 5-day, weekly) for analytics data.', 'done', true, 32, '2025-12-21', 'now'),
('feature', 'Calendar API', 'Monthly submission coverage data for heatmap visualization.', 'done', true, 33, '2025-12-21', 'now'),
('feature', 'Mobile Hamburger Menu', 'Slide-out drawer navigation for mobile devices.', 'done', true, 34, '2025-12-21', 'now'),
('feature', 'GlobalFooter with Legal Links', 'Footer component with Privacy, Security, Beta page links.', 'done', true, 35, '2025-12-21', 'now'),
('feature', 'Dropdown Navigation Menus', 'Desktop dropdowns for League, Actions, and User profile sections.', 'done', true, 36, '2025-12-21', 'now'),
('feature', 'Dynamic OG Share Links', 'Shareable URLs with preview images showing rank, steps, and period.', 'done', true, 37, '2025-12-21', 'now'),
('feature', 'OG Image API', 'Generates branded preview images with rank and steps at /api/og.', 'done', true, 38, '2025-12-21', 'now'),
('feature', 'Share Page with OG Metadata', 'Dynamic Open Graph metadata for social previews at /share/[id].', 'done', true, 39, '2025-12-21', 'now'),
('feature', 'Compact Calendar Heatmap', 'Smaller squares with submission ratio displayed on hover.', 'done', true, 40, '2025-12-21', 'now'),
('feature', 'Submit Another Batch Button', 'Quick action to submit another batch after completing one.', 'done', true, 41, '2025-12-21', 'now'),
('feature', 'Resend Confirmation Email', 'Button on sign-in page when email not confirmed.', 'done', true, 42, '2025-12-21', 'now');

-- ============================================================================
-- 2025-12-20 Features
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, completed_at, target_release) VALUES
('feature', 'Batch Step Submission with AI', 'Multi-image upload with Gemini AI extraction for automatic step counting.', 'done', true, 50, '2025-12-20', 'now'),
('feature', 'DatePicker Component', 'Date selection with quick-select buttons (Yesterday, Today, etc.).', 'done', true, 51, '2025-12-20', 'now'),
('feature', 'Profile Settings Page', 'User can update nickname and display name.', 'done', true, 52, '2025-12-20', 'now'),
('feature', 'Leaderboard Filters', 'Period selector (week, month, year, all-time), verified toggle, custom date range.', 'done', true, 53, '2025-12-20', 'now'),
('feature', 'Legal Pages', 'Privacy Policy, Security, and Beta Info pages.', 'done', true, 54, '2025-12-20', 'now');

-- ============================================================================
-- 2025-12-19 Features
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, completed_at, target_release) VALUES
('feature', 'League Soft Delete', 'Leagues can be soft-deleted with deleted_at and deleted_by tracking.', 'done', true, 60, '2025-12-19', 'now'),
('feature', 'Submission Controls', 'Flagged submissions, flag reasons, and backfill limits.', 'done', true, 61, '2025-12-19', 'now'),
('feature', 'SuperAdmin Utilities', 'Debug tools and logs endpoint for superadmins.', 'done', true, 62, '2025-12-19', 'now'),
('feature', 'Auto-Redirect to Dashboard', 'Logged-in users redirected from home to dashboard automatically.', 'done', true, 63, '2025-12-19', 'now'),
('feature', 'Dashboard Stats', 'Member count, user rank, and weekly steps on dashboard.', 'done', true, 64, '2025-12-19', 'now');

-- ============================================================================
-- PLANNED FEATURES (from original ROADMAP.md - Now/Next/Later)
-- ============================================================================

-- NOW (actively being worked on)
INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, target_release) VALUES
('feature', 'User preference for default landing page', 'Allow users to choose their default view: Submit Steps, Leaderboard, or Analytics.', 'in_progress', true, 100, 'now'),
('feature', 'Weekly summary (Stepweek) view', 'Performance highlights showing weekly statistics and achievements.', 'in_progress', true, 101, 'now');

-- NEXT (coming soon)
INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, target_release) VALUES
('feature', 'Email reminders for daily submissions', 'Daily cron job to notify users who haven''t submitted their steps.', 'todo', true, 110, 'next'),
('feature', 'Weekly email digest', 'Summary email with league standings and stats.', 'todo', true, 111, 'next'),
('feature', 'Web Push notifications', 'Browser-based push notifications for reminders.', 'todo', true, 112, 'next'),
('feature', 'Light/Dark mode toggle', 'Theme switcher using CSS custom properties.', 'todo', true, 113, 'next');

-- LATER (on the roadmap)
INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, target_release) VALUES
('feature', 'Achievement badges', 'Badges for streaks, milestones, and accomplishments.', 'backlog', true, 120, 'later'),
('feature', 'Chart visualizations', 'Visual trends and performance charts over time.', 'backlog', true, 121, 'later'),
('feature', 'Member detail panel', 'Per-user statistics popup.', 'backlog', true, 122, 'later'),
('feature', 'Export analytics to CSV', 'Download analytics data as CSV.', 'backlog', true, 123, 'later'),
('feature', 'Head-to-head comparison', 'Compare two users directly.', 'backlog', true, 124, 'later'),
('feature', 'Apple Health / Google Fit sync', 'Automatic step import from health apps.', 'backlog', true, 130, 'later'),
('feature', 'Mobile app (React Native)', 'Native mobile application.', 'backlog', true, 131, 'later');

-- ============================================================================
-- Verify: Show counts by status and release
-- ============================================================================
-- SELECT target_release, board_status, COUNT(*) FROM feedback WHERE is_public = true GROUP BY target_release, board_status ORDER BY target_release, board_status;
