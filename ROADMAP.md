# ROADMAP.md - Feature Roadmap

> Proposed future features for StepLeague v3. Items may be added, removed, or reprioritized.
> 
> **Current Stage:** Alpha (friends & family testing)

---

## In Progress
*Currently being worked on*

- [ ] User preference for default landing page (Submit, Leaderboard, or Analytics)
- [ ] Weekly summary ("Stepweek") view with performance highlights

---

## Planned (Short Term) - Alpha Phase

### Notifications & Reminders (Priority)
*Goal: Remind users to submit their steps daily*

- [ ] **Email reminders** - Daily cron job to notify users who haven't submitted (Supabase + Resend, **$0/month**)
- [ ] Weekly email digest with league summary and stats
- [ ] User preference to opt-in/out of reminders
- [ ] Web Push notifications (browser-based, **$0/month**)

### Analytics Enhancements
- [ ] "Consistent" badge for users who submitted every day in period
- [ ] Member detail panel (per-user statistics popup)
- [ ] Export analytics data to CSV
- [ ] Chart visualizations (trends, performance over time)

### Leaderboard Improvements
- [ ] Common-days comparison display in table
- [ ] Head-to-head comparison mode
- [ ] Historical leaderboard snapshots

### User Experience
- [ ] Achievement badges (streaks, milestones)
- [ ] **Light/Dark mode toggle** - Theme switcher using CSS custom properties (infrastructure ready in `globals.css`)

---

## Planned (Medium Term) - Growth Phase

### Enhanced Notifications
*When user base grows beyond free tier limits*

- [ ] **WhatsApp text reminders** via Intercom (~$65/mo with startup discount)
- [ ] In-app notification center
- [ ] Customizable reminder times per user
- [ ] League-wide announcements from admins

### Social Features
- [ ] League chat / comments
- [ ] Challenge mode (1v1 challenges between members)
- [ ] Public leaderboards (opt-in)

### Admin Features
- [ ] League admin panel (member management, settings)
- [ ] SuperAdmin dashboard (site-wide analytics)
- [ ] Bulk actions for submissions

### Integrations
- [ ] Apple Health / Google Fit auto-sync
- [ ] Strava integration
- [ ] Webhook notifications

---

## Ideas (Long Term) - Premium Features
*Under consideration, not committed*

### Premium Tier Features
- [ ] **AI Voice Coach "StepCoach"** - WhatsApp voice calls with AI motivational coach (ElevenLabs, startup grant available)
- [ ] Advanced analytics and insights
- [ ] Custom league branding
- [ ] Priority support

### Platform Expansion
- [ ] Mobile app (React Native or Flutter)
- [ ] Team leagues (groups within leagues)
- [ ] Seasonal competitions with prizes
- [ ] Telegram bot integration (free alternative to WhatsApp)

---

## Startup Programs to Apply For
*Free/discounted tools for bootstrapped startups*

| Platform | Benefit | Status |
|----------|---------|--------|
| Intercom Early Stage | 90% off Year 1 (~$65/mo) | [ ] Apply |
| ElevenLabs Startup Grants | 12 months free (33M credits) | [ ] Apply |
| Resend | 3,000 emails/mo free | [ ] Already available |

---

## Completed
*Recently shipped features*

- [x] SuperAdmin theme mode controls (default + allowed modes)
- [x] Theme toggle shows "coming soon" hints for disabled modes
- [x] Build warning cleanup (viewport theme colors, dynamic API routes, IndexedDB guard)
- [x] Desktop dropdown navigation fix (Submit Steps link works reliably on desktop)
- [x] League overview stats endpoint (`/api/leagues/[id]/stats`)
- [x] Consent-gated analytics loading + reduced Workbox noise from blocked endpoints
- [x] Edge middleware compatibility fix (avoid supabase-js in middleware runtime)
- [x] **Modular Menu System** (centralized config, role-based visibility, unlimited nesting)
- [x] **Internal Kanban Board** (`/admin/kanban`) - drag-and-drop task management
- [x] **Public Roadmap with Voting** (`/roadmap`) - users can vote on priorities
- [x] Analytics Dashboard (calendar heatmap, daily breakdown)
- [x] Social sharing (Web Share API + WhatsApp/Twitter)
- [x] Mobile-responsive navigation with hamburger menu
- [x] Footer with legal links
- [x] Global feedback system (Widget + Admin Dashboard)
- [x] Profile settings page
- [x] Batch step submission with AI extraction
- [x] Leaderboard filters (period, verified, custom dates)
- [x] User nicknames
- [x] **Global Step Submissions** (League-agnostic steps)
- [x] Onboarding flow for new users
- [x] **PWA & Offline Support** (Offline submission queue, auto-sync, installable)
- [x] **World Leaderboard** (Platform-wide rankings, meta-achievements)

---

*Last updated: 2026-01-13*
