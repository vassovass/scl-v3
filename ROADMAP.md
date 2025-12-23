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

- [x] Analytics Dashboard (calendar heatmap, daily breakdown)
- [x] Social sharing (Web Share API + WhatsApp/Twitter)
- [x] Mobile-responsive navigation with hamburger menu
- [x] Footer with legal links
- [x] Global feedback system (Widget + Admin Dashboard)
- [x] Profile settings page
- [x] Batch step submission with AI extraction
- [x] Leaderboard filters (period, verified, custom dates)
- [x] User nicknames
- [x] Onboarding flow for new users

---

*Last updated: 2025-12-22*
