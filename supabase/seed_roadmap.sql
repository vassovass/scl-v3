-- Seed script to migrate ROADMAP.md content to database
-- Run this ONCE to populate initial roadmap items
-- Date: 2025-12-24

-- ============================================================================
-- IN PROGRESS ITEMS (board_status = 'in_progress', is_public = true)
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order) VALUES
('feature', 'User preference for default landing page', 'Allow users to choose their default view: Submit Steps, Leaderboard, or Analytics when entering a league.', 'in_progress', true, 1),
('feature', 'Weekly summary (Stepweek) view', 'Performance highlights showing weekly statistics and achievements.', 'in_progress', true, 2);

-- ============================================================================
-- PLANNED SHORT TERM (board_status = 'todo', is_public = true)
-- ============================================================================

-- Notifications & Reminders
INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order) VALUES
('feature', 'Email reminders for daily submissions', 'Daily cron job to notify users who haven''t submitted their steps. Uses Supabase + Resend ($0/month).', 'todo', true, 10),
('feature', 'Weekly email digest', 'Summary email with league standings and stats for the week.', 'todo', true, 11),
('feature', 'Reminder opt-in/out preference', 'Allow users to control their notification preferences.', 'todo', true, 12),
('feature', 'Web Push notifications', 'Browser-based push notifications for reminders ($0/month).', 'todo', true, 13);

-- Analytics Enhancements
INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order) VALUES
('improvement', 'Consistent badge for users', 'Award badge to users who submitted every day in a period.', 'todo', true, 20),
('feature', 'Member detail panel', 'Per-user statistics popup showing individual performance.', 'todo', true, 21),
('feature', 'Export analytics to CSV', 'Download analytics data as CSV file.', 'todo', true, 22),
('feature', 'Chart visualizations', 'Visual trends and performance charts over time.', 'todo', true, 23);

-- Leaderboard Improvements
INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order) VALUES
('improvement', 'Common-days comparison display', 'Show comparison based only on days both users submitted.', 'todo', true, 30),
('feature', 'Head-to-head comparison mode', 'Compare two users directly with detailed stats.', 'todo', true, 31),
('feature', 'Historical leaderboard snapshots', 'View past leaderboard standings at specific dates.', 'todo', true, 32);

-- User Experience
INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order) VALUES
('feature', 'Achievement badges', 'Badges for streaks, milestones, and accomplishments.', 'todo', true, 40),
('feature', 'Light/Dark mode toggle', 'Theme switcher using CSS custom properties. Infrastructure ready in globals.css.', 'todo', true, 41);

-- ============================================================================
-- PLANNED MEDIUM TERM (board_status = 'backlog', is_public = true)
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order) VALUES
('feature', 'WhatsApp text reminders', 'Via Intercom integration (~$65/mo with startup discount).', 'backlog', true, 50),
('feature', 'In-app notification center', 'Centralized place to view all notifications.', 'backlog', true, 51),
('feature', 'Customizable reminder times', 'Per-user reminder time preferences.', 'backlog', true, 52),
('feature', 'League-wide announcements', 'Admins can broadcast messages to all league members.', 'backlog', true, 53),
('feature', 'League chat / comments', 'Social interaction within leagues.', 'backlog', true, 60),
('feature', 'Challenge mode (1v1)', 'Direct challenges between members with special rules.', 'backlog', true, 61),
('feature', 'Public leaderboards', 'Opt-in public visibility for leagues.', 'backlog', true, 62),
('feature', 'League admin panel', 'Member management, settings, and controls.', 'backlog', true, 70),
('feature', 'SuperAdmin dashboard', 'Site-wide analytics and management.', 'backlog', true, 71),
('feature', 'Bulk actions for submissions', 'Admin tools for managing multiple submissions.', 'backlog', true, 72),
('feature', 'Apple Health / Google Fit auto-sync', 'Automatic step import from health apps.', 'backlog', true, 80),
('feature', 'Strava integration', 'Connect with Strava for activity sync.', 'backlog', true, 81),
('feature', 'Webhook notifications', 'Push data to external services.', 'backlog', true, 82);

-- ============================================================================
-- LONG TERM / IDEAS (board_status = 'backlog', is_public = true)
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order) VALUES
('feature', 'AI Voice Coach "StepCoach"', 'WhatsApp voice calls with AI motivational coach using ElevenLabs (startup grant available).', 'backlog', true, 100),
('feature', 'Advanced analytics and insights', 'Premium tier analytics with deeper insights.', 'backlog', true, 101),
('feature', 'Custom league branding', 'Personalize league appearance with colors and logos.', 'backlog', true, 102),
('feature', 'Priority support', 'Premium tier with faster support response.', 'backlog', true, 103),
('feature', 'Mobile app (React Native/Flutter)', 'Native mobile application for iOS and Android.', 'backlog', true, 110),
('feature', 'Team leagues', 'Groups within leagues for team competitions.', 'backlog', true, 111),
('feature', 'Seasonal competitions with prizes', 'Time-limited competitions with rewards.', 'backlog', true, 112),
('feature', 'Telegram bot integration', 'Free alternative to WhatsApp for notifications.', 'backlog', true, 113);

-- ============================================================================
-- COMPLETED ITEMS (board_status = 'done', is_public = true, completed_at set)
-- ============================================================================

INSERT INTO feedback (type, subject, description, board_status, is_public, priority_order, completed_at) VALUES
('feature', 'Analytics Dashboard', 'Calendar heatmap and daily breakdown views.', 'done', true, 200, '2025-12-20'),
('feature', 'Social sharing', 'Web Share API with WhatsApp and Twitter integration.', 'done', true, 201, '2025-12-19'),
('feature', 'Mobile-responsive navigation', 'Hamburger menu for mobile devices.', 'done', true, 202, '2025-12-18'),
('feature', 'Footer with legal links', 'Privacy policy, terms of service links.', 'done', true, 203, '2025-12-17'),
('feature', 'Global feedback system', 'Feedback widget and admin dashboard.', 'done', true, 204, '2025-12-23'),
('feature', 'Profile settings page', 'User profile management.', 'done', true, 205, '2025-12-16'),
('feature', 'Batch step submission with AI extraction', 'Upload multiple screenshots with AI-powered step count extraction.', 'done', true, 206, '2025-12-15'),
('feature', 'Leaderboard filters', 'Period, verified status, and custom date range filters.', 'done', true, 207, '2025-12-14'),
('feature', 'User nicknames', 'Display name customization.', 'done', true, 208, '2025-12-13'),
('feature', 'Onboarding flow for new users', 'Guided walkthrough for first-time users.', 'done', true, 209, '2025-12-21');

-- ============================================================================
-- Verify counts
-- ============================================================================
-- SELECT board_status, COUNT(*) FROM feedback WHERE is_public = true GROUP BY board_status;
