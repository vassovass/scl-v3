# PostHog vs Hotjar: Session Recording Comparison for StepLeague

> **Date**: 2026-01-10  
> **Status**: Reference Document  
> **Category**: Research / Analytics Strategy  
> **Context**: StepLeague uses GTM + GA4 infrastructure

---

## Executive Summary

| Criteria | PostHog | Hotjar | Winner for StepLeague |
|----------|---------|--------|----------------------|
| **Ease of Use** | ⭐⭐⭐ Developer-focused | ⭐⭐⭐⭐⭐ Marketer-friendly | 🏆 Hotjar |
| **GTM/GA4 Integration** | ⭐⭐⭐⭐⭐ Native support | ⭐⭐⭐ Partial (GA via GTM limitation) | 🏆 PostHog |
| **Free Tier Generosity** | ⭐⭐⭐⭐⭐ 5K recordings/mo | ⭐⭐⭐⭐⭐ 5K-10K recordings/mo | Tie |
| **Pricing Scalability** | ⭐⭐⭐⭐⭐ Usage-based, transparent | ⭐⭐⭐ Can get expensive | 🏆 PostHog |
| **Robustness (Features)** | ⭐⭐⭐⭐⭐ All-in-one product suite | ⭐⭐⭐⭐ UX-focused only | 🏆 PostHog |
| **Heatmaps Quality** | ⭐⭐⭐⭐ Good with rage-clicks | ⭐⭐⭐⭐⭐ Industry standard | 🏆 Hotjar |
| **Survey Capabilities** | ⭐⭐⭐⭐ 1,500 free responses/mo | ⭐⭐⭐ 20 responses/mo free | 🏆 PostHog |
| **A/B Testing** | ⭐⭐⭐⭐⭐ Built-in | ❌ Not available | 🏆 PostHog |
| **Data Privacy/Control** | ⭐⭐⭐⭐⭐ Self-host option | ⭐⭐⭐ SaaS only | 🏆 PostHog |
| **Mobile App Support** | ⭐⭐⭐⭐ Native SDKs | ⭐⭐ Limited | 🏆 PostHog |

> [!IMPORTANT]
> **Bottom Line for StepLeague**: Given your existing GTM + GA4 setup, and the need to record **all sessions** during pre-alpha/alpha (low traffic) and **most sessions** during Product Hunt (spike traffic), **PostHog is the recommended choice**. Its all-in-one nature aligns with your existing analytics architecture and provides better long-term value.

---

## 1. Ease of Use

### Hotjar
- **Learning Curve**: Very low - designed for marketers, PMs, and UX designers
- **Setup Time**: ~5 minutes (add script or GTM tag)
- **Dashboard**: Clean, visual, intuitive
- **Target User**: Non-technical team members

### PostHog
- **Learning Curve**: Moderate - developer-oriented interface
- **Setup Time**: ~10-15 minutes (more configuration options)
- **Dashboard**: Feature-rich but can feel overwhelming initially
- **Target User**: Developers, product-led growth teams

> [!TIP]
> **For StepLeague**: As a solo developer, PostHog's technical approach may actually be more efficient since you're already comfortable with code-based configurations.

---

## 2. Application & Use Cases

### Your Specific Requirements

| Stage | Traffic Estimate | Recording Need | Recommendation |
|-------|-----------------|----------------|----------------|
| **Pre-Alpha** | 10-50 sessions/day | 100% of sessions | Both work perfectly ✅ |
| **Alpha** | 50-200 sessions/day | 100% of sessions | Both work perfectly ✅ |
| **Product Hunt Spike** | 1,000-10,000 sessions/day | Most sessions | PostHog more cost-effective |

### Use Case Comparison

| Use Case | PostHog | Hotjar |
|----------|---------|--------|
| **Find UX friction points** | ✅ Session replays + rage-click heatmaps | ✅ Session replays + click maps |
| **Understand conversion drop-off** | ✅ Funnels + linked replays | ✅ Funnels + recordings |
| **Collect user feedback** | ✅ 1,500 survey responses free | ⚠️ Only 20 responses free |
| **Run A/B tests** | ✅ Built-in experimentation | ❌ Requires separate tool |
| **Feature flag rollouts** | ✅ 1M requests/mo free | ❌ Not available |
| **Track product analytics** | ✅ Full event tracking | ⚠️ Limited (pair with GA4) |

