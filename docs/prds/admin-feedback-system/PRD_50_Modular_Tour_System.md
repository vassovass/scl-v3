# PRD 50: Modular Onboarding Tour System v2.0

> **Status:** In Progress (Phase 5/6 - Admin Dashboard)
> **Priority:** P1 (High - Performance & UX Critical)
> **Effort:** 3-4 weeks
> **Dependencies:** React Joyride v2.9.3, shadcn/ui, PostHog, react-i18next, Google Tag Manager, Supabase
> **MCPs Available:** PostHog MCP, Google Tag Manager MCP, Supabase MCP
> **Target:** v3.1.0
> **Last Updated:** 2026-01-24

---

## Executive Summary

Complete **ground-up rebuild** of StepLeague's onboarding tour system with:
- 🎯 **Modular architecture** - 7 tours, 42 steps (up from 5 tours, 28 steps)
- ⚡ **Performance** - <150ms INP (down from 445ms)
- 🌍 **Mobile-first** responsive design with character limits
- 🧪 **A/B testing** ready with PostHog integration
- 🌐 **i18n support** with react-i18next
- 🎨 **Interactive tours** - users can explore while learning
- 📊 **Comprehensive analytics** - PostHog MCP, GTM MCP, Supabase MCP (automatic tracking)
- 🔍 **Retention analysis** - conversion rates, cohort comparison, drop-off heatmaps
- 📈 **12 proactive future-proofing items**

This PRD follows StepLeague's architecture philosophy: **modular over monolithic, future-thinking, defensive programming**.

---

## Problem Statement

### Current Issues (VERIFIED)

1. **Performance Crisis:** 445ms INP on tour "Next" button
   - 283.1ms input delay + 145ms processing
   - 122% over Google's 200ms "Good" threshold
   - Caused by multiple synchronous state updates

2. **Monolithic Architecture:** 652-line provider file
   - All 28 tour steps hardcoded inline
   - No separation of concerns
   - Hard to maintain and update

3. **No Versioning:** Tours can't be updated without resetting ALL user progress

4. **Limited Analytics:** No tracking of:
   - Tour completion rates
   - Drop-off points
   - Auto-start vs manual effectiveness

5. **Missing Features:**
   - ❌ Mobile responsiveness
   - ❌ A/B testing capability
   - ❌ Internationalization (i18n)
   - ❌ Interactive step validation
   - ❌ Feature flag integration

### Audit Results

**Current State:**
- 5 tours across 28 steps
- 3 auto-start triggers (dashboard, submit-steps, leaderboard)
- No modularization - all tours inline in `OnboardingProvider.tsx` (652 lines)
- Custom modal for feedback (not shadcn)
- Static completion tracking

**Files Affected:**
- `src/components/providers/OnboardingProvider.tsx` ← **TO BE DELETED**

---

## User Requirements (CONFIRMED)

✅ **Tour Coverage:** All pages (Dashboard, League Creation, Submit Steps, Leaderboard, Analytics, Settings, Admin)
✅ **Trigger Strategy:** Auto-start on first visit (skippable)
✅ **Tour Depth:** Mix of quick highlights (3-5 steps) and detailed walkthroughs (8-12 steps)
✅ **Build Priority:** All at once for comprehensive rollout
✅ **Mobile Support:** Responsive with character limits
✅ **A/B Testing:** PostHog experimentation framework
✅ **i18n:** react-i18next with lazy-loading
✅ **Interactive Steps:** Validation-based task completion

**CRITICAL CLARIFICATION:**
- ✅ **Menu Blocking Prevention** - This was a previous issue that **has been fixed**. Tours must NOT block menu clicks. This is a SOLVED problem, not a new issue.

---

## Research & Best Practices

> **FOR IMPLEMENTATION AGENT:** You MUST research and validate these best practices before implementing. The sources below are starting points - you should search for additional 2026 best practices.

### 📚 Tour UX Best Practices

