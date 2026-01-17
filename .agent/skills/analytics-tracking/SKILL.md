---
name: analytics-tracking
description: Event tracking with GA4 + PostHog, adding new events, and updating GTM
---

# Analytics Tracking Skill

## Overview

StepLeague uses a **dual-tracking architecture**:
- **GA4 (via GTM)**: Google Analytics for standard web analytics
- **PostHog SDK**: Session replay, feature flags, funnels, and product analytics

All events are pushed to both systems from a single `trackEvent()` call.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       analytics.ts                               │
│                                                                  │
│  trackEvent('event_name', { properties })                        │
│       │                                                          │
│       ├──────────────────▶ window.dataLayer.push() ──▶ GTM ──▶ GA4
│       │                                                          │
│       └──────────────────▶ posthog.capture() ──────────▶ PostHog │
└──────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/analytics.ts` | Main tracking library with all event methods |
| `src/components/analytics/PostHogProvider.tsx` | PostHog SDK initialization, consent-aware |
| `src/components/analytics/GoogleTagManager.tsx` | GTM loading with consent gates |
| `src/lib/consent/cookieConsent.ts` | Cookie consent helpers |

## Recently Added Events (Jan 2026)

| Event | Purpose | Parameters |
|-------|---------|------------|
| `proxy_claimed` | Tracks when a proxy user claims their profile | `proxy_id`, `submission_count`, `league_count` |
| `high_five_sent` | Tracks high-five engagement interactions | `recipient_id`, `action` (send/remove) |

## Adding a New Tracking Event

### Step 1: Add event to `analytics.ts`

```typescript
// In src/lib/analytics.ts, add to the `analytics` object:

export const analytics = {
    // ... existing events ...

    // Add your new event:
    myNewEvent: (someParam: string, anotherParam: number) => {
        trackEvent('my_new_event', {
            some_param: someParam,
            another_param: anotherParam,
            category: 'engagement',  // or 'conversion', 'navigation', etc.
            action: 'click',
        });
    },
};
```

### Step 2: Use it in your component

```typescript
import { analytics } from '@/lib/analytics';

function MyComponent() {
    const handleClick = () => {
        analytics.myNewEvent('value', 123);
    };
    return <button onClick={handleClick}>Do Thing</button>;
}
```

### Step 3: Done! (Usually)

The event now flows to **both GA4 and PostHog automatically**. No GTM changes needed!

## When GTM Updates ARE Required

You only need to update GTM if you want to:

1. **Create a GA4 "Key Event"** - Mark the event as a conversion in GA4
2. **Add custom dimensions** - Register new parameters in GA4
3. **Create GTM triggers** - Fire other tags based on this event

### GTM Manual Steps (if needed)

1. Log into [Google Tag Manager](https://tagmanager.google.com/)
2. Create a **Custom Event Trigger** with Event Name = `my_new_event`
3. Create a **GA4 Event Tag** that fires on this trigger
4. Add the event to GA4 as a "Key Event" if it's a conversion

> **Tell the user**: "To complete the tracking setup, you'll need to add a Custom Event trigger in GTM for `my_new_event` and optionally mark it as a Key Event in GA4."

## Event Naming Conventions

- Use **snake_case**: `league_created`, `steps_submitted`
- Use **past tense verbs**: `submitted`, `created`, `clicked`
- Max 40 characters
- No special prefixes: avoid `ga_`, `firebase_`, `google_`

## Parameter Naming

- Use **snake_case**: `league_id`, `step_count`
- Reuse existing parameters when possible
- Standard parameters: `user_id`, `league_id`, `method`, `category`, `action`, `component`

## User Identification

Handled automatically by `AuthProvider`:

```typescript
// In AuthProvider after login:
identifyUser(user.id, { display_name: user.display_name });

// On logout:
clearUser();
```

## Consent Requirements

Both GTM and PostHog respect the cookie consent banner. Analytics only load after `analytics` category consent is granted.

## PostHog Features Available

- **Session Replay**: Automatically recorded for all consented users
- **Feature Flags**: Use `posthogFeatureFlag('flag-name')` to check flags
- **Funnels**: Configure in PostHog dashboard based on events
- **A/B Testing**: Create experiments in PostHog, check variants with feature flags

## Removing GTM PostHog Tag

After this SDK integration, the "PostHog Tracking" custom HTML tag in GTM should be removed to avoid duplicate tracking.

**Steps:**
1. Go to [GTM](https://tagmanager.google.com/) → Your Container
2. Find "PostHog Tracking" tag (Custom HTML)
3. Delete it
4. Publish new container version

## Troubleshooting

### Events not showing in PostHog
1. Check consent was granted
2. Check `NEXT_PUBLIC_POSTHOG_KEY` is set
3. Check browser console for `[PostHog]` logs in development

### Events not in GA4
1. Check GTM Preview mode to see if events fire
2. Verify GA4 DebugView shows the event
3. Ensure GTM has a tag configured for this event

## Environment Variables

```env
# GA4 via GTM
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# PostHog SDK
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## MCP Servers for AI-Assisted Analytics Management

> **For a full list of available MCP servers and project-wide configuration, see [AGENTS.md](../../../AGENTS.md).**

Three MCP servers are configured for managing analytics via AI:

### GTM MCP Server (Stape) ✅ Write Access

**Purpose**: Create, modify, and delete GTM tags, triggers, variables, and containers.

**StepLeague Account**: `6331302038` (StepLeague)

**Capabilities**:
- Create/update/delete tags, triggers, variables
- Manage containers and workspaces
- Audit GTM configuration
- Set up GA4 event tags programmatically
- Preview and publish container versions

**Authentication**: OAuth-based (browser popup on first use)

**Example usages**:
- "List all GTM containers in my account"
- "Create a new GA4 event tag for `league_created` with a custom event trigger"
- "List all tags in the StepLeague container"
- "Get the live version of the container"

### GA4 MCP Server (Stape) 📊 Read-only

**Purpose**: Query GA4 reports and property information.

**StepLeague Property**: `517956149` (StepLeague WebApp, Account: `378957957`)

**Capabilities**:
- Run core reports (page views, sessions, conversions)
- Run realtime reports
- Get account summaries and property details
- List Google Ads links
- Get custom dimensions and metrics

**Authentication**: OAuth-based (browser popup on first use, same as GTM)

**Example usages**:
- "Get my GA4 account summaries"
- "What were my top 10 pages by sessions last week?"
- "Show realtime active users on the site"
- "Run a report of page views for the last 30 days"

### PostHog MCP Server 📊 Full Access

**Purpose**: Manage PostHog analytics, feature flags, experiments, and insights.

**Capabilities**:
- Create/update/query insights and dashboards
- Manage feature flags (create, update, delete)
- Create and monitor A/B test experiments
- Query event data and user analytics
- Manage surveys and actions
- Search PostHog documentation

**Authentication**: API key-based (configured in `.vscode/mcp.json`)

**Example usages**:
- "Get all feature flags in the project"
- "Create a new A/B test for the signup flow"
- "What are my top events in the last 7 days?"
- "Create an insight showing daily active users"