---

## 3. GTM & GA4 Integration

### PostHog
```
✅ Full GTM support via Custom HTML tag
✅ All features work (replays, surveys, flags)
✅ Can run alongside GA4 seamlessly
✅ Direct event forwarding to/from GA4 via Zapier/RudderStack
```

### Hotjar
```
✅ Easy GTM installation
⚠️ CRITICAL LIMITATION: Hotjar's deep GA integration 
   (filtering recordings by GA events) does NOT work 
   when GA is installed via GTM
✅ Basic installation works fine via GTM
```

> [!WARNING]
> **GTM Limitation for Hotjar**: If you want to filter Hotjar recordings based on GA4 events (e.g., "show me recordings of users who added items to cart"), this specific feature requires GA to be installed directly on the page, not via GTM. Since StepLeague already uses GTM for GA4, this limits Hotjar's cross-tool analysis capabilities.

### StepLeague's Current Architecture
```
GTM (Google Tag Manager)
├── GA4 (analytics + marketing attribution)
├── [Future] Session Recording Tool
└── [Future] Additional tracking
```

**Verdict**: PostHog integrates more seamlessly with this GTM-first approach.

---

## 4. Pricing Comparison

### Free Tier Comparison

| Feature | PostHog Free | Hotjar Free |
|---------|-------------|-------------|
| **Session Recordings** | 5,000/month | 5,000-10,000/month |
| **Heatmaps** | Unlimited | Unlimited |
| **Surveys** | 1,500 responses/mo | 20 responses/mo |
| **Data Retention** | 3 months (recordings) | 1 month |
| **Users/Team** | Unlimited | Limited |
| **A/B Tests** | ✅ Included | ❌ N/A |
| **Feature Flags** | 1M requests/mo | ❌ N/A |
| **Product Analytics** | 1M events/mo | ❌ N/A |

### Scaling Cost Scenarios

#### Scenario 1: Alpha Stage (200 daily sessions = ~6,000/mo)
| Tool | Monthly Cost |
|------|-------------|
| PostHog | **$0-5** (just over free tier) |
| Hotjar | **$0** (within free tier) |

#### Scenario 2: Product Hunt Spike (5,000 daily for 3 days = 15,000 sessions)
| Tool | Monthly Cost |
|------|-------------|
| PostHog | **~$50-75** (usage-based, ~$0.005/recording) |
| Hotjar | **$99-213/mo** (must upgrade to Business/Scale) |

#### Scenario 3: Post-Launch Steady State (500 daily = 15,000/mo)
| Tool | Monthly Cost |
|------|-------------|
| PostHog | **~$50/mo** (pay-per-use) |
| Hotjar | **$99-159/mo** (tiered plan) |

> [!NOTE]
> **Cost Control**: PostHog lets you set a **$0 hard cap** on each product to prevent surprise bills. When you hit the limit, recording stops rather than billing you.

---

## 5. Robustness & Feature Depth

### PostHog: All-in-One Platform
```
✅ Session Replay        ✅ Product Analytics
✅ Heatmaps              ✅ Feature Flags  
✅ A/B Testing           ✅ Surveys
✅ User Identification   ✅ Data Warehouse (HogQL)
✅ Error Tracking (2025) ✅ Funnels & Paths
✅ Cohort Analysis       ✅ Annotations
```

### Hotjar: UX-Focused Suite
```
✅ Session Recordings    ✅ Heatmaps
✅ Surveys & Polls       ✅ Feedback Widgets
✅ User Interviews       ✅ Basic Funnels (paid)
❌ No Feature Flags      ❌ No A/B Testing
❌ No Product Analytics  ❌ No Error Tracking
```

### Unique Features

| PostHog Exclusive | Hotjar Exclusive |
|-------------------|------------------|
| Self-hosting option | "Engage" user interview scheduling |
| SQL querying (HogQL) | Contentsquare AI integration |
| Open-source | Simpler onboarding |
| Feature flag experiments | Attention heatmaps |

---

## 6. Additional Comparison Criteria

### 6.1 Session Recording Quality & Features