**Sources:**
- [Appcues: Product Tour UI/UX Patterns](https://www.appcues.com/blog/product-tours-ui-patterns)
- [Userpilot: How to Create Product Tours](https://userpilot.com/blog/create-product-tours/)
- [Userflow: Ultimate Guide to Product Tours](https://www.userflow.com/blog/the-ultimate-guide-to-product-tours-boost-user-onboarding-and-engagement)

**Key Findings:**
1. **Keep tours short:** 3-5 steps for focused tours (📊 industry standard)
2. **Progressive disclosure:** Onboard to each feature as users progress (not all at once)
3. **Interactive > Passive:** Action-driven tooltips have **60% higher completion rates**
4. **Hotspots for discovery:** Least invasive pattern for optional guidance
5. **Personalization:** Segmented tours reduce time-to-value

**Business Impact (Verified):**
- ✅ **40% reduction** in support tickets
- ✅ **15% higher** feature adoption with interactive tours
- ✅ **60% completion rate** (vs 40-50% industry average)

### 📱 Mobile Tooltip Best Practices

**Sources:**
- [Nudge: Mobile Tooltips Guide](https://www.nudgenow.com/blogs/tooltips-mobile-apps)
- [UserGuiding: Mobile Tooltip Design](https://userguiding.com/blog/mobile-tooltip)
- [Mockplus: Tooltip UI Design](https://www.mockplus.com/blog/post/tooltip-ui-design)

**MANDATORY Mobile Requirements:**
```
✅ Header: 60 characters maximum
✅ Body: 130 characters maximum
✅ Lines: 3 lines maximum
✅ Limit tooltips: 1-3 per tour on mobile (vs 5-11 on desktop)
✅ Placement: Do NOT block related important content
✅ Responsive sizing: Adjust font, spacing, layout for small screens
```

**Mobile-Specific Considerations:**
- Tooltips must be **responsive** - adjust dynamically to screen size/orientation
- Use **sufficient contrast** with UI (WCAG 2.1 AA minimum: 4.5:1)
- Position close to UI element **without covering it**
- Maintain **consistent design** aligned with brand

### 🔄 Interactive Tour Best Practices

**Sources:**
- [React Joyride: Props Documentation](https://docs.react-joyride.com/props)
- [Telerik: Interactive Guided Tours](https://www.telerik.com/blogs/how-to-create-interactive-guided-tours-web-applications-react-joyride)
- [Smashing Magazine: Product Tours in React](https://www.smashingmagazine.com/2020/08/guide-product-tours-react-apps/)

**CRITICAL: Allowing Menu Clicks During Tour**

**✅ THIS IS BEST PRACTICE** (Validated by research):

From React Joyride official docs:
- `spotlightClicks: true` - "allows mouse and touch events through the spotlight"
- `disableOverlay: true` - "disables the overlay that blocks clicks"
- **Purpose:** "Enable interactive, hands-on tours where users learn by doing"

From UX Research (Appcues, Userpilot):
- **Action-driven tooltips** are highly effective for onboarding
- **Interactive beats passive** - users retain **75% more** when they interact
- **Exploration encourages adoption** - users don't feel "trapped" in tour

**Why it's critical for StepLeague:**
1. Users need to **explore while learning** - forced linear progression frustrates
2. Menu navigation is **core functionality** - must be accessible during onboarding
3. **Natural discovery flow** - click away, explore feature, return to tour
4. **Reduces abandonment** - users don't feel trapped

**Implementation:**
```typescript
{
  id: 'nav-submit-steps',
  target: '[data-tour="nav-submit-steps"]',
  content: '📸 This is where you submit steps...',
  placement: 'bottom',
  disableOverlay: true,    // ✅ Allows clicking outside tooltip
  spotlightClicks: true,   // ✅ Allows clicking highlighted element
}
```

### 🧪 A/B Testing with PostHog

**Sources:**
- [PostHog: Experiments Documentation](https://posthog.com/docs/experiments)
- [PostHog: A/B Testing Best Practices](https://posthog.com/docs/experiments/best-practices)
- [PostHog: How to Set Up Next.js A/B Tests](https://posthog.com/tutorials/nextjs-ab-tests)

**Key Implementation Patterns:**

**1. Test Onboarding Flows (Common Use Case):**
```typescript
// Example hypothesis from PostHog docs:
"Showing a short tutorial video during onboarding will help users
understand how to use our product, resulting in more successful
interactions, fewer support queries, and reduced churn."
```

**2. PostHog Best Practices:**
- ✅ **Start small:** Test with 5% rollout for a few days
- ✅ **Filter ineligible users:** Don't include users who already completed tour
- ✅ **Use recommended running time:** PostHog calculates minimum sample size
- ✅ **Track multiple metrics:** See how experiments affect other user journeys

**3. Tour Variant Testing:**
```typescript
// From PostHog Next.js tutorial pattern:
const variant = useFeatureFlagVariantKey('tour-experiment');

const tourToShow = variant === 'control'
  ? dashboardTourControl
  : dashboardTourConcise;
```

**4. Event Tracking:**
```typescript
// Track tour events (from PostHog experiments docs)
posthog.capture('tour_completed', {
  tour_id: 'dashboard-v1',
  variant: variant,
  completion_type: 'finished', // or 'skipped'
});
```

### 🌐 Internationalization (i18n)

**Sources:**
- [Glorywebs: Internationalization in React 2026](https://www.glorywebs.com/blog/internationalization-in-react)
- [BureauWorks: React i18n Best Practices](https://www.bureauworks.com/blog/react-internationalization-best-practices)
- [Creole Studios: React-i18next Guide](https://www.creolestudios.com/react-i18next-simplifying-internationalization-in-react/)

**Popular React i18n Libraries (2026):**
1. **react-i18next** ⭐ (RECOMMENDED) - Most popular, highly flexible, easy to integrate
2. react-intl (FormatJS) - Powerful formatting tools
3. next-intl - Tailored for Next.js (we're using Next.js 15!)
4. LinguiJS - Lightweight with CLI tools

**i18n Best Practices (MANDATORY):**

**1. Organize Translation Files**
```json
// src/locales/en/tours.json
{
  "dashboard": {
    "intro": {
      "title": "Welcome to StepLeague!",
      "content": "Let's take a quick tour to show you around. This will only take 3 minutes."
    },
    "nav_submit_steps": {
      "content": "📸 **Most Important!** This is where you submit your daily steps."
    }
  }
}
```

**2. Separate Content from Code**
- ❌ **NEVER** hardcode strings in JSX
- ✅ **ALWAYS** use translation keys: `t('dashboard.intro.content')`

**3. Use Hooks and Context**
```typescript
// From react-i18next best practices:
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation('tours');
const content = t('dashboard.intro.content');
```

**4. Lazy-Load Languages**
```typescript
// Performance optimization from BureauWorks guide:
import('locales/fr/tours.json').then(module => {
  i18n.addResourceBundle('fr', 'tours', module.default);
});
```

**5. RTL Support**
- Right-to-left languages (Arabic, Hebrew)
- Auto-detect via `i18n.dir(i18n.language)`
- Flip tooltip placement: `left` ↔ `right`

**6. Date/Currency Formatting**
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat`
- Example: "3 minutes" → "3 دقائق" (Arabic)

**Strategic Benefits:**
- 📉 **Lower localization costs** - extraction easier when built-in from start
- ⚡ **Faster development** - shared infrastructure reduces rework
- 🌍 **Better UX** - content in user's language, formatted naturally
- 📈 **Scalability** - launch in new markets with fewer code changes

---

## Comprehensive Analytics & Tracking System

> **FOR IMPLEMENTATION AGENT:** StepLeague has **3 MCP integrations** available for analytics. You MUST use ALL of them for comprehensive tour tracking. This section is CRITICAL for measuring tour effectiveness.

### Available MCPs

1. **PostHog MCP** - Primary analytics platform (user behavior, funnels, retention)
2. **Google Tag Manager MCP** - GA4 integration (conversion tracking, custom events)
3. **Supabase MCP** - Database persistence (tour completion data, user cohorts)

### Analytics Strategy Overview

**Multi-Layer Tracking Approach:**
```
┌─────────────────────────────────────────────────────────────┐
│                    TOUR INTERACTION                         │
│                  (User clicks "Next")                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├──► PostHog MCP ────────► Real-time analytics
                 │                          - Event tracking
                 │                          - Session replay
                 │                          - Funnels
                 │                          - Retention cohorts
                 │
                 ├──► GTM MCP ─────────────► GA4 integration
                 │                          - Conversion tracking
                 │                          - Custom dimensions
                 │                          - Ecommerce events
                 │
                 └──► Supabase MCP ────────► Database storage
                                             - Tour completions
                                             - User profiles
                                             - Cohort analysis
```

### 1. PostHog MCP Integration (PRIMARY)

**Purpose:** Real-time behavioral analytics, session replay, conversion funnels, retention analysis

**Research Sources:**
- [PostHog: Capturing Events](https://posthog.com/docs/product-analytics/capture-events)
- [PostHog: User Properties](https://posthog.com/docs/product-analytics/user-properties)
- [PostHog: Session Replay](https://posthog.com/docs/session-replay)
- [PostHog: Retention Analysis](https://posthog.com/docs/product-analytics/retention)

**File:** `src/lib/tours/analytics.ts` (EXPANDED)

```typescript
import { usePostHog } from 'posthog-js/react';

/**
 * Comprehensive tour analytics with PostHog MCP
 *
 * EVENTS TRACKED (Automatic):
 * 1. tour_started
 * 2. tour_step_viewed
 * 3. tour_step_completed
 * 4. tour_completed
 * 5. tour_skipped
 * 6. tour_drop_off
 * 7. tour_validation_success
 * 8. tour_validation_failure
 * 9. tour_feedback_submitted
 * 10. tour_menu_interaction (during tour)
 *
 * USER PROPERTIES SET:
 * - tours_completed (array)
 * - tours_skipped (array)
 * - total_tours_completed (count)
 * - first_tour_completion_date
 * - last_tour_completion_date
 * - tour_completion_rate (%)
 * - favorite_tour_category
 */

export class TourAnalytics {
  private posthog: ReturnType<typeof usePostHog>;
  private sessionStartTime: number | null = null;

  constructor(posthog: ReturnType<typeof usePostHog>) {
    this.posthog = posthog;
  }

  /**
   * Track tour start
   *
   * PostHog MCP: Captures event + sets user properties
   */
  trackTourStart(
    tourId: string,
    tourName: string,
    category: string,
    trigger: 'auto' | 'manual',
    variant?: string | null
  ) {
    this.sessionStartTime = Date.now();

    this.posthog?.capture('tour_started', {
      // Event properties
      tour_id: tourId,
      tour_name: tourName,
      tour_category: category,
      trigger_type: trigger,
      experiment_variant: variant || 'control',

      // Context
      $set_once: {
        first_tour_start_date: new Date().toISOString(),
      },

      // Session tracking
      session_start_time: this.sessionStartTime,
    });

    // Set user property for active tour
    this.posthog?.setPersonProperties({
      current_active_tour: tourId,
      current_tour_category: category,
    });
  }

  /**
   * Track step view (every step seen)
   *
   * PostHog MCP: Creates granular funnel for drop-off analysis
   */
  trackStepView(
    tourId: string,
    stepId: string,
    stepIndex: number,
    totalSteps: number
  ) {
    this.posthog?.capture('tour_step_viewed', {
      tour_id: tourId,
      step_id: stepId,
      step_index: stepIndex,
      total_steps: totalSteps,
      progress_percentage: ((stepIndex + 1) / totalSteps) * 100,

      // For funnel analysis
      $funnel_step: `${tourId}_step_${stepIndex}`,
    });
  }

  /**
   * Track step completion (user clicked "Next")
   *
   * PostHog MCP: Tracks progression through tour
   */
  trackStepComplete(
    tourId: string,
    stepId: string,
    stepIndex: number,
    totalSteps: number,
    timeOnStep: number
  ) {
    this.posthog?.capture('tour_step_completed', {
      tour_id: tourId,
      step_id: stepId,
      step_index: stepIndex,
      total_steps: totalSteps,
      time_on_step_ms: timeOnStep,

      // Engagement metrics
      engagement_score: this.calculateEngagementScore(timeOnStep, stepIndex),
    });
  }

  /**
   * Track tour completion
   *
   * PostHog MCP: Updates user profile + triggers retention cohort
   */
  async trackTourComplete(
    tourId: string,
    tourName: string,
    category: string,
    completionType: 'finished' | 'skipped',
    totalTime: number,
    variant?: string | null
  ) {
    const sessionDuration = this.sessionStartTime
      ? Date.now() - this.sessionStartTime
      : totalTime;

    this.posthog?.capture('tour_completed', {
      tour_id: tourId,
      tour_name: tourName,
      tour_category: category,
      completion_type: completionType,
      total_time_ms: sessionDuration,
      experiment_variant: variant || 'control',

      // Conversion tracking
      $set: {
        last_tour_completion_date: new Date().toISOString(),
      },
    });

    // Update user properties for cohort analysis
    await this.updateUserTourProfile(tourId, category, completionType);

    // Track conversion funnel completion
    this.posthog?.capture('$conversion_completed', {
      conversion_type: 'tour_completion',
      tour_id: tourId,
      variant: variant || 'control',
    });
  }

  /**
   * Track tour drop-off (user left mid-tour)
   *
   * PostHog MCP: Critical for identifying problematic steps
   */
  trackTourDropOff(
    tourId: string,
    stepIndex: number,
    totalSteps: number,
    reason: 'navigation' | 'close' | 'timeout' | 'error'
  ) {
    const completionPercentage = (stepIndex / totalSteps) * 100;

    this.posthog?.capture('tour_drop_off', {
      tour_id: tourId,
      drop_off_step: stepIndex,
      total_steps: totalSteps,
      completion_percentage: completionPercentage,
      drop_off_reason: reason,

      // Flag critical drop-offs
      is_early_drop_off: stepIndex < 3,
      is_mid_tour_drop_off: stepIndex >= 3 && stepIndex < totalSteps - 2,
      is_near_completion: stepIndex >= totalSteps - 2,
    });
  }

  /**
   * Track interactive step validation
   *
   * PostHog MCP: Measures hands-on engagement
   */
  trackValidation(
    tourId: string,
    stepId: string,
    success: boolean,
    validationType: 'event' | 'element' | 'timeout',
    timeToComplete?: number
  ) {
    this.posthog?.capture(
      success ? 'tour_validation_success' : 'tour_validation_failure',
      {
        tour_id: tourId,
        step_id: stepId,
        validation_type: validationType,
        time_to_complete_ms: timeToComplete,

        // Engagement metric
        hands_on_engagement: success,
      }
    );
  }

  /**
   * Track menu interaction during tour
   *
   * PostHog MCP: Validates non-blocking UX
   */
  trackMenuInteraction(
    tourId: string,
    menuItem: string,
    stepIndex: number,
    action: 'clicked' | 'hovered'
  ) {
    this.posthog?.capture('tour_menu_interaction', {
      tour_id: tourId,
      menu_item: menuItem,
      step_index: stepIndex,
      interaction_type: action,

      // Validate non-blocking behavior
      during_active_tour: true,
    });
  }

  /**
   * Track feedback submission
   *
   * PostHog MCP: Qualitative data for tour improvements
   */
  trackFeedback(
    tourId: string,
    feedbackType: 'positive' | 'negative',
    comment?: string
  ) {
    this.posthog?.capture('tour_feedback_submitted', {
      tour_id: tourId,
      feedback_type: feedbackType,
      has_comment: !!comment,
      comment_length: comment?.length || 0,
    });

    // Set user satisfaction score
    this.posthog?.setPersonProperties({
      last_tour_feedback: feedbackType,
      tour_satisfaction_score: feedbackType === 'positive' ? 5 : 2,
    });
  }

  /**
   * Update user tour profile (for cohort analysis)
   *
   * PostHog MCP: Enables retention analysis by tour completion
   */
  private async updateUserTourProfile(
    tourId: string,
    category: string,
    completionType: 'finished' | 'skipped'
  ) {
    const currentProps = this.posthog?.getPersonProperties() || {};

    const toursCompleted = currentProps.tours_completed || [];
    const toursSkipped = currentProps.tours_skipped || [];

    if (completionType === 'finished') {
      toursCompleted.push(tourId);
    } else {
      toursSkipped.push(tourId);
    }

    this.posthog?.setPersonProperties({
      tours_completed: toursCompleted,
      tours_skipped: toursSkipped,
      total_tours_completed: toursCompleted.length,
      total_tours_skipped: toursSkipped.length,
      tour_completion_rate:
        (toursCompleted.length / (toursCompleted.length + toursSkipped.length)) * 100,
      favorite_tour_category: this.calculateFavoriteCategory(toursCompleted),

      // Cohort flags
      has_completed_onboarding_tour: toursCompleted.some(t => t.startsWith('dashboard')),
      has_completed_all_tours: toursCompleted.length >= 7,
      is_tour_power_user: toursCompleted.length >= 5,
    });
  }

  /**
   * Calculate engagement score (for ranking users)
   */
  private calculateEngagementScore(timeOnStep: number, stepIndex: number): number {
    // Ideal time: 5-15 seconds per step
    const idealTime = 10000;
    const deviation = Math.abs(timeOnStep - idealTime);

    // Score: 100 if within ideal range, decreasing with deviation
    const baseScore = Math.max(0, 100 - (deviation / 100));

    // Bonus for progressing further
    const progressBonus = stepIndex * 2;

    return Math.min(100, baseScore + progressBonus);
  }

  /**
   * Calculate favorite tour category (most completed)
   */
  private calculateFavoriteCategory(completedTours: string[]): string {
    const categories: Record<string, number> = {};

    completedTours.forEach(tourId => {
      if (tourId.includes('dashboard')) categories['onboarding'] = (categories['onboarding'] || 0) + 1;
      if (tourId.includes('league') || tourId.includes('submit')) categories['feature'] = (categories['feature'] || 0) + 1;
      if (tourId.includes('admin')) categories['admin'] = (categories['admin'] || 0) + 1;
    });

    return Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
  }
}
```

**PostHog Retention Cohort Configuration:**

```typescript
// Admin dashboard: Show retention by tour completion
const retentionCohorts = {
  'Completed Dashboard Tour': {
    filter: { tours_completed: { $contains: 'dashboard-v1' } },
    retention_window: '30 days',
  },
  'Completed All Tours': {
    filter: { has_completed_all_tours: true },
    retention_window: '90 days',
  },
  'Skipped All Tours': {
    filter: { total_tours_completed: 0, total_tours_skipped: { $gte: 1 } },
    retention_window: '7 days',
  },
};
```

### 2. Google Tag Manager MCP Integration (SECONDARY)

**Purpose:** GA4 custom events, conversion tracking, custom dimensions

**Research Sources:**
- [GTM: Custom Event Tracking](https://support.google.com/tagmanager/answer/7679219)
- [GA4: Enhanced Measurement](https://support.google.com/analytics/answer/9216061)

**File:** `src/lib/tours/gtm-integration.ts`

```typescript
/**
 * Google Tag Manager integration for tours
 *
 * USES: Google Tag Manager MCP
 *
 * GTM EVENTS (pushed to dataLayer):
 * 1. tour_interaction (all tour events)
 * 2. conversion (tour completion as conversion)
 * 3. engagement_time (time spent in tour)
 */

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export class GTMTourTracking {
  /**
   * Push tour event to GTM dataLayer
   *
   * GTM MCP: Automatically syncs to GA4
   */
  private pushToDataLayer(event: string, data: Record<string, any>) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      ...data,
    });
  }

  /**
   * Track tour as GA4 custom event
   *
   * GTM MCP: Creates GA4 event with custom dimensions
   */
  trackTourEvent(
    eventName: string,
    tourId: string,
    properties: Record<string, any>
  ) {
    this.pushToDataLayer('tour_interaction', {
      event_category: 'tour',
      event_action: eventName,
      event_label: tourId,

      // GA4 custom dimensions
      tour_id: tourId,
      tour_name: properties.tourName,
      tour_category: properties.category,
      experiment_variant: properties.variant,

      // Custom parameters
      ...properties,
    });
  }

  /**
   * Track tour completion as GA4 conversion
   *
   * GTM MCP: Triggers conversion event in GA4
   */
  trackTourConversion(
    tourId: string,
    tourName: string,
    completionType: 'finished' | 'skipped',
    value: number = 0
  ) {
    this.pushToDataLayer('conversion', {
      event_category: 'tour_conversion',
      event_action: completionType,
      event_label: tourId,

      // GA4 conversion parameters
      conversion_type: 'tour_completion',
      conversion_id: tourId,
      conversion_value: value, // Can assign $ value to completed tours

      // Custom dimensions
      tour_name: tourName,
      completion_type: completionType,
    });
  }

  /**
   * Track engagement time (GA4 enhanced measurement)
   *
   * GTM MCP: Feeds into GA4 engagement metrics
   */
  trackEngagementTime(
    tourId: string,
    durationMs: number
  ) {
    this.pushToDataLayer('engagement_time', {
      event_category: 'engagement',
      event_action: 'tour_time',
      event_label: tourId,

      // GA4 engagement time
      engagement_time_msec: durationMs,

      // Custom dimension
      tour_id: tourId,
    });
  }
}

/**
 * GTM Tag Configuration (for Tag Manager UI)
 *
 * Tag Type: GA4 Event
 * Trigger: Custom Event - tour_interaction
 * Configuration:
 *   - Event Name: {{ Event Action }}
 *   - Event Parameters:
 *     - tour_id: {{ tour_id }}
 *     - tour_category: {{ tour_category }}
 *     - experiment_variant: {{ experiment_variant }}
 */
```

### 3. Supabase MCP Integration (PERSISTENCE)

**Purpose:** Persist tour completion data, enable SQL-based cohort analysis

**Research Sources:**
- [Supabase: Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

**Database Schema:**

```sql
-- Tour completions table
CREATE TABLE tour_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL,
  tour_version TEXT NOT NULL,
  tour_category TEXT NOT NULL,

  -- Completion details
  completion_type TEXT NOT NULL CHECK (completion_type IN ('finished', 'skipped')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER NOT NULL,

  -- Experiment tracking
  experiment_variant TEXT,

  -- Steps tracking
  total_steps INTEGER NOT NULL,
  steps_completed INTEGER NOT NULL,
  drop_off_step INTEGER,

  -- Metadata
  device_type TEXT, -- 'mobile' | 'tablet' | 'desktop'
  browser TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, tour_id, tour_version)
);

-- Tour step interactions (granular)
CREATE TABLE tour_step_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_completion_id UUID REFERENCES tour_completions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,

  -- Interaction details
  viewed_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  time_on_step_ms INTEGER,

  -- Interactive validation
  had_validation BOOLEAN DEFAULT FALSE,
  validation_success BOOLEAN,
  validation_time_ms INTEGER,

  -- Menu interactions during step
  menu_interactions JSONB, -- Array of {menu_item, timestamp, action}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour feedback
CREATE TABLE tour_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_completion_id UUID REFERENCES tour_completions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL,

  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tour_completions_user_id ON tour_completions(user_id);
CREATE INDEX idx_tour_completions_tour_id ON tour_completions(tour_id);
CREATE INDEX idx_tour_completions_created_at ON tour_completions(created_at);
CREATE INDEX idx_tour_completions_completion_type ON tour_completions(completion_type);
CREATE INDEX idx_tour_step_interactions_completion_id ON tour_step_interactions(tour_completion_id);

-- Row Level Security
ALTER TABLE tour_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_step_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own tour completions"
  ON tour_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tour completions"
  ON tour_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all (for analytics dashboard)
CREATE POLICY "Admins can view all tour completions"
  ON tour_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
```

**File:** `src/lib/tours/supabase-sync.ts`

```typescript
import { createClient } from '@/lib/supabase/client';

/**
 * Supabase persistence for tour completions
 *
 * USES: Supabase MCP
 *
 * SYNCS:
 * - Tour completions → tour_completions table
 * - Step interactions → tour_step_interactions table
 * - Feedback → tour_feedback table
 */

export class TourSupabaseSync {
  private supabase = createClient();

  /**
   * Save tour completion to database
   *
   * Supabase MCP: Persists for cohort analysis
   */
  async saveTourCompletion(data: {
    userId: string;
    tourId: string;
    tourVersion: string;
    tourCategory: string;
    completionType: 'finished' | 'skipped';
    startedAt: Date;
    completedAt: Date;
    durationMs: number;
    experimentVariant?: string;
    totalSteps: number;
    stepsCompleted: number;
    dropOffStep?: number;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    browser: string;
  }) {
    const { data: completion, error } = await this.supabase
      .from('tour_completions')
      .insert({
        user_id: data.userId,
        tour_id: data.tourId,
        tour_version: data.tourVersion,
        tour_category: data.tourCategory,
        completion_type: data.completionType,
        started_at: data.startedAt.toISOString(),
        completed_at: data.completedAt.toISOString(),
        duration_ms: data.durationMs,
        experiment_variant: data.experimentVariant,
        total_steps: data.totalSteps,
        steps_completed: data.stepsCompleted,
        drop_off_step: data.dropOffStep,
        device_type: data.deviceType,
        browser: data.browser,
      })
      .select()
      .single();

    if (error) throw error;
    return completion;
  }

  /**
   * Save step interaction
   *
   * Supabase MCP: Enables granular drop-off analysis
   */
  async saveStepInteraction(data: {
    tourCompletionId: string;
    stepId: string;
    stepIndex: number;
    viewedAt: Date;
    completedAt?: Date;
    timeOnStepMs?: number;
    hadValidation?: boolean;
    validationSuccess?: boolean;
    validationTimeMs?: number;
    menuInteractions?: Array<{
      menuItem: string;
      timestamp: string;
      action: 'clicked' | 'hovered';
    }>;
  }) {
    const { error } = await this.supabase
      .from('tour_step_interactions')
      .insert({
        tour_completion_id: data.tourCompletionId,
        step_id: data.stepId,
        step_index: data.stepIndex,
        viewed_at: data.viewedAt.toISOString(),
        completed_at: data.completedAt?.toISOString(),
        time_on_step_ms: data.timeOnStepMs,
        had_validation: data.hadValidation,
        validation_success: data.validationSuccess,
        validation_time_ms: data.validationTimeMs,
        menu_interactions: data.menuInteractions,
      });

    if (error) throw error;
  }

  /**
   * Save tour feedback
   *
   * Supabase MCP: Qualitative data for improvements
   */
  async saveFeedback(data: {
    tourCompletionId: string;
    userId: string;
    tourId: string;
    feedbackType: 'positive' | 'negative';
    comment?: string;
  }) {
    const { error } = await this.supabase
      .from('tour_feedback')
      .insert({
        tour_completion_id: data.tourCompletionId,
        user_id: data.userId,
        tour_id: data.tourId,
        feedback_type: data.feedbackType,
        comment: data.comment,
      });

    if (error) throw error;
  }

  /**
   * Get user's tour completion history
   *
   * Supabase MCP: For admin dashboard
   */
  async getUserTourHistory(userId: string) {
    const { data, error } = await this.supabase
      .from('tour_completions')
      .select(`
        *,
        tour_step_interactions(*),
        tour_feedback(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get tour analytics (admin only)
   *
   * Supabase MCP: SQL-based cohort analysis
   */
  async getTourAnalytics(tourId?: string) {
    let query = this.supabase
      .from('tour_completions')
      .select(`
        tour_id,
        tour_category,
        completion_type,
        experiment_variant,
        created_at,
        duration_ms,
        steps_completed,
        total_steps
      `)
      .order('created_at', { ascending: false });

    if (tourId) {
      query = query.eq('tour_id', tourId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return this.calculateAnalytics(data);
  }

  /**
   * Calculate tour analytics from raw data
   */
  private calculateAnalytics(completions: any[]) {
    const total = completions.length;
    const finished = completions.filter(c => c.completion_type === 'finished').length;
    const skipped = completions.filter(c => c.completion_type === 'skipped').length;

    return {
      total_completions: total,
      finished_count: finished,
      skipped_count: skipped,
      completion_rate: (finished / total) * 100,
      avg_duration_ms: completions.reduce((sum, c) => sum + c.duration_ms, 0) / total,
      avg_steps_completed: completions.reduce((sum, c) => sum + c.steps_completed, 0) / total,
      by_variant: this.groupByVariant(completions),
      by_category: this.groupByCategory(completions),
    };
  }

  private groupByVariant(completions: any[]) {
    const groups: Record<string, any> = {};

    completions.forEach(c => {
      const variant = c.experiment_variant || 'control';
      if (!groups[variant]) {
        groups[variant] = { count: 0, finished: 0, skipped: 0 };
      }
      groups[variant].count++;
      if (c.completion_type === 'finished') groups[variant].finished++;
      else groups[variant].skipped++;
    });

    return groups;
  }

  private groupByCategory(completions: any[]) {
    const groups: Record<string, any> = {};

    completions.forEach(c => {
      const category = c.tour_category;
      if (!groups[category]) {
        groups[category] = { count: 0, finished: 0, skipped: 0 };
      }
      groups[category].count++;
      if (c.completion_type === 'finished') groups[category].finished++;
      else groups[category].skipped++;
    });

    return groups;
  }
}
```

### 4. Unified Analytics Facade (RECOMMENDED)

**File:** `src/lib/tours/unified-analytics.ts`

```typescript
import { TourAnalytics } from './analytics';
import { GTMTourTracking } from './gtm-integration';
import { TourSupabaseSync } from './supabase-sync';
import { usePostHog } from 'posthog-js/react';

/**
 * Unified analytics facade
 *
 * Automatically syncs to ALL three systems:
 * 1. PostHog (real-time analytics)
 * 2. GTM/GA4 (conversion tracking)
 * 3. Supabase (persistence)
 */

export class UnifiedTourAnalytics {
  private posthogAnalytics: TourAnalytics;
  private gtmTracking: GTMTourTracking;
  private supabaseSync: TourSupabaseSync;

  constructor(userId: string) {
    const posthog = usePostHog();
    this.posthogAnalytics = new TourAnalytics(posthog);
    this.gtmTracking = new GTMTourTracking();
    this.supabaseSync = new TourSupabaseSync();
  }

  /**
   * Track tour start (ALL systems)
   */
  async trackTourStart(
    tourId: string,
    tourName: string,
    category: string,
    trigger: 'auto' | 'manual',
    variant?: string
  ) {
    // PostHog: Real-time event
    this.posthogAnalytics.trackTourStart(tourId, tourName, category, trigger, variant);

    // GTM: GA4 event
    this.gtmTracking.trackTourEvent('tour_started', tourId, {
      tourName,
      category,
      trigger,
      variant,
    });

    // Note: Supabase saves on completion, not start
  }

  /**
   * Track tour completion (ALL systems)
   */
  async trackTourComplete(
    userId: string,
    tourId: string,
    tourName: string,
    tourVersion: string,
    category: string,
    completionType: 'finished' | 'skipped',
    startedAt: Date,
    completedAt: Date,
    totalSteps: number,
    stepsCompleted: number,
    variant?: string
  ) {
    const durationMs = completedAt.getTime() - startedAt.getTime();

    // PostHog: Real-time event + user properties
    await this.posthogAnalytics.trackTourComplete(
      tourId,
      tourName,
      category,
      completionType,
      durationMs,
      variant
    );

    // GTM: Conversion event
    this.gtmTracking.trackTourConversion(tourId, tourName, completionType);
    this.gtmTracking.trackEngagementTime(tourId, durationMs);

    // Supabase: Persist for cohort analysis
    await this.supabaseSync.saveTourCompletion({
      userId,
      tourId,
      tourVersion,
      tourCategory: category,
      completionType,
      startedAt,
      completedAt,
      durationMs,
      experimentVariant: variant,
      totalSteps,
      stepsCompleted,
      deviceType: this.detectDeviceType(),
      browser: this.detectBrowser(),
    });
  }

  /**
   * Track step interaction (ALL systems)
   */
  async trackStepInteraction(
    tourCompletionId: string,
    tourId: string,
    stepId: string,
    stepIndex: number,
    totalSteps: number,
    viewedAt: Date,
    completedAt?: Date,
    menuInteractions?: any[]
  ) {
    const timeOnStep = completedAt
      ? completedAt.getTime() - viewedAt.getTime()
      : undefined;

    // PostHog: Step view + completion
    this.posthogAnalytics.trackStepView(tourId, stepId, stepIndex, totalSteps);
    if (completedAt && timeOnStep) {
      this.posthogAnalytics.trackStepComplete(tourId, stepId, stepIndex, totalSteps, timeOnStep);
    }

    // GTM: Custom event
    this.gtmTracking.trackTourEvent('step_completed', tourId, {
      stepId,
      stepIndex,
      timeOnStep,
    });

    // Supabase: Granular tracking
    await this.supabaseSync.saveStepInteraction({
      tourCompletionId,
      stepId,
      stepIndex,
      viewedAt,
      completedAt,
      timeOnStepMs: timeOnStep,
      menuInteractions,
    });
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }
}
```

### 5. Retention & Conversion Analysis Queries

**PostHog Retention Cohorts:**

```typescript
// In admin dashboard: Compare retention rates
const retentionCohorts = [
  {
    name: 'Completed Dashboard Tour',
    filter: { tours_completed: { $contains: 'dashboard-v1' } },
    retention: '30d',
  },
  {
    name: 'Completed All Tours',
    filter: { has_completed_all_tours: true },
    retention: '90d',
  },
  {
    name: 'Completed Feature Tours Only',
    filter: {
      tours_completed: { $contains: 'submit-steps-v1' },
      $not: { tours_completed: { $contains: 'dashboard-v1' } }
    },
    retention: '30d',
  },
  {
    name: 'Skipped All Tours',
    filter: {
      total_tours_completed: 0,
      total_tours_skipped: { $gte: 1 }
    },
    retention: '7d',
  },
];
```

**Supabase Analytics Queries:**

```sql
-- Conversion rate by tour and variant
SELECT
  tour_id,
  experiment_variant,
  COUNT(*) as total_starts,
  SUM(CASE WHEN completion_type = 'finished' THEN 1 ELSE 0 END) as completions,
  ROUND(
    100.0 * SUM(CASE WHEN completion_type = 'finished' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as conversion_rate
FROM tour_completions
GROUP BY tour_id, experiment_variant
ORDER BY conversion_rate DESC;

-- Retention rate: Users who completed tours vs didn't
WITH tour_users AS (
  SELECT
    user_id,
    BOOL_OR(completion_type = 'finished') as completed_any_tour,
    MAX(completed_at) as last_tour_date
  FROM tour_completions
  GROUP BY user_id
),
user_activity AS (
  SELECT
    u.id as user_id,
    tu.completed_any_tour,
    tu.last_tour_date,
    MAX(s.created_at) as last_activity_date,
    COUNT(s.id) as total_submissions
  FROM auth.users u
  LEFT JOIN tour_users tu ON u.id = tu.user_id
  LEFT JOIN submissions s ON u.id = s.user_id
  GROUP BY u.id, tu.completed_any_tour, tu.last_tour_date
)
SELECT
  completed_any_tour,
  COUNT(*) as user_count,
  AVG(total_submissions) as avg_submissions,
  COUNT(CASE WHEN last_activity_date > NOW() - INTERVAL '30 days' THEN 1 END) as active_30d,
  ROUND(
    100.0 * COUNT(CASE WHEN last_activity_date > NOW() - INTERVAL '30 days' THEN 1 END) / COUNT(*),
    2
  ) as retention_rate_30d
FROM user_activity
GROUP BY completed_any_tour;

-- Drop-off points (most common exit steps)
SELECT
  tour_id,
  drop_off_step,
  COUNT(*) as drop_offs,
  ROUND(AVG(duration_ms) / 1000, 1) as avg_time_before_drop_off_sec
FROM tour_completions
WHERE completion_type = 'skipped'
  AND drop_off_step IS NOT NULL
GROUP BY tour_id, drop_off_step
ORDER BY tour_id, drop_offs DESC;

-- Tour completion by device type
SELECT
  device_type,
  tour_id,
  COUNT(*) as total,
  SUM(CASE WHEN completion_type = 'finished' THEN 1 ELSE 0 END) as finished,
  ROUND(
    100.0 * SUM(CASE WHEN completion_type = 'finished' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as completion_rate
FROM tour_completions
GROUP BY device_type, tour_id
ORDER BY device_type, completion_rate DESC;

-- Interactive validation success rate
SELECT
  tc.tour_id,
  COUNT(DISTINCT tsi.id) as total_validated_steps,
  SUM(CASE WHEN tsi.validation_success THEN 1 ELSE 0 END) as successful_validations,
  ROUND(
    100.0 * SUM(CASE WHEN tsi.validation_success THEN 1 ELSE 0 END) / COUNT(DISTINCT tsi.id),
    2
  ) as validation_success_rate,
  ROUND(AVG(tsi.validation_time_ms) / 1000, 1) as avg_validation_time_sec
FROM tour_completions tc
JOIN tour_step_interactions tsi ON tc.id = tsi.tour_completion_id
WHERE tsi.had_validation = true
GROUP BY tc.tour_id
ORDER BY validation_success_rate DESC;
```

### 6. Admin Dashboard Visualizations

**File:** `src/app/admin/tours/page.tsx` (ENHANCED)

Add these visualizations powered by the analytics data:

```typescript
/**
 * Admin Tour Analytics Dashboard
 *
 * DATA SOURCES:
 * - PostHog MCP: Real-time metrics, session replays
 * - Supabase MCP: Historical data, cohort analysis
 * - GTM MCP: GA4 conversion funnels
 */

export default function AdminToursPage() {
  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Tour Starts"
          value={posthogMetrics.total_tour_starts}
          change="+12% vs last week"
        />
        <MetricCard
          title="Completion Rate"
          value={`${supabaseAnalytics.completion_rate}%`}
          change="+5% vs last week"
        />
        <MetricCard
          title="Avg Time per Tour"
          value={`${supabaseAnalytics.avg_duration_ms / 1000}s`}
          change="-8% vs last week"
        />
        <MetricCard
          title="30d Retention"
          value={`${retentionCohorts.completed_tours.retention_rate}%`}
          change="+15% vs tour skippers"
        />
      </div>

      {/* Tour Performance Table */}
      <TourPerformanceTable
        tours={supabaseAnalytics.by_tour}
        columns={[
          'Tour Name',
          'Starts',
          'Completions',
          'Completion %',
          'Avg Time',
          'Retention Impact',
        ]}
      />

      {/* Conversion Funnel (PostHog) */}
      <PostHogFunnel
        steps={[
          'tour_started',
          'tour_step_viewed (step 3)',
          'tour_step_viewed (step 7)',
          'tour_completed',
        ]}
      />

      {/* Drop-Off Heatmap */}
      <DropOffHeatmap
        data={supabaseAnalytics.drop_off_points}
        tours={['dashboard-v1', 'submit-steps-v1', 'leaderboard-v1']}
      />

      {/* Retention Cohort Comparison */}
      <RetentionChart
        cohorts={[
          { name: 'Completed All Tours', data: retentionData.all_tours },
          { name: 'Completed Dashboard Only', data: retentionData.dashboard },
          { name: 'Skipped All Tours', data: retentionData.skipped },
        ]}
      />

      {/* A/B Test Results (PostHog Experiments) */}
      <ExperimentResults
        experimentId="dashboard-tour-test"
        variants={['control', 'concise', 'interactive']}
        metrics={['completion_rate', 'retention_30d', 'feature_adoption']}
      />

      {/* Session Replays (PostHog) */}
      <SessionReplays
        filter={{ tours_completed: { $contains: 'dashboard-v1' } }}
        limit={10}
        title="Recent Dashboard Tour Completions"
      />
    </div>
  );
}
```

### 7. Analytics Implementation Checklist

**FOR IMPLEMENTATION AGENT:**

- [ ] Install PostHog JS SDK (`posthog-js`)
- [ ] Set up PostHog MCP integration in `TourProvider`
- [ ] Create GTM dataLayer events in `TourProvider`
- [ ] Create Supabase database tables (migration file)
- [ ] Implement `UnifiedTourAnalytics` class
- [ ] Add analytics calls to ALL tour events:
  - [ ] Tour start
  - [ ] Step view
  - [ ] Step complete
  - [ ] Tour complete
  - [ ] Tour drop-off
  - [ ] Interactive validation
  - [ ] Menu interaction
  - [ ] Feedback submission
- [ ] Create PostHog retention cohorts
- [ ] Create Supabase analytics queries
- [ ] Build admin dashboard visualizations
- [ ] Test analytics in development (check PostHog, GA4, Supabase)
- [ ] Validate GDPR compliance (privacy policy update)

---

## Solution Architecture

### Core Principles (from architecture-philosophy skill)

1. **Modular over Monolithic** - Tour definitions in separate files by feature area
2. **Future-Thinking** - Version-based migrations, analytics hooks, A/B testing ready
3. **Defensive Programming** - AppError integration, fallback tours, graceful degradation
4. **Maintenance Reduction** - Use shadcn/ui, central tour registry, self-documenting configs
5. **Performance First** - <150ms INP, deferred operations, React 18 concurrent features
6. **Mobile-First** - Responsive tooltips with character limits, truncation, placement optimization

### Architecture Overview

```
src/
├── lib/
│   └── tours/
│       ├── registry.ts              # Central tour manifest (single source of truth)
│       ├── types.ts                 # Tour interfaces and types
│       ├── analytics.ts             # Tour-specific analytics tracking (PostHog)
│       ├── i18n.ts                  # i18n configuration for tours
│       ├── migrations.ts            # Version migration logic
│       ├── experiments.ts           # PostHog A/B testing integration
│       └── definitions/
│           ├── dashboard.tour.ts    # Dashboard tour (11 steps, comprehensive)
│           ├── league.tour.ts       # League creation tour (5 steps)
│           ├── submit.tour.ts       # Step submission tour (7 steps)
│           ├── leaderboard.tour.ts  # Leaderboard tour (5 steps)
│           ├── analytics.tour.ts    # Analytics tour (4 steps)
│           ├── settings.tour.ts     # Settings tour (5 steps)
│           └── admin.tour.ts        # Admin features tour (5 steps)
├── locales/
│   ├── en/
│   │   └── tours.json               # English translations
│   ├── es/
│   │   └── tours.json               # Spanish translations (future)
│   └── index.ts                     # i18n setup
├── components/
│   └── tours/
│       ├── TourProvider.tsx         # Optimized provider (replaces OnboardingProvider)
│       ├── TourFeedbackDialog.tsx   # shadcn Dialog for post-tour feedback
│       ├── TourTrigger.tsx          # Reusable tour trigger button
│       ├── TourProgress.tsx         # Progress indicator component
│       └── ResponsiveTourStep.tsx   # Mobile-responsive step wrapper
└── hooks/
    └── useTour.ts                   # Tour hook with analytics, i18n, experiments
```

---

## Detailed Design

### 1. Tour Type System (COMPREHENSIVE)

**File:** `src/lib/tours/types.ts`

```typescript
import { Step } from 'react-joyride';
import { TFunction } from 'i18next';

/**
 * Enhanced tour step with metadata, i18n, validation, and mobile support
 *
 * IMPORTANT: All content must use i18n translation keys, NOT hardcoded strings
 */
export interface TourStep extends Step {
  // Core Identification
  id: string;                    // Unique step ID for analytics (e.g., 'nav-submit-steps')

  // i18n Support (MANDATORY)
  contentKey: string;            // Translation key: 'dashboard.nav_submit_steps.content'
  titleKey?: string;             // Optional title translation key

  // Mobile Optimization
  mobile?: {
    contentKey?: string;         // Shorter mobile version (max 130 chars)
    titleKey?: string;           // Shorter mobile title (max 60 chars)
    hide?: boolean;              // Hide this step on mobile
    placement?: Step['placement']; // Override placement for mobile
  };

  // Analytics
  analytics?: {
    category?: string;           // Event category override (default: 'engagement')
    action?: string;             // Event action override
    properties?: Record<string, any>; // Additional event properties
  };

  // Role-Based Access
  requiresRole?: 'admin' | 'owner' | 'superadmin';
  requiresLeague?: boolean;

  // Feature Flags
  featureFlag?: string;          // Only show if feature flag enabled

  // Interactive Validation (NEW)
  interactive?: {
    enabled: boolean;            // Is this an interactive step?
    validation: {
      type: 'event' | 'element' | 'timeout'; // Validation method
      event?: string;            // Analytics event to wait for (e.g., 'league_created')
      element?: string;          // DOM element to check (e.g., '[data-created="true"]')
      timeout?: number;          // Max wait time in ms (default: 60000)
    };
    onValidationFail?: () => void; // Callback if validation times out
  };

  // A/B Testing (NEW)
  experimentVariant?: string;    // Show only for specific variant (e.g., 'concise')
}

/**
 * Tour definition with comprehensive metadata
 */
export interface TourDefinition {
  // Core Identification
  id: string;                    // Tour ID (e.g., 'dashboard-v1')
  version: string;               // Semver version for migration (e.g., '1.0.0')
  name: string;                  // Display name
  nameKey: string;               // i18n key for name
  description: string;           // Description for tour selection UI
  descriptionKey: string;        // i18n key for description

  // Categorization
  category: 'onboarding' | 'feature' | 'advanced' | 'admin';
  estimatedDuration: number;     // Seconds
  priority: number;              // 1-10, higher = more important

  // Auto-Start Configuration
  autoStart: {
    enabled: boolean;
    conditions: AutoStartCondition[];
  };

  // Tour Steps
  steps: TourStep[];

  // Requirements
  requiredPath?: string;         // Page tour must be on (e.g., '/dashboard')
  requiredRole?: 'admin' | 'owner' | 'superadmin';

  // Mobile Optimization
  mobile?: {
    maxSteps?: number;           // Limit steps on mobile (default: 3)
    enabled?: boolean;           // Disable entire tour on mobile
  };

  // Experiments (NEW)
  experimentId?: string;         // PostHog experiment ID
  variants?: Record<string, Partial<TourDefinition>>; // Tour variants for A/B testing
}

/**
 * Auto-start conditions
 */
export interface AutoStartCondition {
  type: 'first_visit' | 'query_param' | 'event' | 'feature_enabled';
  value?: string;                // Value to match (e.g., query param value)
}

/**
 * Tour state (localStorage schema v2)
 */
export interface TourState {
  completedTours: Record<string, string>; // tourId -> version completed
  skippedTours: Record<string, string>;   // tourId -> version skipped
  tourProgress: Record<string, number>;   // tourId -> currentStepIndex
  interactionHistory: {                   // NEW: Track user interactions
    tourId: string;
    stepId: string;
    action: 'completed' | 'skipped' | 'validated' | 'failed';
    timestamp: number;
  }[];
  lastUpdated: number;                    // Timestamp
  schemaVersion: number;                  // Current: 2 (for future migrations)
}

/**
 * Tour context props
 */
export interface TourContextValue {
  // State
  activeTour: TourDefinition | null;
  isRunning: boolean;
  stepIndex: number;

  // Actions
  startTour: (tourId: string) => void;
  stopTour: () => void;
  resetTour: (tourId: string) => void;

  // Queries
  hasCompletedTour: (tourId: string) => boolean;
  hasSkippedTour: (tourId: string) => boolean;
  availableTours: TourDefinition[];

  // i18n
  t: TFunction;                  // Translation function
  language: string;              // Current language
  changeLanguage: (lng: string) => void;

  // Experiments (NEW)
  experimentVariant: string | null; // Current experiment variant
}

/**
 * Tour migration definition
 */
export interface TourMigration {
  from: string;                  // Version migrating from (e.g., '1.0.0')
  to: string;                    // Version migrating to (e.g., '1.1.0')
  migrate: (oldState: TourState) => TourState; // Migration function
}
```

**Key Type Design Decisions:**

1. **i18n-First Design:**
   - Every string has a `...Key` field for translation
   - No hardcoded content in types
   - Mobile versions use separate translation keys

2. **Interactive Validation:**
   - Supports 3 validation types: event, element, timeout
   - Enables "learn by doing" tours
   - Timeout handling for failed validations

3. **A/B Testing Integration:**
   - `experimentId` links to PostHog experiment
   - `variants` allow tour variations
   - `experimentVariant` in context for conditional rendering

4. **Mobile-First:**
   - Character limits enforced in documentation
   - `mobile` object for responsive overrides
   - `maxSteps` to truncate long tours on mobile

### 2. Tour Registry (EXPANDED)

**File:** `src/lib/tours/registry.ts`

```typescript
import { TourDefinition } from './types';
import * as tours from './definitions';

/**
 * Central tour registry - Single source of truth
 *
 * NAMING CONVENTION: {feature}-v{major version}
 * Examples: dashboard-v1, submit-steps-v2
 *
 * VERSION SUFFIX enables tour updates without breaking user progress
 */
export const TOUR_REGISTRY: Record<string, TourDefinition> = {
  'dashboard-v1': tours.dashboard,
  'league-creation-v1': tours.leagueCreation,
  'submit-steps-v1': tours.submitSteps,
  'leaderboard-v1': tours.leaderboard,
  'analytics-v1': tours.analytics,
  'settings-v1': tours.settings,
  'admin-v1': tours.admin,
};

/**
 * Type-safe tour ID
 * IDE autocomplete for all tour IDs
 */
export type TourId = keyof typeof TOUR_REGISTRY;

/**
 * Get tour by ID with type safety
 */
export function getTour(id: TourId): TourDefinition | null {
  return TOUR_REGISTRY[id] || null;
}

/**
 * Get all tours for a specific category
 */
export function getToursByCategory(category: TourDefinition['category']): TourDefinition[] {
  return Object.values(TOUR_REGISTRY).filter(tour => tour.category === category);
}

/**
 * Get tours available for a specific user role
 */
export function getToursForRole(role: 'admin' | 'owner' | 'superadmin' | 'member'): TourDefinition[] {
  return Object.values(TOUR_REGISTRY).filter(tour => {
    if (!tour.requiredRole) return true;
    if (role === 'superadmin') return true;
    if (role === 'admin' && (tour.requiredRole === 'admin' || tour.requiredRole === 'owner')) return true;
    if (role === 'owner' && tour.requiredRole === 'owner') return true;
    return false;
  });
}

/**
 * Get tours for current page
 */
export function getToursForPath(path: string): TourDefinition[] {
  return Object.values(TOUR_REGISTRY).filter(tour => {
    if (!tour.requiredPath) return false;

    // Support dynamic routes: '/league/[id]/leaderboard' matches '/league/abc/leaderboard'
    const pattern = tour.requiredPath.replace(/\[.*?\]/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);

    return regex.test(path);
  });
}

/**
 * Get experiment variant for a tour (PostHog integration)
 */
export function getTourVariant(
  tourId: TourId,
  experimentVariant: string | null
): TourDefinition | null {
  const baseTour = getTour(tourId);
  if (!baseTour) return null;

  // No experiment or no variants
  if (!baseTour.experimentId || !baseTour.variants || !experimentVariant) {
    return baseTour;
  }

  // Merge variant with base tour
  const variant = baseTour.variants[experimentVariant];
  if (!variant) return baseTour;

  return {
    ...baseTour,
    ...variant,
    steps: variant.steps || baseTour.steps,
  };
}
```

**Benefits:**
- ✅ Single import point for all tours
- ✅ Type-safe tour IDs with autocomplete
- ✅ Helper functions for filtering (category, role, path)
- ✅ PostHog variant selection built-in
- ✅ Dynamic route matching for Next.js routes

### 3. i18n Configuration

**File:** `src/lib/tours/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

/**
 * i18n configuration for tours
 *
 * BEST PRACTICES:
 * 1. Lazy-load languages for performance
 * 2. Use browser detection + manual switcher
 * 3. Separate namespaces for tours
 * 4. RTL support for Arabic/Hebrew
 *
 * RESEARCH SOURCES:
 * - https://www.glorywebs.com/blog/internationalization-in-react
 * - https://www.bureauworks.com/blog/react-internationalization-best-practices
 */

// Import base language (English)
import enTours from '@/locales/en/tours.json';

i18n
  // Detect user language
  .use(LanguageDetector)

  // Pass i18n instance to react-i18next
  .use(initReactI18next)

  // Init i18next
  .init({
    // Default language
    fallbackLng: 'en',

    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',

    // Namespaces for organization
    ns: ['tours'],
    defaultNS: 'tours',

    // Initial resources (English only)
    resources: {
      en: {
        tours: enTours,
      },
    },

    // Interpolation
    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Language detection order
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    },
  });

/**
 * Lazy-load additional languages
 *
 * PERFORMANCE: Only load when user switches language
 */
export async function loadLanguage(lng: string) {
  if (i18n.hasResourceBundle(lng, 'tours')) return;

  try {
    const module = await import(`@/locales/${lng}/tours.json`);
    i18n.addResourceBundle(lng, 'tours', module.default);
  } catch (error) {
    console.error(`Failed to load language ${lng}:`, error);
  }
}

/**
 * Get text direction for RTL languages
 */
export function getTextDirection(lng: string): 'ltr' | 'rtl' {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
}

/**
 * Format duration based on language
 */
export function formatDuration(seconds: number, lng: string): string {
  const minutes = Math.ceil(seconds / 60);

  const formatter = new Intl.NumberFormat(lng, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'long',
  });

  return formatter.format(minutes);
}

export default i18n;
```

**File:** `src/locales/en/tours.json`

```json
{
  "dashboard": {
    "name": "Welcome Tour",
    "description": "Comprehensive introduction to StepLeague - navigation, key features, and getting started",

    "welcome_intro": {
      "content": "👋 Welcome to StepLeague! Let's take a quick tour to show you around. This will only take 3 minutes."
    },

    "dashboard_header": {
      "content": "📊 This is your dashboard - your home base for tracking steps and competing with friends!"
    },

    "nav_menu_intro": {
      "content": "🧭 Let me show you where to find all the important features in StepLeague. We'll start with the navigation menu."
    },

    "nav_submit_steps": {
      "content": "📸 **Most Important!** This is where you submit your daily steps. You can upload a screenshot from your fitness app or enter steps manually.",
      "mobile": "📸 Submit your daily steps here!"
    },

    "nav_league_menu": {
      "content": "🏆 **Getting Started:** Click here to create a new league or join an existing one. You can be in multiple leagues at once!",
      "mobile": "🏆 Create or join leagues here!"
    },

    "nav_leaderboard": {
      "content": "📈 View your league leaderboard here to see who's leading this week. You can filter by daily, weekly, or custom date ranges.",
      "mobile": "📈 View leaderboard rankings!"
    },

    "nav_analytics": {
      "content": "📊 Track your progress with detailed analytics - calendar heatmaps, daily breakdowns, and personal records!",
      "mobile": "📊 Track your progress!"
    },

    "nav_settings": {
      "content": "⚙️ Access your profile settings here. Customize your display name, units (miles/km), and app preferences.",
      "mobile": "⚙️ Customize your settings!"
    },

    "nav_help_menu": {
      "content": "❓ Need help? Click here anytime to access tours, FAQs, and support.",
      "mobile": "❓ Get help anytime!"
    },

    "getting_started_cta": {
      "content": "🎯 **Ready to start?** Your first step is to either create a league or join one using an invite code. Let's get you set up!",
      "mobile": "🎯 Create or join a league to start!"
    },

    "tour_replay_tip": {
      "content": "💡 **Tip:** You can replay this tour anytime from the Help menu. Happy stepping! 🚶‍♂️",
      "mobile": "💡 Replay anytime from Help menu!"
    }
  },

  "league": {
    "name": "Create a League",
    "description": "Step-by-step guide to creating your first league"
  },

  "submit": {
    "name": "Submit Your Steps",
    "description": "Learn the three ways to submit your daily steps"
  },

  "leaderboard": {
    "name": "Leaderboard Features",
    "description": "Explore filters, stats, and competition tools"
  },

  "analytics": {
    "name": "Your Analytics Dashboard",
    "description": "Track progress with heatmaps, trends, and personal records"
  },

  "settings": {
    "name": "Profile & Settings",
    "description": "Customize your StepLeague experience"
  },

  "admin": {
    "name": "League Admin Tools",
    "description": "Manage your league, invite members, and handle proxy users"
  }
}
```

**Character Count Validation:**

```typescript
// MANDATORY: Run this validation before deploying
function validateMobileContent(content: string, type: 'header' | 'body') {
  const maxChars = type === 'header' ? 60 : 130;

  if (content.length > maxChars) {
    throw new Error(`${type} exceeds ${maxChars} chars: "${content}" (${content.length})`);
  }

  const lines = content.split('\n').length;
  if (lines > 3) {
    throw new Error(`${type} exceeds 3 lines: ${lines} lines`);
  }
}

// Example usage:
validateMobileContent("📸 Submit your daily steps here!", 'body'); // ✅ PASS (33 chars)
validateMobileContent("📸 **Most Important!** This is where you submit your daily steps. You can upload a screenshot from your fitness app or enter steps manually.", 'body'); // ❌ FAIL (153 chars)
```

### 4. PostHog A/B Testing Integration

**File:** `src/lib/tours/experiments.ts`

```typescript
import { usePostHog } from 'posthog-js/react';
import { TourDefinition } from './types';

/**
 * PostHog A/B Testing Integration for Tours
 *
 * RESEARCH SOURCES:
 * - https://posthog.com/docs/experiments
 * - https://posthog.com/docs/experiments/best-practices
 * - https://posthog.com/tutorials/nextjs-ab-tests
 *
 * BEST PRACTICES:
 * 1. Start with 5% rollout for a few days
 * 2. Filter out users who already completed tour
 * 3. Use PostHog's recommended running time calculator
 * 4. Track multiple metrics (completion, time, feature adoption)
 */

/**
 * Hook to get tour experiment variant
 *
 * Example usage:
 * ```tsx
 * const variant = useTourExperiment('dashboard-tour-test');
 * // variant = 'control' | 'concise' | 'interactive'
 * ```
 */
export function useTourExperiment(experimentKey: string): string | null {
  const posthog = usePostHog();

  if (!posthog) return null;

  // Get variant from PostHog
  const variant = posthog.getFeatureFlagVariant(experimentKey);

  return typeof variant === 'string' ? variant : null;
}

/**
 * Track tour experiment events
 *
 * IMPORTANT: Track these events for PostHog to calculate significance:
 * - tour_started
 * - tour_completed
 * - tour_skipped
 * - step_completed
 */
export function trackTourEvent(
  event: 'started' | 'completed' | 'skipped' | 'step_completed',
  tourId: string,
  metadata: {
    variant?: string | null;
    stepIndex?: number;
    stepId?: string;
    completionType?: 'finished' | 'skipped';
    duration?: number;
  } = {}
) {
  const posthog = usePostHog();
  if (!posthog) return;

  posthog.capture(`tour_${event}`, {
    tour_id: tourId,
    variant: metadata.variant || 'control',
    step_index: metadata.stepIndex,
    step_id: metadata.stepId,
    completion_type: metadata.completionType,
    duration_seconds: metadata.duration,
    category: 'engagement',
  });
}

/**
 * Filter users who already completed tour (PostHog best practice)
 *
 * From PostHog docs:
 * "When testing a new onboarding flow, you don't want to include users
 * who have already completed the flow."
 */
export function shouldShowExperiment(
  experimentKey: string,
  hasCompletedTour: boolean
): boolean {
  if (hasCompletedTour) return false;

  const posthog = usePostHog();
  if (!posthog) return false;

  // Check if experiment is active
  const variant = posthog.getFeatureFlagVariant(experimentKey);
  return variant !== undefined && variant !== null;
}

/**
 * Example: Dashboard Tour A/B Test Variants
 *
 * HYPOTHESIS (from PostHog best practices):
 * "A shorter, more focused dashboard tour will reduce cognitive load,
 * resulting in higher completion rates and faster time-to-value."
 *
 * VARIANTS:
 * - control: Original 11-step comprehensive tour
 * - concise: Shorter 5-step tour (submit steps, league menu, leaderboard, analytics, help)
 * - interactive: 7-step tour with validation (users must click each menu item)
 */
export const DASHBOARD_TOUR_EXPERIMENT = {
  key: 'dashboard-tour-test',

  variants: {
    control: {
      // Original tour (11 steps)
      // See src/lib/tours/definitions/dashboard.tour.ts
    },

    concise: {
      // Shorter tour (5 steps)
      steps: [
        // welcome_intro
        // nav_submit_steps
        // nav_league_menu
        // nav_analytics
        // tour_replay_tip
      ]
    },

    interactive: {
      // Interactive tour (7 steps with validation)
      steps: [
        // welcome_intro
        // nav_submit_steps (with validation: must click)
        // nav_league_menu (with validation: must click)
        // nav_leaderboard (with validation: must click)
        // nav_analytics (with validation: must click)
        // nav_help_menu (with validation: must click)
        // tour_replay_tip
      ]
    }
  },

  // Metrics to track (PostHog will calculate significance)
  metrics: [
    'tour_completion_rate',    // Primary
    'time_to_complete',
    'feature_adoption_7d',      // Secondary
    'user_retention_30d',
    'support_ticket_count_7d',
  ],

  // Recommended sample size (from PostHog calculator)
  minSampleSize: 385,  // Per variant (for 80% power, 5% significance)

  // Recommended duration
  minDuration: 14,  // Days
};
```

**Implementation in TourProvider:**

```typescript
import { useTourExperiment, trackTourEvent, shouldShowExperiment } from '@/lib/tours/experiments';
import { getTourVariant } from '@/lib/tours/registry';

function TourProvider({ children }: { children: React.ReactNode }) {
  const experimentVariant = useTourExperiment('dashboard-tour-test');

  const startTour = useCallback((tourId: string) => {
    // Check if user should see experiment
    const hasCompleted = hasCompletedTour(tourId);
    if (!shouldShowExperiment('dashboard-tour-test', hasCompleted)) {
      // Use base tour
      const tour = getTour(tourId);
      setActiveTour(tour);
    } else {
      // Use variant tour
      const tour = getTourVariant(tourId, experimentVariant);
      setActiveTour(tour);
    }

    setRun(true);

    // Track experiment start
    trackTourEvent('started', tourId, { variant: experimentVariant });
  }, [experimentVariant, hasCompletedTour]);

  // ... rest of provider
}
```

### 5. Interactive Step Validation

**File:** `src/lib/tours/validation.ts`

```typescript
/**
 * Interactive step validation for "learn by doing" tours
 *
 * RESEARCH SOURCE:
 * - https://www.appcues.com/blog/product-tours-ui-patterns
 * - "Action-driven tooltips...effective for encouraging necessary actions"
 *
 * TYPES OF VALIDATION:
 * 1. Event-based: Wait for analytics event (e.g., 'league_created')
 * 2. Element-based: Check for DOM element (e.g., '[data-created="true"]')
 * 3. Timeout-based: Automatically proceed after X seconds
 */

import { analytics } from '@/lib/analytics';

export type ValidationResult =
  | { success: true }
  | { success: false; reason: 'timeout' | 'not_found' | 'error'; error?: Error };

/**
 * Validate interactive step based on type
 */
export async function validateStep(
  type: 'event' | 'element' | 'timeout',
  config: {
    event?: string;
    element?: string;
    timeout?: number;
  }
): Promise<ValidationResult> {
  const timeout = config.timeout || 60000; // Default: 60s

  switch (type) {
    case 'event':
      return validateByEvent(config.event!, timeout);

    case 'element':
      return validateByElement(config.element!, timeout);

    case 'timeout':
      return validateByTimeout(timeout);

    default:
      return { success: false, reason: 'error', error: new Error('Invalid validation type') };
  }
}

/**
 * Validate by waiting for analytics event
 *
 * Example: User must create league before proceeding
 */
async function validateByEvent(event: string, timeout: number): Promise<ValidationResult> {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;

    // Listen for event
    const unsubscribe = analytics.on(event, () => {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve({ success: true });
    });

    // Timeout handler
    timeoutId = setTimeout(() => {
      unsubscribe();
      resolve({ success: false, reason: 'timeout' });
    }, timeout);
  });
}

/**
 * Validate by checking for DOM element
 *
 * Example: Check if league card appeared after creation
 */
async function validateByElement(selector: string, timeout: number): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = document.querySelector(selector);

      if (element) {
        resolve({ success: true });
        return;
      }

      if (Date.now() - startTime > timeout) {
        resolve({ success: false, reason: 'not_found' });
        return;
      }

      // Check again in 500ms
      setTimeout(checkElement, 500);
    };

    checkElement();
  });
}

/**
 * Validate by timeout (automatic proceed)
 *
 * Example: Show tip for 10 seconds, then auto-advance
 */
async function validateByTimeout(timeout: number): Promise<ValidationResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, timeout);
  });
}

/**
 * Example interactive step in tour definition:
 */
const exampleInteractiveStep = {
  id: 'create-league-action',
  target: '[data-tour="create-league"]',
  contentKey: 'dashboard.create_league_action.content',
  // content: "Try creating your first league! Click the button above.",
  placement: 'bottom',
  disableOverlay: true,
  spotlightClicks: true,

  interactive: {
    enabled: true,
    validation: {
      type: 'event',
      event: 'league_created',  // Wait for this analytics event
      timeout: 60000,           // Timeout after 60s
    },
    onValidationFail: () => {
      // Show hint or skip to next step
      console.log('User did not create league in time, skipping...');
    },
  },
};
```

**Implementation in TourProvider:**

```typescript
import { validateStep } from '@/lib/tours/validation';

const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
  const { status, action, index, type } = data;

  // Check if current step is interactive
  const currentStep = activeTour?.steps[index];

  if (currentStep?.interactive?.enabled && type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
    // Validate before proceeding
    const validation = currentStep.interactive.validation;
    const result = await validateStep(validation.type, {
      event: validation.event,
      element: validation.element,
      timeout: validation.timeout,
    });

    if (result.success) {
      // Validation passed, proceed to next step
      setStepIndex(index + 1);
      analytics.tours.stepCompleted(activeTour.id, index, currentStep.id);
    } else {
      // Validation failed
      if (currentStep.interactive.onValidationFail) {
        currentStep.interactive.onValidationFail();
      }

      // Skip to next step or show error
      setStepIndex(index + 1);
      analytics.tours.validationFailed(activeTour.id, index, result.reason);
    }
  }

  // ... rest of callback logic
}, [activeTour, stepIndex]);
```

---

## 12 Proactive Future-Proofing Items

> **FOR IMPLEMENTATION AGENT:** These items demonstrate forward-thinking architecture. Research each thoroughly before implementing.

### Phase 1: Implemented Now (7 items)

#### 1. ✅ Version-Based Migration System

**Problem:** Updating tours requires resetting ALL user progress
**Solution:** Semver versioning with automatic migration
**Research:** [Semantic Versioning](https://semver.org), database migration patterns

**File:** `src/lib/tours/migrations.ts`

```typescript
import { TourState, TourMigration } from './types';

/**
 * Tour migration registry
 *
 * BEST PRACTICE: Use semver for tour versions
 * - Patch (1.0.1): Typo fixes, minor wording changes → preserve completion
 * - Minor (1.1.0): New steps added → preserve completion
 * - Major (2.0.0): Complete rewrite → reset completion
 */
const TOUR_MIGRATIONS: Record<string, TourMigration[]> = {
  'dashboard': [
    {
      from: '1.0.0',
      to: '1.1.0',
      migrate: (oldState) => ({
        ...oldState,
        // Preserve completion if user finished 1.0.0
        completedTours: {
          ...oldState.completedTours,
          'dashboard-v1.1': oldState.completedTours['dashboard-v1'] || null,
        },
      }),
    },
    {
      from: '1.1.0',
      to: '2.0.0',
      migrate: (oldState) => ({
        ...oldState,
        // Major version: don't preserve completion
        completedTours: {
          ...oldState.completedTours,
          'dashboard-v2': null, // User must retake tour
        },
        // But preserve skip status
        skippedTours: {
          ...oldState.skippedTours,
          'dashboard-v2': oldState.skippedTours['dashboard-v1'] || null,
        },
      }),
    },
  ],
};

/**
 * Migrate tour state to latest version
 */
export function migrateTourState(
  tourId: string,
  currentState: TourState,
  currentVersion: string,
  targetVersion: string
): TourState {
  const migrations = TOUR_MIGRATIONS[tourId] || [];

  let state = currentState;
  let version = currentVersion;

  // Apply migrations in sequence
  for (const migration of migrations) {
    if (version === migration.from) {
      state = migration.migrate(state);
      version = migration.to;
    }

    if (version === targetVersion) break;
  }

  return state;
}
```

**Benefits:**
- ✅ Update tours without losing user progress
- ✅ Gradual rollout of new tour versions
- ✅ A/B test tour variations

#### 2. ✅ Feature Flag Integration

**Problem:** Can't hide experimental tour features
**Solution:** Feature flag checks before showing steps
**Research:** [PostHog Feature Flags](https://posthog.com/docs/feature-flags)

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function TourProvider() {
  const proxyFeaturesEnabled = useFeatureFlag('proxy_members_enabled');

  const filteredSteps = useMemo(() => {
    return activeTour?.steps.filter(step => {
      if (!step.featureFlag) return true;
      return useFeatureFlag(step.featureFlag);
    }) || [];
  }, [activeTour, proxyFeaturesEnabled]);

  // ... rest of provider
}
```

**Benefits:**
- ✅ Progressive rollout of new tour features
- ✅ A/B test different tour paths
- ✅ Hide beta features from general users

#### 3. ✅ Internationalization (i18n) Ready

**Problem:** Tours are English-only, no localization support
**Solution:** Separate content from structure with react-i18next
**Research:** See Section "🌐 Internationalization (i18n)" above

**Benefits:**
- ✅ Easy to add languages later
- ✅ Content updates without code changes
- ✅ Professional localization workflow
- ✅ RTL support for Arabic/Hebrew

#### 4. ✅ A/B Testing Infrastructure

**Problem:** Can't test tour effectiveness
**Solution:** PostHog experiment framework integration
**Research:** See Section "🧪 A/B Testing with PostHog" above

**Benefits:**
- ✅ Data-driven tour optimization
- ✅ Test different teaching approaches
- ✅ Measure impact on user retention

#### 5. ✅ Interactive Tour Steps

**Problem:** Tours are passive, users just click "Next"
**Solution:** Task-based steps with validation
**Research:** See Section "🔄 Interactive Tour Best Practices" above

**Benefits:**
- ✅ Higher engagement (60% better completion)
- ✅ Muscle memory formation
- ✅ Validates user understanding

#### 6. ✅ Mobile-Responsive Design

**Problem:** Tours are desktop-only
**Solution:** Character limits, responsive placement, truncation
**Research:** See Section "📱 Mobile Tooltip Best Practices" above

**Benefits:**
- ✅ 50%+ of users on mobile
- ✅ Higher mobile completion rates
- ✅ Better UX on small screens

#### 7. ✅ Tour Analytics Dashboard (Admin)

**Problem:** No visibility into tour performance
**Solution:** Admin page with tour metrics
**Research:** [PostHog Insights](https://posthog.com/docs/product-analytics/insights)

**File:** `src/app/admin/tours/page.tsx`

```
/admin/tours
├── Tour completion rates (%)
├── Average time per tour
├── Drop-off points heatmap
├── Auto-start vs manual trigger comparison
├── Tour variant performance (A/B test results)
└── User feedback summary
```

**Benefits:**
- ✅ Data-driven improvements
- ✅ Identify problematic steps
- ✅ Justify tour updates with metrics

### Phase 2: Deferred to v2.1+ (5 NEW items)

#### 8. ⏭️ Tour Dependency Chain

**Problem:** Advanced tours assume users completed basics
**Solution:** Dependency graph with prerequisites

```typescript
export const analytics: TourDefinition = {
  id: 'analytics-v1',
  // ... other config
  prerequisites: ['dashboard-v1', 'submit-steps-v1'], // Must complete these first
  suggestedAfter: ['leaderboard-v1'], // Recommended order
};
```

**When to implement:** When tour library grows to 10+ tours

**Benefits:**
- Guided learning progression
- Prevent confusion from skipping basics
- Smart tour suggestions

#### 9. ⏭️ Context-Aware Tour Recommendations

**Problem:** Users don't know which tour to take next
**Solution:** ML-based recommendations using PostHog
**Research:** [PostHog AI Assistant](https://posthog.com/ai-assistant)

```typescript
// Recommend tours based on:
// - User behavior (pages visited, features used)
// - Similar user cohorts
// - Time since last tour
// - Feature adoption gaps

const recommendedTour = await posthog.getAIRecommendation('next_tour', {
  user_id: userId,
  completed_tours: completedTourIds,
  last_tour_date: lastTourTimestamp,
  features_used: ['submit_steps', 'leaderboard'],
});
```

**When to implement:** After collecting 3+ months of tour analytics data

**Benefits:**
- Personalized onboarding paths
- Higher feature adoption
- Reduced cognitive load

#### 10. ⏭️ Gamification & Achievements

**Problem:** No incentive to complete tours
**Solution:** Badges, points, and achievements
**Research:** Duolingo onboarding patterns, [Gamification in SaaS](https://www.productled.org/blog/gamification-in-saas)

```typescript
// Example achievements:
const TOUR_ACHIEVEMENTS = {
  'first_tour': {
    name: 'Getting Started',
    description: 'Complete your first tour',
    icon: '🎓',
    points: 10,
  },
  'all_tours': {
    name: 'Tour Expert',
    description: 'Complete all 7 tours',
    icon: '🏆',
    points: 100,
  },
  'speed_runner': {
    name: 'Speed Runner',
    description: 'Complete dashboard tour in under 2 minutes',
    icon: '⚡',
    points: 50,
  },
};
```

**When to implement:** After user retention data shows need for engagement boost

**Benefits:**
- Increased completion rates
- Social sharing (leaderboard for tour completions)
- Brand loyalty

#### 11. ⏭️ Video Tour Variants

**Problem:** Some users prefer video over text
**Solution:** A/B test video tours vs interactive tours
**Research:** [Loom for Product Tours](https://www.loom.com/use-case/product-tours), PostHog video experiments

```typescript
const VIDEO_TOUR_VARIANT = {
  type: 'video',
  url: 'https://cdn.stepleague.com/tours/dashboard-intro.mp4',
  duration: 90, // seconds
  captions: true,
  autoplay: true,

  // Interactive CTA at end
  cta: {
    text: 'Try it yourself',
    action: () => startInteractiveTour('dashboard-v1'),
  },
};
```

**When to implement:** After A/B testing shows mixed results for interactive tours

**Benefits:**
- Faster comprehension for visual learners
- Reduced cognitive load
- Better for complex workflows

#### 12. ⏭️ AI-Powered Tour Generation

**Problem:** Creating tours for new features is manual
**Solution:** AI generates tour steps from component metadata
**Research:** [Claude AI for Documentation](https://claude.ai), React component analysis

```typescript
// Example: AI generates tour from component props
const generateTourFromComponent = async (componentPath: string) => {
  const component = await analyzeComponent(componentPath);

  const prompt = `
    Generate a product tour for this React component:
    Name: ${component.name}
    Props: ${JSON.stringify(component.props)}
    Actions: ${component.actions.join(', ')}

    Tour should:
    - Highlight key features
    - Use data-tour attributes
    - Follow StepLeague's tone (friendly, concise)
    - Include mobile versions (max 130 chars)
  `;

  const tour = await claude.generate(prompt);
  return tour;
};
```

**When to implement:** After accumulating 50+ component tour patterns for training data

**Benefits:**
- 10x faster tour creation
- Consistent quality
- Auto-update tours when components change

---

## Implementation Plan (COMPREHENSIVE)

> **FOR IMPLEMENTATION AGENT:** Follow this plan step-by-step. DO NOT skip phases.

### Phase 1: Infrastructure (Priority 1) - Week 1

**Goal:** Build modular foundation with performance optimizations

**BEFORE YOU START:**
1. ✅ Read entire PRD twice
2. ✅ Research all linked sources
3. ✅ Set up PostHog experiment (5% rollout)
4. ✅ Install dependencies:
   ```bash
   npm install react-joyride@2.9.3
   npm install react-i18next i18next i18next-browser-languagedetector
   npm install -D @types/react-joyride
   ```

**Tasks:**

1. **Create tour types and registry structure**
   - [ ] File: `src/lib/tours/types.ts` (copy from Section 1 above)
   - [ ] File: `src/lib/tours/registry.ts` (copy from Section 2 above)
   - [ ] Validate: `npx tsc --noEmit` passes

2. **Build TourProvider with performance optimizations**
   - [ ] File: `src/components/tours/TourProvider.tsx`
   - [ ] Implement `startTransition` for state updates (React 18)
   - [ ] Implement `requestIdleCallback` for localStorage (Safari fallback: setTimeout)
   - [ ] Implement deferred feedback dialog with `setTimeout(0)`
   - [ ] Implement beforeunload safety handler
   - [ ] Validate: INP <150ms on "Next" button click (use Chrome DevTools)

   **CRITICAL PERFORMANCE CODE:**
   ```typescript
   const handleJoyrideCallback = useCallback((data: CallBackProps) => {
     const { status, action, index, type } = data;

     // CRITICAL PATH: Keep synchronous
     if (type === EVENTS.STEP_AFTER) {
       setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
       analytics.tours.stepCompleted(activeTour?.id, index);
     }

     // OPTIMIZATION: Defer non-critical updates
     if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
       setRun(false);

       // Low-priority: Mark complete with startTransition
       if (activeTour) {
         startTransition(() => {
           markTourComplete(activeTour.id, activeTour.version);
           analytics.tours.completed(activeTour.id, status === STATUS.SKIPPED);
         });
       }

       // Defer feedback dialog to next frame
       if (status === STATUS.FINISHED) {
         setTimeout(() => setShowFeedback(true), 0);
       }
     }
   }, [activeTour]);

   // CRITICAL: Deferred localStorage writes
   const saveToLocalStorage = useCallback(() => {
     const save = () => {
       try {
         localStorage.setItem('stepleague-tours', JSON.stringify(tourState));
       } catch (error) {
         console.error('Failed to save tour state:', error);
       }
     };

     // Use requestIdleCallback for best performance
     if (typeof requestIdleCallback !== 'undefined') {
       requestIdleCallback(save, { timeout: 2000 });
     } else {
       // Safari fallback
       setTimeout(save, 0);
     }
   }, [tourState]);
   ```

3. **Create shadcn TourFeedbackDialog component**
   - [ ] File: `src/components/tours/TourFeedbackDialog.tsx`
   - [ ] Use shadcn Dialog, Button, FormTextarea
   - [ ] Use semantic CSS variables: `bg-card`, `text-foreground`, `border-border`
   - [ ] POST to `/api/feedback/module` with `tour-${tourId}`
   - [ ] Validate: Works in both light AND dark mode

4. **Implement comprehensive analytics tracking (ALL 3 MCPs)**
   - [ ] File: `src/lib/tours/analytics.ts` (PostHog MCP - PRIMARY)
     - [ ] Track 10 events: tour_started, step_viewed, step_completed, tour_completed, tour_skipped, tour_drop_off, validation_success, validation_failure, feedback_submitted, menu_interaction
     - [ ] Set user properties: tours_completed, total_tours_completed, completion_rate, favorite_category
     - [ ] Create retention cohorts: completed_all_tours, completed_dashboard, skipped_all
   - [ ] File: `src/lib/tours/gtm-integration.ts` (Google Tag Manager MCP - SECONDARY)
     - [ ] Push to dataLayer: tour_interaction, conversion, engagement_time
     - [ ] Configure GA4 custom dimensions: tour_id, tour_category, experiment_variant
   - [ ] File: `src/lib/tours/supabase-sync.ts` (Supabase MCP - PERSISTENCE)
     - [ ] Create migration for tour_completions, tour_step_interactions, tour_feedback tables
     - [ ] Implement saveTourCompletion, saveStepInteraction, saveFeedback methods
   - [ ] File: `src/lib/tours/unified-analytics.ts` (UNIFIED FACADE)
     - [ ] Create UnifiedTourAnalytics class that syncs to all 3 systems
     - [ ] Implement trackTourStart, trackTourComplete, trackStepInteraction
   - [ ] Validate: Events appear in PostHog dashboard, GA4, and Supabase tables

5. **Add CSS GPU optimizations**
   - [ ] File: `src/app/globals.css` (lines 865-868)
   - [ ] Add `will-change: z-index` to header during tour
   - [ ] Add `transform: translateZ(0)` for GPU acceleration
   - [ ] Validate: No layout thrashing during tour

6. **Create i18n configuration**
   - [ ] File: `src/lib/tours/i18n.ts` (copy from Section 3 above)
   - [ ] File: `src/locales/en/tours.json` (copy from Section 3 above)
   - [ ] Validate mobile character limits:
     ```bash
     npm run validate-tour-content
     ```

7. **Create PostHog experiments integration**
   - [ ] File: `src/lib/tours/experiments.ts` (copy from Section 4 above)
   - [ ] Set up PostHog experiment: `dashboard-tour-test`
   - [ ] Variants: control, concise, interactive
   - [ ] Validate: Variant selection works

8. **Create interactive validation system**
   - [ ] File: `src/lib/tours/validation.ts` (copy from Section 5 above)
   - [ ] Implement event, element, timeout validation
   - [ ] Validate: Test with mock analytics event

**Success Criteria:**
- [ ] ✅ TypeScript types defined (no errors)
- [ ] ✅ Provider compiles with <150ms INP target architecture
- [ ] ✅ shadcn Dialog renders correctly in light/dark mode
- [ ] ✅ Analytics events fire in PostHog dashboard
- [ ] ✅ i18n translations load correctly
- [ ] ✅ PostHog experiment variant selection works

### Phase 2: Tour Definitions (Priority 2) - Week 1-2

**Goal:** Create all 7 modular tour definitions with comprehensive navigation coverage

**Tours Overview:**

| Tour | Steps | Duration | Auto-Start | Focus | Mobile Steps |
|------|-------|----------|------------|-------|--------------|
| **Dashboard (Welcome)** | 11 | 180s | ✅ Yes | Complete navigation orientation | 5 |
| **League Creation** | 5 | 90s | ✅ Yes | Creating first league | 3 |
| **Submit Steps** | 7 | 120s | ✅ Yes | Three submission methods | 4 |
| **Leaderboard** | 5 | 75s | ✅ Yes | Filters and competition | 3 |
| **Analytics** | 4 | 90s | ✅ Yes | Heatmaps and stats | 3 |
| **Settings** | 5 | 60s | ❌ Manual | Profile customization | 3 |
| **Admin Tools** | 5 | 90s | ❌ Manual | Admin-only features | 3 |
| **TOTAL** | **42** | **~12 min** | | | **24** |

**CRITICAL: Menu Interaction Prevention**

All navigation-focused steps MUST include:
```typescript
{
  target: '[data-tour="nav-submit-steps"]',
  contentKey: 'dashboard.nav_submit_steps.content',
  placement: 'bottom',
  disableOverlay: true,   // ✅ Allows clicking outside tooltip
  spotlightClicks: true,  // ✅ Allows clicking highlighted element
}
```

**RESEARCH REQUIREMENT:**
Before writing each tour, research:
1. **Best practices** for that specific feature (submit steps, leaderboard, etc.)
2. **Competitor tours** (Strava, MyFitnessPal, Fitbit) - what do they highlight?
3. **Mobile optimization** - how to convey same info in 130 chars
4. **User pain points** - what questions does support get about this feature?

**Tasks:**

1. **Dashboard Tour (11 steps, comprehensive navigation)**
   - [ ] File: `src/lib/tours/definitions/dashboard.tour.ts`
   - [ ] Research: [Appcues Navigation Tours](https://www.appcues.com/blog/product-tours-ui-patterns)
   - [ ] Steps:
     - [ ] welcome_intro (center, no target)
     - [ ] dashboard_header (introduce page)
     - [ ] nav_menu_intro (transition to navigation)
     - [ ] nav_submit_steps (MOST IMPORTANT - disableOverlay + spotlightClicks)
     - [ ] nav_league_menu (disableOverlay + spotlightClicks)
     - [ ] nav_leaderboard (disableOverlay + spotlightClicks)
     - [ ] nav_analytics (disableOverlay + spotlightClicks)
     - [ ] nav_settings (disableOverlay + spotlightClicks)
     - [ ] nav_help_menu (disableOverlay + spotlightClicks)
     - [ ] getting_started_cta (next action)
     - [ ] tour_replay_tip (final tip)
   - [ ] Mobile: Truncate to 5 steps (welcome, submit, league, analytics, replay)
   - [ ] Validate: All contentKeys exist in `locales/en/tours.json`
   - [ ] Validate: Mobile content <130 chars, <3 lines

2. **League Creation Tour (5 steps)**
   - [ ] File: `src/lib/tours/definitions/league.tour.ts`
   - [ ] Research: [How to Onboard to Create Features](https://userpilot.com/blog/create-product-tours/)
   - [ ] Steps:
     - [ ] league_intro
     - [ ] league_name_field
     - [ ] league_privacy
     - [ ] league_start_date
     - [ ] league_create_btn
   - [ ] Mobile: Keep all 5 steps (simple form)
   - [ ] Validate: Character limits

3. **Submit Steps Tour (7 steps, critical workflow)**
   - [ ] File: `src/lib/tours/definitions/submit.tour.ts`
   - [ ] Research: Strava upload flow, MyFitnessPal data entry
   - [ ] Steps:
     - [ ] submit_intro
     - [ ] submission_modes (single/batch/bulk)
     - [ ] date_picker
     - [ ] screenshot_upload
     - [ ] manual_entry
     - [ ] verification_explained
     - [ ] submit_button
   - [ ] Mobile: 4 steps (intro, modes, upload, submit)
   - [ ] Validate: Covers all 3 submission modes

4. **Leaderboard Tour (5 steps)**
   - [ ] File: `src/lib/tours/definitions/leaderboard.tour.ts`
   - [ ] Research: Strava segments, Fitbit challenges
   - [ ] Steps:
     - [ ] leaderboard_intro
     - [ ] period_filters (disableOverlay + spotlightClicks)
     - [ ] verified_filter (disableOverlay + spotlightClicks)
     - [ ] leaderboard_table
     - [ ] share_achievement
   - [ ] Mobile: 3 steps (intro, filters, table)

5. **Analytics Tour (4 steps)**
   - [ ] File: `src/lib/tours/definitions/analytics.tour.ts`
   - [ ] Research: Fitbit dashboard, Garmin stats
   - [ ] Steps:
     - [ ] analytics_intro
     - [ ] calendar_heatmap
     - [ ] daily_breakdown
     - [ ] personal_records
   - [ ] Mobile: Keep all 4 (visual features)

6. **Settings Tour (5 steps, manual only)**
   - [ ] File: `src/lib/tours/definitions/settings.tour.ts`
   - [ ] autoStart: false (manual launch only)
   - [ ] Steps:
     - [ ] settings_intro
     - [ ] display_name
     - [ ] nickname
     - [ ] units_preference
     - [ ] theme_toggle
   - [ ] Mobile: 3 steps (intro, name, units)

7. **Admin Tour (5 steps, admin-only, manual)**
   - [ ] File: `src/lib/tours/definitions/admin.tour.ts`
   - [ ] autoStart: false
   - [ ] requiredRole: 'admin'
   - [ ] Steps:
     - [ ] admin_intro
     - [ ] invite_code (disableOverlay + spotlightClicks)
     - [ ] proxy_members (disableOverlay + spotlightClicks)
     - [ ] league_settings (disableOverlay + spotlightClicks)
     - [ ] verify_submissions
   - [ ] Mobile: 3 steps (intro, invite, verify)

8. **Update tour registry**
   - [ ] File: `src/lib/tours/registry.ts`
   - [ ] Import all 7 tours
   - [ ] Export TOUR_REGISTRY with all IDs
   - [ ] Validate: Type-safe tour IDs

**Success Criteria:**
- [ ] ✅ All 7 tours defined with metadata
- [ ] ✅ Total 42 steps across all tours (desktop)
- [ ] ✅ Total 24 steps for mobile
- [ ] ✅ Auto-start conditions configured
- [ ] ✅ **Navigation tour demonstrates ALL major features**
- [ ] ✅ **Menu items are clickable during tours** (disableOverlay + spotlightClicks)
- [ ] ✅ All contentKeys exist in translations
- [ ] ✅ Mobile content validated (<130 chars, <3 lines)

### Phase 3: Integration (Priority 3) - Week 2

**Goal:** Wire up tours to existing pages and navigation

**Required data-tour Attributes:**

Must be added to components for tours to work. Use `data-tour` attribute, NOT classes.

**Navigation (NavHeader.tsx):**
```tsx
<Link href="/submit-steps" data-tour="nav-submit-steps">
<button data-tour="nav-league-menu">
<Link href="/league/[id]/leaderboard" data-tour="nav-leaderboard">
<Link href="/league/[id]/analytics" data-tour="nav-analytics">
<button data-tour="nav-user-menu">
<button data-tour="nav-help-menu">
```

**Dashboard Page:**
```tsx
<h1 data-tour="dashboard-header">
<Button data-tour="create-league">
<Button data-tour="join-league">
```

**League Creation Page:**
```tsx
<Input data-tour="league-name">
<Switch data-tour="league-privacy">
<DatePicker data-tour="league-start-date">
<Button data-tour="league-create-button">
```

**Submit Steps Page:**
```tsx
<ToggleGroup data-tour="batch-toggle">
<DatePicker data-tour="date-picker">
<FileUpload data-tour="screenshot-upload">
<Input data-tour="steps-input">
<Button data-tour="submit-button">
```

**Leaderboard Page:**
```tsx
<Select data-tour="leaderboard-filters">
<Switch data-tour="verified-filter">
<Table data-tour="leaderboard-table">
<Button data-tour="share-button">
```

**Analytics Page:**
```tsx
<CalendarHeatmap data-tour="calendar-heatmap">
<Table data-tour="daily-breakdown">
<Card data-tour="personal-records">
```

**Settings Page:**
```tsx
<Input data-tour="display-name">
<Input data-tour="nickname">
<Select data-tour="units">
<ThemeToggle data-tour="theme-toggle">
```

**Admin Areas:**
```tsx
<Button data-tour="invite-button">
<Select data-tour="proxy-members">
<Link data-tour="league-settings">
<Badge data-tour="pending-submissions">
```

**Tasks:**

1. **Replace OnboardingProvider with TourProvider in root layout**
   - [ ] File: `src/app/layout.tsx`
   - [ ] Remove: `import { OnboardingProvider } from '@/components/providers/OnboardingProvider'`
   - [ ] Add: `import { TourProvider } from '@/components/tours/TourProvider'`
   - [ ] Wrap children with TourProvider
   - [ ] Validate: App loads without errors

2. **Update menuConfig.ts with new tour IDs**
   - [ ] File: `src/lib/menuConfig.ts`
   - [ ] Update hrefs: `#tour-dashboard-v1`, `#tour-league-creation-v1`, etc.
   - [ ] Add new tour menu items (if missing)
   - [ ] Validate: Help menu shows all 7 tours

3. **Update NavHeader.tsx tour trigger logic**
   - [ ] File: `src/components/navigation/NavHeader.tsx`
   - [ ] Use `useTour()` hook
   - [ ] Implement hash-based tour launching: `if (hash === '#tour-dashboard-v1') startTour('dashboard-v1')`
   - [ ] Validate: Clicking "Dashboard Tour" in Help menu starts tour

4. **Add data-tour attributes to ALL pages**
   - [ ] Dashboard page: header, create-league, join-league
   - [ ] League creation page: name, privacy, start-date, create-button
   - [ ] Submit steps page: batch-toggle, date-picker, screenshot-upload, steps-input, submit-button
   - [ ] Leaderboard page: leaderboard-filters, verified-filter, leaderboard-table, share-button
   - [ ] Analytics page: calendar-heatmap, daily-breakdown, personal-records
   - [ ] Settings page: display-name, nickname, units, theme-toggle
   - [ ] Admin areas: invite-button, proxy-members, league-settings, pending-submissions
   - [ ] Validate: All 42 steps target correct elements

5. **Delete old OnboardingProvider.tsx file**
   - [ ] File: `src/components/providers/OnboardingProvider.tsx` ❌ DELETE
   - [ ] Validate: No import errors
   - [ ] Validate: Git shows 652 lines removed

6. **Update help menu database entries (if needed)**
   - [ ] Check: menu_items table has tour entries
   - [ ] SQL migration if needed (see PRD Section "Database Changes")
   - [ ] Validate: Help menu shows new tour names

7. **Update globals.css with Joyride theme variables**
   - [ ] File: `src/app/globals.css`
   - [ ] Add CSS from PRD (Section "Joyride Theme Styling")
   - [ ] Lines 865-868: Update with theme-aware variables
   - [ ] Validate: Tours look correct in light AND dark mode

**Success Criteria:**
- [ ] ✅ Tours launch from Help menu
- [ ] ✅ Auto-start works on first visits
- [ ] ✅ No console errors
- [ ] ✅ Old OnboardingProvider fully removed (652 lines deleted)
- [ ] ✅ All data-tour attributes work (42 steps target correct elements)
- [ ] ✅ Joyride theme matches design system (light/dark mode)

### Phase 4: Testing & Optimization (Priority 4) - Week 2-3

**Goal:** Verify performance and functionality

**Manual Testing Checklist:**

1. **INP Testing (Chrome DevTools)**
   - [ ] Open Chrome DevTools → Performance tab
   - [ ] Start tour
   - [ ] Click "Next" button 5 times
   - [ ] Measure INP for each click
   - [ ] Validate: Average INP <150ms (target: <120ms)

2. **Cross-Browser Testing**
   - [ ] Chrome (latest)
   - [ ] Firefox (latest)
   - [ ] Safari (latest) - CRITICAL: Test requestIdleCallback fallback
   - [ ] Edge (latest)
   - [ ] Mobile Safari (iOS)
   - [ ] Mobile Chrome (Android)
   - [ ] Validate: All browsers render tours correctly

3. **Light/Dark Mode Testing**
   - [ ] Test all 7 tours in light mode
   - [ ] Test all 7 tours in dark mode
   - [ ] Validate: Contrast ratios meet WCAG 2.1 AA (4.5:1 minimum)
   - [ ] Validate: No hardcoded colors

4. **Mobile Responsive Testing**
   - [ ] iPhone SE (375px width)
   - [ ] iPhone 14 Pro (390px width)
   - [ ] iPad (768px width)
   - [ ] Validate: Mobile content <130 chars
   - [ ] Validate: Tooltip placement doesn't block content
   - [ ] Validate: Tours truncate to mobile step count

5. **Analytics Event Verification**
   - [ ] Start tour → Check PostHog: `tour_started` event
   - [ ] Click Next → Check PostHog: `step_completed` event
   - [ ] Complete tour → Check PostHog: `tour_completed` event
   - [ ] Skip tour → Check PostHog: `tour_completed` with `completion_type: 'skipped'`
   - [ ] Validate: All events have correct properties (tour_id, variant, etc.)

6. **A/B Testing Verification**
   - [ ] Set PostHog experiment to 50/50 split
   - [ ] Open 10 incognito windows
   - [ ] Validate: ~50% get control, ~50% get variant
   - [ ] Validate: Variant tour renders correctly

7. **i18n Verification**
   - [ ] Change language to Spanish (if available)
   - [ ] Validate: Tour content translates
   - [ ] Validate: RTL languages flip tooltip placement
   - [ ] Validate: Duration formatting uses locale

8. **Interactive Step Validation**
   - [ ] Test event-based validation (e.g., league creation)
   - [ ] Test timeout validation (auto-advance after X seconds)
   - [ ] Validate: Failed validation shows error/hint

**Automated Testing:**

1. **Unit Tests (Vitest)**
   - [ ] File: `src/components/tours/__tests__/TourProvider.test.tsx`
   - [ ] Test: State hydration from localStorage
   - [ ] Test: Schema migration (v1 → v2)
   - [ ] Test: Performance optimizations (requestIdleCallback, startTransition)
   - [ ] Test: Analytics integration
   - [ ] Test: Tour filtering (role-based)
   - [ ] File: `src/components/tours/__tests__/TourFeedbackDialog.test.tsx`
   - [ ] Test: Theme-aware rendering
   - [ ] Test: API submission
   - [ ] Test: Light/dark mode support
   - [ ] Validate: `npm run test` passes

2. **E2E Tests (Playwright)**
   - [ ] File: `tests/e2e/tours.spec.ts`
   - [ ] Test: Auto-start on first visit
   - [ ] Test: Manual launch from Help menu
   - [ ] Test: Skip functionality
   - [ ] Test: Completion flow
   - [ ] Test: Feedback dialog
   - [ ] Test: localStorage persistence
   - [ ] Test: Light mode compatibility
   - [ ] Test: Dark mode compatibility
   - [ ] Test: Analytics event tracking
   - [ ] Test: Role-based tour visibility
   - [ ] Test: INP performance (<200ms)
   - [ ] **CRITICAL: Menu Interaction Tests**
     - [ ] Test: Clicking menu items DURING active tour
     - [ ] Test: Menu interaction AFTER skipping tour
     - [ ] Test: Menu interaction AFTER completing feedback dialog
     - [ ] Test: Menu interaction AFTER clicking outside tour
     - [ ] Test: ALL menu items clickable during navigation steps
     - [ ] Test: Rapid skip → navigate sequence (stress test)
     - [ ] Test: Keyboard navigation in menus during tour
     - [ ] Test: Rapid menu clicks without freezing
     - [ ] Test: Event listener cleanup after tour completion
     - [ ] Test: ESC key handling and menu restoration
   - [ ] Validate: `npm run test:e2e` passes

3. **Visual Regression Tests (Optional)**
   - [ ] File: `tests/visual/tours.spec.ts`
   - [ ] Screenshot: Dashboard tour (dark mode)
   - [ ] Screenshot: Dashboard tour (light mode)
   - [ ] Screenshot: Feedback dialog (dark mode)
   - [ ] Screenshot: Feedback dialog (light mode)
   - [ ] Validate: No visual regressions

**Success Criteria:**
- [ ] ✅ All manual tests pass
- [ ] ✅ All unit tests pass (100% coverage for TourProvider)
- [ ] ✅ All E2E tests pass (including 10+ menu interaction tests)
- [ ] ✅ INP reduced from 445ms → <150ms (67% improvement)
- [ ] ✅ No functional regressions
- [ ] ✅ Analytics events tracked in PostHog/GA4
- [ ] ✅ A/B testing works (50/50 variant split)
- [ ] ✅ i18n translations load correctly
- [ ] ✅ Mobile responsive (all screen sizes)

### Phase 5: Future-Proofing (Priority 5) - Week 3

**Goal:** Implement 3 of 12 proactive items (others deferred to v2.1+)

**Immediate Implementation:**

1. **Version-Based Migration System**
   - [ ] File: `src/lib/tours/migrations.ts` (copy from Section "12 Proactive Items" above)
   - [ ] Implement migration function
   - [ ] Test: Migrate v1.0.0 → v1.1.0 preserves completion
   - [ ] Test: Migrate v1.1.0 → v2.0.0 resets completion
   - [ ] Validate: User progress preserved for minor versions

2. **Feature Flag Integration**
   - [ ] Use existing `useFeatureFlag` hook
   - [ ] Add `featureFlag` prop to TourStep type
   - [ ] Filter steps based on feature flags
   - [ ] Test: Step hidden when flag disabled
   - [ ] Validate: Feature flags work in TourProvider

3. **Analytics Dashboard Foundation (Admin)**
   - [ ] File: `src/app/admin/tours/page.tsx`
   - [ ] Fetch tour analytics from PostHog
   - [ ] Display:
     - [ ] Tour completion rates (%)
     - [ ] Average time per tour
     - [ ] Drop-off points heatmap
     - [ ] Auto-start vs manual trigger comparison
     - [ ] Tour variant performance (A/B test results)
     - [ ] User feedback summary
   - [ ] Validate: Admin can view all tour metrics

**Deferred to v2.1+ (Document for future):**

4. **Tour Dependency Chain** - Implement when library grows to 10+ tours
5. **Context-Aware Recommendations** - Implement after 3+ months of analytics data
6. **Gamification & Achievements** - Implement if retention data shows need
7. **Video Tour Variants** - Implement if A/B tests show mixed results
8. **AI-Powered Tour Generation** - Implement after 50+ component patterns

**Success Criteria:**
- [ ] ✅ Version migration system works (tested with v1.0 → v1.1 → v2.0)
- [ ] ✅ Feature flag integration works
- [ ] ✅ Admin dashboard shows tour analytics
- [ ] ✅ Documentation created for deferred items

---

## Data Migration

### localStorage Schema Change

**Old Schema (v1):**
```json
{
  "completedTours": ["new-user", "member", "admin"],
  "lastSeenVersion": "1.0.0"
}
```

**New Schema (v2):**
```json
{
  "completedTours": {
    "dashboard-v1": "1.0.0",
    "submit-steps-v1": "1.0.0",
    "admin-v1": "1.0.0"
  },
  "skippedTours": {},
  "tourProgress": {},
  "interactionHistory": [],
  "lastUpdated": 1706140800000,
  "schemaVersion": 2
}
```

**Migration Function:**

```typescript
function migrateTourState(oldState: any): TourState {
  // Already v2
  if (oldState.schemaVersion === 2) return oldState;

  // Map old tour names to new IDs
  const tourMapping: Record<string, string> = {
    'new-user': 'dashboard-v1',
    'member': 'submit-steps-v1',
    'admin': 'admin-v1',
    'leaderboard': 'leaderboard-v1',
    'navigation': 'settings-v1',
  };

  const completedTours: Record<string, string> = {};
  (oldState.completedTours || []).forEach((oldTour: string) => {
    const newId = tourMapping[oldTour];
    if (newId) completedTours[newId] = '1.0.0';
  });

  return {
    completedTours,
    skippedTours: {},
    tourProgress: {},
    interactionHistory: [],
    lastUpdated: Date.now(),
    schemaVersion: 2,
  };
}
```

### Database Changes

**Menu Items Update:**

```sql
-- Update existing tour menu items
UPDATE menu_items SET href = '#tour-dashboard-v1' WHERE item_key = 'tour-new-user';
UPDATE menu_items SET href = '#tour-submit-steps-v1' WHERE item_key = 'tour-member';
UPDATE menu_items SET href = '#tour-settings-v1' WHERE item_key = 'tour-navigation';
UPDATE menu_items SET href = '#tour-leaderboard-v1' WHERE item_key = 'tour-leaderboard';
UPDATE menu_items SET href = '#tour-admin-v1' WHERE item_key = 'tour-admin';

-- Add new tour items
INSERT INTO menu_items (menu_id, item_key, label, href, icon, sort_order)
VALUES
  ((SELECT id FROM menu_definitions WHERE key = 'help'), 'tour-league', 'League Creation Tour', '#tour-league-creation-v1', '🎯', 2),
  ((SELECT id FROM menu_definitions WHERE key = 'help'), 'tour-analytics', 'Analytics Tour', '#tour-analytics-v1', '📊', 5);
```

---

## Performance Targets

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **INP (Next button)** | 445.9ms | <150ms | -66% |
| **Input delay** | 283.1ms | <80ms | -72% |
| **Processing time** | 145ms | <50ms | -66% |
| **localStorage writes/sec** | ~5 (sync) | 0.5 (async) | -90% |
| **Bundle size** | ~15KB | ~8KB | -47% |
| **Tour start time** | ~300ms | <100ms | -67% |
| **Mobile completion rate** | 0% (tours broken) | >50% | +∞% |

---

## Success Metrics

### Technical (Must-Have)

- ✅ INP <200ms (target: <150ms) on all devices
- ✅ Zero tour-related console errors
- ✅ Bundle size reduction >40%
- ✅ 100% backward compatibility (localStorage migration)
- ✅ WCAG 2.1 AA compliance (4.5:1 contrast minimum)
- ✅ Mobile responsive (375px-1920px widths)

### Business (Target)

- ✅ Tour completion rate >60% (industry standard: 40-50%)
- ✅ User retention +15% for tour completers vs non-completers
- ✅ Support tickets reduced by 20% (fewer "how do I" questions)
- ✅ Feature adoption +25% for toured features
- ✅ Time-to-first-action <5 minutes for new users

### User Experience (Target)

- ✅ Average tour duration <2 minutes per tour
- ✅ Post-tour feedback rating >4.0/5.0
- ✅ Mobile tour completion rate >50%
- ✅ Drop-off rate <10% before step 3
- ✅ Tour restart rate <5% (tours are clear the first time)

---

## Files Summary

### Created (30+ files)

**Core Infrastructure:**
1. `src/lib/tours/types.ts` - Type definitions (TourStep, TourDefinition, TourState)
2. `src/lib/tours/registry.ts` - Tour manifest and helper functions
3. `src/lib/tours/analytics.ts` - PostHog MCP analytics tracking (10 events, user properties, cohorts)
4. `src/lib/tours/gtm-integration.ts` - Google Tag Manager MCP integration (GA4 events)
5. `src/lib/tours/supabase-sync.ts` - Supabase MCP persistence (completions, interactions, feedback)
6. `src/lib/tours/unified-analytics.ts` - Unified analytics facade (syncs all 3 MCPs)
7. `src/lib/tours/i18n.ts` - i18n configuration with react-i18next
8. `src/lib/tours/migrations.ts` - Version migration logic
9. `src/lib/tours/experiments.ts` - PostHog A/B testing integration
10. `src/lib/tours/validation.ts` - Interactive step validation

**Tour Definitions (7 files):**
11. `src/lib/tours/definitions/dashboard.tour.ts` - Dashboard tour (11 steps)
12. `src/lib/tours/definitions/league.tour.ts` - League creation (5 steps)
13. `src/lib/tours/definitions/submit.tour.ts` - Submit steps (7 steps)
14. `src/lib/tours/definitions/leaderboard.tour.ts` - Leaderboard (5 steps)
15. `src/lib/tours/definitions/analytics.tour.ts` - Analytics (4 steps)
16. `src/lib/tours/definitions/settings.tour.ts` - Settings (5 steps)
17. `src/lib/tours/definitions/admin.tour.ts` - Admin (5 steps)

**Components:**
18. `src/components/tours/TourProvider.tsx` - Optimized provider
19. `src/components/tours/TourFeedbackDialog.tsx` - shadcn Dialog
20. `src/components/tours/TourTrigger.tsx` - Reusable trigger button
21. `src/components/tours/TourProgress.tsx` - Progress indicator
22. `src/components/tours/ResponsiveTourStep.tsx` - Mobile wrapper

**Hooks:**
23. `src/hooks/useTour.ts` - Tour hook with analytics, i18n, experiments

**Translations:**
24. `src/locales/en/tours.json` - English translations
25. `src/locales/es/tours.json` - Spanish translations (future)
26. `src/locales/index.ts` - i18n setup

**Database Migrations:**
27. `supabase/migrations/YYYYMMDD_tour_analytics_tables.sql` - tour_completions, tour_step_interactions, tour_feedback tables

**Admin:**
28. `src/app/admin/tours/page.tsx` - Analytics dashboard (PostHog, Supabase, GTM visualizations)

**Tests:**
29. `src/components/tours/__tests__/TourProvider.test.tsx` - Unit tests
30. `src/components/tours/__tests__/TourFeedbackDialog.test.tsx` - Unit tests
31. `src/lib/tours/__tests__/unified-analytics.test.tsx` - Analytics integration tests
32. `tests/e2e/tours.spec.ts` - E2E tests (20+ test cases)
33. `tests/e2e/tours-analytics.spec.ts` - Analytics E2E tests (verify PostHog, GA4, Supabase)
34. `tests/visual/tours.spec.ts` - Visual regression (optional)

### Modified (6 files)

1. `src/app/layout.tsx` - Provider swap (OnboardingProvider → TourProvider)
2. `src/lib/menuConfig.ts` - Tour menu items (update hrefs)
3. `src/components/navigation/NavHeader.tsx` - Tour triggers (hash-based launching)
4. `src/app/globals.css` - Joyride CSS variables (lines 865-868+)
5. **All page files** - data-tour attributes (42+ attributes added)
6. Database: `menu_items` table - Tour hrefs updated

### Deleted (1 file)

1. `src/components/providers/OnboardingProvider.tsx` ❌ (652 lines removed)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users lose tour progress | Low | Medium | Migration function preserves old completions |
| INP target not met (<150ms) | Low | High | Extensive testing before rollout; can increase to 200ms |
| Tours break on mobile | Medium | High | Responsive testing on real devices required |
| Analytics events missing | Medium | Low | Add automated tests; manual verification in PostHog |
| Safari compatibility issues | Medium | Medium | requestIdleCallback fallback (setTimeout) provided |
| i18n performance issues | Low | Medium | Lazy-load languages; cache translations |
| A/B test skewed results | Medium | Medium | Filter users who completed tour; use PostHog calculator |
| Interactive validation fails | Low | High | Timeout fallback; graceful degradation |

---

## Rollout Strategy

### Phase 1: Development (Week 1-2)
- ✅ Implement infrastructure
- ✅ Create tour definitions
- ✅ Local testing (manual + automated)
- ✅ Performance validation (INP <150ms)

### Phase 2: Staging (Week 2)
- ✅ Deploy to staging environment
- ✅ Internal team testing (all 7 tours)
- ✅ Fix bugs
- ✅ Cross-browser testing
- ✅ Mobile testing (iOS/Android)

### Phase 3: Beta (Week 3)
- ✅ Enable for 5% of users (PostHog feature flag)
- ✅ Monitor analytics (completion rates, drop-offs)
- ✅ Gather feedback (TourFeedbackDialog)
- ✅ A/B test dashboard tour variants
- ✅ Iterate based on data

### Phase 4: General Availability (Week 3-4)
- ✅ Roll out to 100% of users
- ✅ Monitor INP metrics (should be <150ms)
- ✅ Track success metrics (completion rate >60%)
- ✅ Iterate based on user feedback

---

## Appendix: Research & Best Practices Summary

### Product Tour Best Practices

**Sources:**
- [Appcues: Product Tour UI/UX Patterns](https://www.appcues.com/blog/product-tours-ui-patterns)
- [Userpilot: How to Create Product Tours](https://userpilot.com/blog/create-product-tours/)
- [Userflow: Ultimate Guide to Product Tours](https://www.userflow.com/blog/the-ultimate-guide-to-product-tours-boost-user-onboarding-and-engagement)
- [Userpilot: 15 Product Tour Examples](https://userpilot.com/blog/product-tour-examples/)

**Key Takeaways:**
- Keep tours short: 3-5 steps for focused tours
- Progressive disclosure: Onboard to each feature as users progress
- Interactive > Passive: 60% higher completion rates
- Use hotspots for non-intrusive guidance
- Personalize for different user segments

### Mobile Tooltip Best Practices

**Sources:**
- [Nudge: Mobile Tooltips Guide](https://www.nudgenow.com/blogs/tooltips-mobile-apps)
- [UserGuiding: Mobile Tooltip Design](https://userguiding.com/blog/mobile-tooltip)
- [Mockplus: Tooltip UI Design](https://www.mockplus.com/blog/post/tooltip-ui-design)
- [Intuit: Tooltips Guidelines](https://contentdesign.intuit.com/product-and-ui/tooltips/)

**Key Takeaways:**
- Header: 60 characters max
- Body: 130 characters max
- Lines: 3 lines max
- Limit tooltips to 1-3 per tour on mobile
- Position close to UI element without covering it
- Use sufficient contrast (WCAG 2.1 AA: 4.5:1)

### React Joyride Interactive Tours

**Sources:**
- [React Joyride: Props Documentation](https://docs.react-joyride.com/props)
- [Telerik: Interactive Guided Tours](https://www.telerik.com/blogs/how-to-create-interactive-guided-tours-web-applications-react-joyride)
- [Smashing Magazine: Product Tours in React](https://www.smashingmagazine.com/2020/08/guide-product-tours-react-apps/)

**Key Takeaways:**
- `spotlightClicks: true` - Allows clicking highlighted element
- `disableOverlay: true` - Allows clicking outside tooltip
- Interactive tours have 60% higher completion rates
- Learn by doing > passive reading

### PostHog A/B Testing

**Sources:**
- [PostHog: Experiments Documentation](https://posthog.com/docs/experiments)
- [PostHog: A/B Testing Best Practices](https://posthog.com/docs/experiments/best-practices)
- [PostHog: Next.js A/B Tests Tutorial](https://posthog.com/tutorials/nextjs-ab-tests)
- [PostHog: A/B Testing Examples](https://posthog.com/product-engineers/ab-testing-examples)

**Key Takeaways:**
- Start with 5% rollout for a few days
- Filter out users who already completed tour
- Use PostHog's recommended running time calculator
- Track multiple metrics (completion, time, feature adoption)
- Test onboarding flows specifically

### React Internationalization (i18n)

**Sources:**
- [Glorywebs: Internationalization in React 2026](https://www.glorywebs.com/blog/internationalization-in-react)
- [BureauWorks: React i18n Best Practices](https://www.bureauworks.com/blog/react-internationalization-best-practices)
- [Creole Studios: React-i18next Guide](https://www.creolestudios.com/react-i18next-simplifying-internationalization-in-react/)
- [Contentful: React Localization](https://www.contentful.com/blog/react-localization-internationalization-i18n/)

**Key Takeaways:**
- Use react-i18next (most popular, flexible)
- Separate content from code (JSON translation files)
- Lazy-load languages for performance
- Use browser detection + manual switcher
- Support RTL languages (Arabic, Hebrew)

---

## Recent Improvements (January 2026)

### Universal Tour State Management

**Status**: ✅ Completed (commit e6298af)

**Problem Solved**:
1. Race condition where tours wouldn't start after completing another tour
2. Silent blocking when trying to start a tour while one is running

**Implementation**:
- Moved feedback dialog opening to effect-based timing (eliminates race condition)
- Added user-friendly confirmation dialog for tour switching
- Both fixes are universal and automatic for all tours

**Architecture Benefits**:
- Zero tour-specific code
- Future-proof (applies to all new tours automatically)
- Modular and maintainable

**Files Modified**:
- `src/components/tours/TourProvider.tsx` - Core state management
- `src/lib/tours/types.ts` - Context type updates

### Submit Steps Tour Migration to Batch Mode

**Status**: ✅ Completed (current session)

**Problem Solved**:
- Tour was targeting single-entry mode (being deprecated)
- Batch upload is the PRIMARY submission method
- Mode-switching logic added complexity (~80 lines of tour-specific code)

**Implementation**:
- Added data-tour attributes to BatchSubmissionForm component
- Updated submit.tour.ts to target batch workflow steps
- Updated tour translations to reflect AI extraction workflow
- Removed submit-steps mode switching from TourProvider (simplified architecture)

**Architecture Benefits**:
- Removed ~80 lines of tour-specific code from TourProvider
- Aligns tour with primary user workflow (batch > single-entry)
- More universal tour system (one less special case)

**Files Modified**:
- `src/components/forms/BatchSubmissionForm.tsx` - Added 7 data-tour attributes
- `src/lib/tours/definitions/submit.tour.ts` - Updated to batch workflow
- `src/locales/en/tours.json` - Updated translations
- `src/components/tours/TourProvider.tsx` - Removed mode switching logic

### Known Considerations

**Batch Upload Priority**:
- Batch upload is the PRIMARY submission method (AI extraction from screenshots)
- Single-entry method is legacy and may be deprecated
- All tour content prioritizes batch workflow

---

## Conclusion

This PRD provides a comprehensive, research-backed blueprint for rebuilding StepLeague's tour system. The implementation agent should:

1. **Read this entire PRD twice** before starting
2. **Research all linked sources** for best practices
3. **Follow the implementation plan step-by-step** (Phases 1-5)
4. **Test thoroughly** (manual + automated)
5. **Validate all success criteria** before each phase
6. **Document all decisions** in code comments

**CRITICAL REMINDERS:**
- ✅ Menu blocking is a **SOLVED problem** (disableOverlay + spotlightClicks)
- ✅ Mobile character limits are **MANDATORY** (60 header, 130 body, 3 lines)
- ✅ i18n is **NOT optional** - all content must use translation keys
- ✅ PostHog A/B testing is **REQUIRED** - set up experiments from day 1
- ✅ Performance is **NON-NEGOTIABLE** - INP must be <150ms
- ✅ Accessibility is **REQUIRED** - WCAG 2.1 AA compliance

**Questions?**
- Read the research sources
- Check the implementation plan
- Review the code examples
- Test your implementation

Good luck! 🚀
