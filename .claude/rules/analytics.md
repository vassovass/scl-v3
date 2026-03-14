---
description: GTM dataLayer, event tracking, naming conventions, PostHog + GA4
paths:
  - src/lib/analytics*
  - src/components/analytics/**
  - src/components/GoogleTagManager*
  - src/components/CookieConsent*
---

# Analytics & Tracking

## Architecture
All tracking goes through **GTM dataLayer** — no direct SDK integrations. GTM routes events to GA4, PostHog, and other destinations.

## Core API
```typescript
import { analytics, trackInteraction, trackComponentView } from '@/lib/analytics';

// Domain events
analytics.signUp('google');
analytics.leagueCreated(leagueId, leagueName);

// Generic tracking
trackComponentView('LeaderboardCard', 'league_page');
trackInteraction('SubmitButton', 'click', 'submit_steps_btn');
```

## Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Events | snake_case | `league_created`, `steps_submitted` |
| Components | PascalCase | `LeaderboardCard`, `SubmitButton` |
| Parameters | snake_case | `league_id`, `step_count` |

## Data Attributes (Auto-Tracking)
```html
<button data-track-click="submit_steps_btn">Submit</button>
<form data-track-submit="step_form">...</form>
<div data-track-view="leaderboard_card">...</div>
```

## Event Categories
`conversion`, `engagement`, `navigation`, `filter`, `ai`, `support`, `experiment`, `performance`, `error`

## Module Namespaces
- `analytics.leaderboard.*` — leaderboard interactions
- `analytics.kanban.*` — kanban board events
- `analytics.filters.*` — filter usage
- `analytics.ai.*` — AI feature usage
- `analytics.support.*` — support/feedback events

## User Identity
```typescript
import { identifyUser, clearUser } from '@/lib/analytics';
identifyUser(user.id, { email, name, role });
clearUser(); // on logout
```

## Key Files
- `src/lib/analytics.ts` — core tracking functions
- `src/components/GoogleTagManager.tsx` — GTM script loader
- `src/components/CookieConsent.tsx` — consent management