| Feature | PostHog | Hotjar |
|---------|---------|--------|
| **Rage-click detection** | ✅ Yes | ✅ Yes (frustration signals) |
| **Dead-click detection** | ✅ Yes | ✅ Yes |
| **Console log capture** | ✅ Yes | ⚠️ Limited |
| **Network request logging** | ✅ Yes | ❌ No |
| **Filter by user properties** | ✅ Advanced | ✅ Good |
| **Jump to specific events** | ✅ Yes | ✅ Yes |
| **Mobile web support** | ✅ Excellent | ✅ Good |

### 6.2 Privacy & Compliance

| Aspect | PostHog | Hotjar |
|--------|---------|--------|
| **GDPR Compliance** | ✅ Yes | ✅ Yes |
| **Self-hosting option** | ✅ Full control | ❌ SaaS only |
| **Data location choice** | ✅ US or EU | ✅ EU available |
| **Auto-masking sensitive data** | ✅ Configurable | ✅ Automatic |
| **SOC 2 Type II** | ✅ Certified | ✅ Certified |

### 6.3 Developer Experience

| Aspect | PostHog | Hotjar |
|--------|---------|--------|
| **API access** | ✅ Full REST + GraphQL | ⚠️ Limited |
| **Custom events** | ✅ Unlimited | ✅ Events API (paid) |
| **React/Next.js SDK** | ✅ Native | ⚠️ Script only |
| **Documentation quality** | ✅ Excellent | ✅ Good |
| **Open source** | ✅ MIT License | ❌ Proprietary |

### 6.4 Reporting & Sharing

| Feature | PostHog | Hotjar |
|---------|---------|--------|
| **Share recording links** | ✅ Yes | ✅ Yes |
| **Export recordings** | ✅ Yes | ⚠️ Limited |
| **Custom dashboards** | ✅ Yes | ⚠️ Basic |
| **Scheduled reports** | ✅ Yes | ⚠️ Paid only |
| **Slack integration** | ✅ Yes | ✅ Yes |

### 6.5 Support & Community

| Aspect | PostHog | Hotjar |
|--------|---------|--------|
| **Free tier support** | Community + Docs | Community + Docs |
| **Response time (paid)** | 1-2 day SLA | 24-48 hour |
| **Community size** | Growing (GitHub) | Large (established) |
| **Learning resources** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 7. A/B Testing & Experimentation

> [!IMPORTANT]
> **This is a major differentiator.** PostHog has built-in A/B testing; Hotjar does NOT offer any experimentation features.

### PostHog A/B Testing

```
✅ Built-in A/B testing (same platform as analytics)
✅ Multi-variant experiments (A/B/C/D...)
✅ Statistical significance calculation
✅ Goal metrics tied to any event
✅ 1M feature flag requests/month FREE
✅ Integration with session replays (watch variant experiences)
```

### How It Works in PostHog
```typescript
// In your Next.js component
import { useFeatureFlagVariantKey } from 'posthog-js/react';

function OnboardingFlow() {
  const variant = useFeatureFlagVariantKey('new-onboarding-experiment');
  
  if (variant === 'control') {
    return <OriginalOnboarding />;
  } else if (variant === 'simplified') {
    return <SimplifiedOnboarding />;  // Test hypothesis
  }
}
```

### Hotjar A/B Testing
```
❌ No A/B testing capability
❌ No feature flags
❌ No experimentation features
→ Would need to add GrowthBook, LaunchDarkly, or Statsig separately
```

### Early-Stage A/B Testing Reality Check

| Traffic Level | A/B Testing Viability | Better Alternative |
|--------------|----------------------|-------------------|
| 10-50 sessions/day | ❌ Statistically impossible | User interviews, surveys |
| 50-200 sessions/day | ⚠️ Only for BIG changes | Fake door tests, phased rollouts |
| 200-500 sessions/day | ✅ Possible for major flows | Test critical user journeys |
| 500+ sessions/day | ✅ Effective | Full experimentation program |

> [!TIP]
> **For StepLeague Pre-Alpha/Alpha**: You won't have enough traffic for statistically significant A/B tests on small changes. But feature flags are STILL valuable for:
> - **Safe rollouts** of new features
> - **Kill switches** to disable buggy features instantly
> - **User segmentation** (show feature to alpha testers only)
> - **"Fake door" tests** to gauge interest before building

---

## 8. Feature Flags for Safe Rollouts

### Why Feature Flags Matter for Early-Stage Apps

| Use Case | How It Helps StepLeague |
|----------|------------------------|
| **Progressive rollout** | Release to 10% of users → watch for bugs → expand |
| **Alpha tester access** | Show new features only to specific user IDs |
| **Kill switch** | Disable broken feature instantly without redeployment |
| **Environment flags** | Enable debug mode only in development |
| **Beta features** | Let users opt-in to experimental features |

### PostHog Feature Flags

```typescript
// Check flag on client or server
const showNewLeagueHub = posthog.isFeatureEnabled('new-league-hub');

// Or with server-side (Next.js API route)
import { PostHog } from 'posthog-node';
const client = new PostHog(process.env.POSTHOG_API_KEY);

const flags = await client.getAllFlags('user-123');
if (flags['new-league-hub']) {
  // Show new experience
}
```

**PostHog Feature Flag Features:**
- ✅ 1M requests/month FREE
- ✅ Percentage rollouts (1% → 10% → 100%)
- ✅ User targeting (by ID, properties, cohorts)
- ✅ Sticky flags (users stay in same variant)
- ✅ Local evaluation (fast, no API calls)
- ✅ Multivariate flags
- ✅ Kill switch capability

### Hotjar Feature Flags
```
❌ Not available
→ Would need LaunchDarkly ($10/mo+), Flagsmith (free tier), 
   or manual implementation
```

### StepLeague Feature Flag Use Cases

Based on your PRD roadmap, here are immediate uses:

| PRD | Feature Flag Use Case |
|-----|----------------------|
| **PRD 27: League Hub** | `new-league-hub` - Progressive rollout |
| **PRD 28: Smart Engagement** | `streak-warnings` - Test notification timing |
| **PRD 31: Social Encouragement** | `high-five-feature` - Gauge engagement |
| **PRD 33: Pricing** | `show-pricing-page` - A/B test price points |

---

## 9. Early-Stage Development: What Actually Matters

### Product-Market Fit Analytics Pyramid

```
                    ▲
                   /A\   A/B Testing (500+ sessions/day)
                  /   \
                 /  B  \   Funnels & Cohorts (200+ sessions/day)
                /       \
               /    C    \   Session Recordings (ANY traffic)
              /           \
             /      D      \   Basic Analytics (GA4, events)
            /               \
           /        E        \   User Feedback (surveys, interviews)
          ───────────────────────
          
          Start from the bottom, build up as traffic grows
```

### What You Need at Each Stage

#### Pre-Alpha (10-50 sessions/day)
| Priority | Tool | Why |
|----------|------|-----|
| 🥇 **HIGH** | Session Recordings | See EVERY user interaction |
| 🥇 **HIGH** | User Surveys | Direct feedback from alpha testers |
| 🥈 **MEDIUM** | Feature Flags | Safe rollouts, kill switches |
| 🥉 **LOW** | A/B Testing | Not enough traffic |

**PostHog covers all HIGH priorities in one tool.**

#### Alpha (50-200 sessions/day)
| Priority | Tool | Why |
|----------|------|-----|
| 🥇 **HIGH** | Session Recordings | Find friction points |
| 🥇 **HIGH** | Funnel Analysis | Where do users drop off? |
| 🥇 **HIGH** | Feature Flags | Test new features safely |
| 🥈 **MEDIUM** | Cohort Retention | Are users coming back? |
| 🥉 **LOW** | A/B Testing | Only for BIG changes |

**PostHog provides all of these; Hotjar only covers recordings.**

#### Product Hunt Launch (1000+ sessions/day)
| Priority | Tool | Why |
|----------|------|-----|
| 🥇 **HIGH** | Session Recordings | Identify onboarding issues |
| 🥇 **HIGH** | Funnel Analysis | Optimize signup → first action |
| 🥇 **HIGH** | A/B Testing | Test variations rapidly |
| 🥇 **HIGH** | Real-time Analytics | Monitor launch health |
| 🥈 **MEDIUM** | Surveys | NPS, feature requests |

**PostHog handles the spike traffic with usage-based pricing.**

### Early-Stage Best Practices

> [!TIP]
> **"Pellets over Cannonballs"** - PostHog's philosophy for startups:
> - Run many small, quick tests
> - Learn fast, ship fast
> - Don't wait for perfect statistical significance on small improvements
> - Focus on BIG, bold changes that can move metrics 20%+

#### What to Test (with low traffic)
| Test Type | Statistical Need | Worth It at Alpha? |
|-----------|-----------------|-------------------|
| Button color change | High (tiny effect) | ❌ No |
| Completely different onboarding | Low (big effect) | ✅ Yes |
| New pricing page layout | Medium | ⚠️ Maybe |
| Remove entire step from flow | Low (big effect) | ✅ Yes |
| Change headline copy | Medium | ⚠️ With 200+ sessions |

#### Alternative to A/B Testing (Low Traffic)

| Method | How It Works | Tools Needed |
|--------|-------------|--------------|
| **Fake Door Test** | Add button for feature, track clicks | PostHog events + flag |
| **Phased Rollout** | 10% → 25% → 50% → 100% | PostHog feature flags |
| **User Interviews** | Talk to 5-10 users directly | Calendly + Zoom |
| **Session Replay Analysis** | Watch 20 recordings, spot patterns | PostHog/Hotjar |
| **Survey** | "Would you use X feature?" | PostHog surveys |

---

## 10. Full Feature Comparison Matrix

| Feature | PostHog | Hotjar | Need for StepLeague |
|---------|---------|--------|-------------------|
| **Session Recordings** | ✅ 5K free/mo | ✅ 5-10K free/mo | 🔴 Critical |
| **Heatmaps** | ✅ Unlimited | ✅ Unlimited | 🟡 Useful |
| **Surveys** | ✅ 1,500 free | ⚠️ 20 free | 🔴 Critical for PMF |
| **Product Analytics** | ✅ 1M events | ❌ None | 🔴 Critical |
| **Funnel Analysis** | ✅ Included | ⚠️ Paid only | 🔴 Critical |
| **Cohort Retention** | ✅ Included | ❌ None | 🟡 Important |
| **A/B Testing** | ✅ Built-in | ❌ None | 🟡 Important (later) |
| **Feature Flags** | ✅ 1M free | ❌ None | 🔴 Critical for Alpha |
| **User Identification** | ✅ Full profiles | ⚠️ Basic | 🟡 Important |
| **Data Export** | ✅ Full access | ⚠️ Limited | 🟡 Nice to have |
| **Self-hosting** | ✅ Option | ❌ None | 🟢 Future consideration |

### Tool Stack Comparison

**With PostHog Only:**
```
PostHog
├── Session Recordings ✅
├── Product Analytics ✅
├── A/B Testing ✅
├── Feature Flags ✅
├── Surveys ✅
└── Heatmaps ✅

+ GA4 (marketing attribution) ← Already have
= COMPLETE STACK
```

**With Hotjar:**
```
Hotjar
├── Session Recordings ✅
├── Heatmaps ✅
└── Surveys (limited) ⚠️

+ GA4 (marketing) ← Already have
+ GrowthBook/LaunchDarkly (A/B + flags) ← Need to add
+ Mixpanel/Amplitude (product analytics) ← Need to add
= 3-4 TOOLS TO MANAGE
```

> [!IMPORTANT]
> **One Tool vs Many**: For a solo developer, managing one integrated tool (PostHog) is significantly easier than managing 3-4 separate tools with different dashboards, billing, and data models.

---

## 11. StepLeague-Specific Recommendation

### Your Context
- **Stage**: Pre-Alpha → Alpha → Product Hunt
- **Existing Stack**: GTM + GA4 (already implemented per PRD 14)
- **Team**: Solo developer (you)
- **Goal**: Record ALL sessions in early stages, MOST in Product Hunt

### Phased Approach

```
PRE-ALPHA / ALPHA (Now)          PRODUCT HUNT               POST-LAUNCH
─────────────────────────────────────────────────────────────────────────
PostHog Free Tier                Scale up briefly           Evaluate needs
- 5,000 recordings/mo            - Pay for extra            - Stay on PostHog OR
- 1M analytics events            - ~$50-100 for spike       - Add Hotjar for UX
- Feature flags for rollout                                   research if needed
```

### Why PostHog for StepLeague

1. **GTM Compatibility**: Works perfectly with your existing GTM setup
2. **All-in-One**: Replaces need for separate survey, feature flag, and A/B testing tools
3. **Cost Predictability**: Set billing caps to prevent surprises during traffic spikes
4. **Developer-Friendly**: Better fit for solo developer workflow
5. **Future-Proof**: Feature flags will be valuable for Alpha feature rollouts
6. **Generous Free Tier**: Survey limit alone (1,500 vs 20) is significant for user research

### Implementation Plan

```typescript
// Already in your codebase via GTM - add PostHog tag
// In GTM: Custom HTML tag with PostHog snippet
<script>
  !function(t,e){...}("posthog",window);
  posthog.init('your-project-key', {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    // Enable session recording
    session_recording: {
      recordCanvas: true
    }
  });
</script>
```

> [!TIP]
> **Quick Start**: Create a PostHog account, add the GTM tag, and you'll immediately start capturing sessions. The free tier covers your entire pre-alpha and alpha phases.

---

## 12. Summary Decision Matrix

| Your Priority | Choose PostHog If | Choose Hotjar If |
|--------------|-------------------|------------------|
| **Record all sessions cheaply** | ✅ Usage-based pricing | ⚠️ Plan limits may hit |
| **GTM + GA4 integration** | ✅ Full support | ⚠️ GA via GTM limitation |
| **Future A/B testing** | ✅ Built-in | ❌ Need separate tool |
| **Non-technical teammate** | ⚠️ Steeper learning curve | ✅ Easier for non-devs |
| **User interviews** | ❌ Not included | ✅ Engage feature |
| **Self-hosting later** | ✅ Full option | ❌ Not available |

### Final Verdict

**For StepLeague: PostHog is the recommended choice.**

The combination of:
- Seamless GTM integration
- Generous free tier for session recordings
- Built-in feature flags (useful for alpha rollouts)
- Usage-based pricing for Product Hunt traffic spike
- Survey capabilities for user research

...makes PostHog the better long-term investment. You can always add Hotjar later specifically for UX research with non-technical stakeholders if needed.

---

## 13. Implementation Guide: PostHog + Your Existing GTM Setup

> [!IMPORTANT]
> **Your Current GTM Configuration** (Container: GTM-MB2BNBH2)
> - GA4 Configuration: G-FREXL0RBLB
> - Events already tracked: `login`, `sign_up`, `logout`, `league_created`, `league_joined`, `steps_submitted`, `share`
> - DataLayer variables: `user_id`, `method`, `league_id`, `step_count`, `content_type`, `item_id`

### Step 1: Create PostHog Account

1. Go to [app.posthog.com](https://app.posthog.com)
2. Sign up with Google/GitHub (free)
3. Create a new project: "StepLeague"
4. Copy your **Project API Key** (looks like: `phc_xxxxxxxxxxxxx`)
5. Note your **API Host**: `https://app.posthog.com` (or EU: `https://eu.posthog.com`)

### Step 2: Add PostHog Tag to GTM

**In Google Tag Manager:**

1. **Tags** → **New** → **Custom HTML**
2. Name: `PostHog - Init`
3. Paste this code:

```html
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  
  posthog.init('YOUR_PROJECT_API_KEY', {
    api_host: 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    // Session Recording config
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true  // Only mask password fields
      }
    },
    // Capture dataLayer events automatically
    bootstrap: {
      distinctID: window.dataLayer?.find(e => e.user_id)?.user_id || undefined
    }
  });
</script>
```

4. **Trigger**: Select `All Pages`
5. **Tag firing priority**: Set to `100` (fires before other tags)
6. **Save** and **Submit**

### Step 3: Forward Your Existing Events to PostHog

Your existing dataLayer events will work with PostHog! Here's how to capture them:

**Option A: Automatic (Recommended)**
PostHog's autocapture will grab clicks and pageviews. For your custom events, add a single "catch-all" tag:

**New Tag: `PostHog - Forward DataLayer Events`**
```html
<script>
  // Forward GTM dataLayer events to PostHog
  (function() {
    var eventName = {{Event}};
    
    // List of events to forward
    var eventsToForward = [
      'login', 'sign_up', 'logout', 
      'league_created', 'league_joined', 
      'steps_submitted', 'share'
    ];
    
    if (eventsToForward.includes(eventName) && window.posthog) {
      // Build properties object from dataLayer
      var props = {
        user_id: {{DLV - user_id}} || undefined,
        method: {{DLV - method}} || undefined,
        league_id: {{DLV - league_id}} || undefined,
        step_count: {{DLV - step_count}} || undefined,
        content_type: {{DLV - content_type}} || undefined,
        item_id: {{DLV - item_id}} || undefined
      };
      
      // Remove undefined properties
      Object.keys(props).forEach(key => 
        props[key] === undefined && delete props[key]
      );
      
      // Send to PostHog
      posthog.capture(eventName, props);
    }
  })();
</script>
```

**Trigger**: Create trigger `Custom Event - All StepLeague Events`:
- Trigger Type: Custom Event
- Event name: `login|sign_up|logout|league_created|league_joined|steps_submitted|share`
- Use regex matching: ✅

### Step 4: Identify Users

When a user logs in, identify them in PostHog so recordings are linked to the user:

**Update your existing login handling** (in your auth callback or login success handler):

```typescript
// src/lib/analytics.ts - Add PostHog identification
export function identifyUserForAnalytics(user: { id: string; email?: string; display_name?: string }) {
  // Push to dataLayer for GA4 (existing)
  window.dataLayer?.push({
    event: 'login',
    user_id: user.id,
    method: 'google' // or 'email'
  });
  
  // Identify in PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.identify(user.id, {
      email: user.email,
      name: user.display_name
    });
  }
}
```

Or via GTM (preferred for consistency):

**New Tag: `PostHog - Identify User`**
```html
<script>
  if (window.posthog && {{DLV - user_id}}) {
    posthog.identify({{DLV - user_id}});
  }
</script>
```
**Trigger**: `Event - Login` and `Event - Sign Up`

### Step 5: Enable Feature Flags

Feature flags work automatically once PostHog is initialized. Use them in your code:

```typescript
// src/components/FeatureFlagGate.tsx
'use client';
import { useFeatureFlagEnabled } from 'posthog-js/react';

export function FeatureFlagGate({ 
  flag, 
  children, 
  fallback = null 
}: { 
  flag: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlagEnabled(flag);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Usage:
<FeatureFlagGate flag="new-league-hub">
  <NewLeagueHub />
</FeatureFlagGate>
```

### Complete GTM Container Overview (After Implementation)

```
GTM Container: GTM-MB2BNBH2
├── Tags
│   ├── GA4 Configuration (existing) ✅
│   ├── GA4 - Login Event (existing) ✅
│   ├── GA4 - Sign Up (existing) ✅
│   ├── GA4 - Logout (existing) ✅
│   ├── GA4 - League Created (existing) ✅
│   ├── GA4 - League Joined (existing) ✅
│   ├── GA4 - Steps Submitted (existing) ✅
│   ├── GA4 - Share (existing) ✅
│   ├── PostHog - Init (NEW) ⭐
│   ├── PostHog - Forward DataLayer Events (NEW) ⭐
│   └── PostHog - Identify User (NEW) ⭐
│
├── Triggers (existing - reuse for PostHog)
│   ├── All Pages
│   ├── Event - Login
│   ├── Event - Sign Up
│   ├── Event - Logout
│   ├── Event - League Created
│   ├── Event - League Joined
│   ├── Event - Steps Submitted
│   └── Event - Share
│
└── Variables (existing - reuse for PostHog)
    ├── GA4 Measurement ID
    ├── DLV - user_id
    ├── DLV - method
    ├── DLV - league_id
    ├── DLV - step_count
    ├── DLV - content_type
    └── DLV - item_id
```

---

## 14. Event Tracking: GA4 vs PostHog Comparison

### Your Current Events

| Event | GA4 Tag | PostHog Capture | Parameters |
|-------|---------|-----------------|------------|
| `login` | ✅ GA4 - Login Event | ✅ Auto-forwarded | `user_id`, `method` |
| `sign_up` | ✅ GA4 - Sign Up | ✅ Auto-forwarded | `user_id`, `method` |
| `logout` | ✅ GA4 - Logout | ✅ Auto-forwarded | `user_id` |
| `league_created` | ✅ GA4 - League Created | ✅ Auto-forwarded | `league_id`, `user_id` |
| `league_joined` | ✅ GA4 - League Joined | ✅ Auto-forwarded | `league_id`, `user_id` |
| `steps_submitted` | ✅ GA4 - Steps Submitted | ✅ Auto-forwarded | `league_id`, `step_count`, `user_id` |
| `share` | ✅ GA4 - Share | ✅ Auto-forwarded | `content_type`, `item_id`, `method` |

### PostHog Autocapture (FREE extras)

PostHog automatically captures these WITHOUT any configuration:

| Event | Description | Your Use Case |
|-------|-------------|---------------|
| `$pageview` | Page views | Track user flow |
| `$pageleave` | Page exits | Find drop-off points |
| `$autocapture` | All clicks, inputs | Heatmap data |
| `$rageclick` | Frustrated clicking | Find UX issues |
| `$dead_click` | Clicks with no effect | Find broken elements |
| `$session_start` | Session begins | Session analytics |

### What PostHog Adds Beyond GA4

| Insight | GA4 | PostHog |
|---------|-----|---------|
| "What happened?" | ✅ Events + funnels | ✅ Events + funnels |
| "Who did it?" | ⚠️ Anonymous cohorts | ✅ Individual user profiles |
| "Watch user do it" | ❌ No session replay | ✅ Full session recordings |
| "Why did they struggle?" | ❌ No context | ✅ Recordings + console logs |
| "Which variant works?" | ❌ No A/B testing | ✅ Built-in experiments |

---

## 15. Verification Checklist

After implementation, verify everything works:

### GTM Debug Mode
1. Open GTM → **Preview** mode
2. Visit your site with GTM debug panel
3. Verify these tags fire:
   - [ ] `PostHog - Init` on every page
   - [ ] `PostHog - Forward DataLayer Events` on each event
   - [ ] `PostHog - Identify User` on login/signup

### PostHog Dashboard
1. Go to [app.posthog.com](https://app.posthog.com)
2. Check **Live Events** - you should see:
   - [ ] `$pageview` events flowing
   - [ ] Your custom events (`login`, `league_created`, etc.)
3. Check **Session Recordings**:
   - [ ] Recordings appearing within 1-2 minutes
   - [ ] Can filter by user properties
4. Check **Your Profile**:
   - [ ] Your user appears with email/name
   - [ ] Events are linked to your profile

### Test Session Recording
1. Browse your site for 30 seconds
2. Click various elements
3. In PostHog, go to **Session Recordings**
4. Find your session and verify:
   - [ ] Video plays correctly
   - [ ] Clicks are highlighted
   - [ ] Console logs visible (if enabled)

---

## Appendix A: Quick Reference

### PostHog Pricing Summary (2025)
- Session Replay: $0.005/recording after 5K free
- Product Analytics: $0.00005/event after 1M free
- Feature Flags: $0.0001/request after 1M free
- Surveys: $0.20/response after 1,500 free

### Hotjar Pricing Summary (2025)
- Free: 5K-10K recordings, 35 daily sessions
- Plus: $39-59/mo (100 daily sessions)
- Business: $99-159/mo (500+ daily sessions)
- Scale: $159-213/mo (funnels, SSO, etc.)

---

## Appendix B: TypeScript Type Declarations

Add to your project for type safety:

```typescript
// src/types/posthog.d.ts
declare global {
  interface Window {
    posthog?: {
      init: (apiKey: string, config?: any) => void;
      capture: (event: string, properties?: Record<string, any>) => void;
      identify: (distinctId: string, properties?: Record<string, any>) => void;
      reset: () => void;
      isFeatureEnabled: (key: string) => boolean;
      getFeatureFlag: (key: string) => boolean | string | undefined;
      onFeatureFlags: (callback: (flags: string[]) => void) => void;
      setPersonProperties: (properties: Record<string, any>) => void;
      group: (type: string, key: string, properties?: Record<string, any>) => void;
    };
    dataLayer?: Array<any>;
  }
}

export {};
```

---

## Appendix C: PostHog React Provider Setup (Optional)

For deeper React integration, add the PostHog provider:

```typescript
// src/components/providers/PostHogProvider.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skip if already initialized via GTM
    if (typeof window !== 'undefined' && !window.posthog?.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
        person_profiles: 'identified_only',
        capture_pageview: false, // Let GTM handle this
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

> [!NOTE]
> **GTM vs React SDK**: You can use EITHER GTM (shown above) OR the React SDK. GTM is recommended for StepLeague since you already have a GTM foundation. The React SDK is useful if you want tighter code integration with feature flags.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-10 | 13-15 | Added comprehensive GTM implementation guide with existing event integration |
| 2026-01-10 | 7-10 | Added A/B testing, feature flags, early-stage development, and full feature matrix sections |
| 2026-01-10 | Initial | Created comprehensive comparison for session recording decision |

