# PRD 14: Google Analytics 4 & Tag Manager Setup

> **Order:** 14 of 20  
> **Previous:** [PRD 13: Saved Views](./PRD_13_Saved_Views.md)  
> **Next:** [PRD 15: Page Layout System](./PRD_15_Page_Layout_System.md)
>
> **Status:** 🔲 Not Started  
> **Priority:** High (Alpha Testing Requirement)  
> **Dependencies:** None  
> **Created:** December 2025  
> **Outcome:** Complete analytics infrastructure with consent management, event tracking, and conversion tracking for alpha testing

---

## Problem Statement

StepLeague needs proper analytics to understand user behavior during alpha testing. This requires:
1. **Google Tag Manager (GTM)** for tag management
2. **Google Analytics 4 (GA4)** for data collection and reporting
3. **Consent Mode v2** compliance (mandatory for EEA users since March 2024 - now over a year in effect)
4. **Structured event tracking** aligned with StepLeague's user journey

---

## Success Criteria

- [ ] GTM container installed and loading on all pages
- [ ] GA4 property receiving data correctly
- [ ] Consent banner displaying and functioning correctly
- [ ] All key events tracking accurately (verified in DebugView)
- [ ] Consent Mode v2 signals being sent to Google
- [ ] Data retention extended to 14 months
- [ ] Internal traffic filtered

---

## Part 1: Consent Management Platform (CMP)

### Recommendation: Open-Source (In Your Codebase)

For full control and GitHub sync, use an open-source library that lives in your repository.

#### ⭐ Top Pick: `orestbida/cookieconsent` (vanilla-cookieconsent)

**Why this is the best choice for StepLeague:**
- ✅ **Actively maintained** - 3.8k+ GitHub stars, regular updates
- ✅ **Lives in your codebase** - npm install, syncs with your repo
- ✅ **Google Consent Mode v2** - Native support
- ✅ **Lightweight** - ~12kb gzipped, no dependencies
- ✅ **GDPR/CCPA compliant** - Designed for European regulations
- ✅ **Customizable** - Full control over look and feel
- ✅ **Next.js compatible** - Many guides and examples available
- ✅ **Free forever** - MIT license

**GitHub:** https://github.com/orestbida/cookieconsent

#### Tech Stack Compatibility Verification

| StepLeague Stack | Compatibility | Notes |
|------------------|--------------|-------|
| **Next.js 14** (App Router) | ✅ Full | Works with `'use client'` components |
| **TypeScript (strict)** | ✅ Full | Has TypeScript definitions |
| **Tailwind CSS** | ✅ Full | CSS variables for easy theming |
| **Dark/Light Mode** | ✅ Full | CSS variables support theme switching |
| **Vercel Deployment** | ✅ Full | Static bundled, no external calls |
| **Future: Mobile App** (React Native/Flutter) | ⚠️ Separate | Web-only; mobile apps need native consent (covered by app stores) |

> **Mobile App Note:** When you build the mobile app (per ROADMAP.md), mobile platforms handle consent differently:
> - **iOS**: App Tracking Transparency (ATT) framework - required by Apple
> - **Android**: Google Play requires consent dialogs for analytics
> 
> This web consent library is for the web app only. Mobile will need platform-specific solutions.

#### Alternative Options (All Open-Source)

| Option | GitHub Stars | Pros | Cons |
|--------|-------------|------|------|
| **Open Cookie Consent** (openconsent.dev) | New | Built with shadcn/ui, Next.js native | Newer, less battle-tested |
| **react-consent-shield** | ~100 | React-specific, geo-detection | Smaller community |
| **jamestomasino/cookieconsent** | ~50 | Zero dependencies, simple | Minimal features |

#### Why NOT External Services (CookieYes, etc.)

| Concern | External Service | Open-Source in Repo |
|---------|-----------------|---------------------|
| GitHub sync | ❌ No | ✅ Yes |
| Maintenance control | ❌ Dependent on vendor | ✅ You control updates |
| Future-proof | ❌ Service may change/shut down | ✅ Always yours |
| Customization | Limited | ✅ Full control |
| Performance | External JS load | ✅ Bundled with app |
| Cost | May have limits | ✅ Free forever |

### CMP Setup Instructions (vanilla-cookieconsent)

#### Step 1: Install Package

```bash
npm install vanilla-cookieconsent
```

#### Step 2: Create CookieConsent Component

Create file: `src/components/analytics/CookieConsent.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';

export function CookieConsentBanner() {
  useEffect(() => {
    CookieConsent.run({
      guiOptions: {
        consentModal: {
          layout: 'box',
          position: 'bottom left',
          equalWeightButtons: true,
          flipButtons: false,
        },
        preferencesModal: {
          layout: 'box',
          position: 'right',
          equalWeightButtons: true,
          flipButtons: false,
        },
      },

      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
          readOnly: false,
          autoClear: {
            cookies: [
              { name: /^_ga/ },
              { name: '_gid' },
            ],
          },
        },
        marketing: {
          enabled: false,
          readOnly: false,
        },
      },

      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'We use cookies 🍪',
              description:
                'We use cookies to improve your experience and analyze site usage. You can customize your preferences below.',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              showPreferencesBtn: 'Manage preferences',
            },
            preferencesModal: {
              title: 'Cookie preferences',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              savePreferencesBtn: 'Save preferences',
              closeIconLabel: 'Close',
              sections: [
                {
                  title: 'Cookie usage',
                  description:
                    'We use cookies to ensure basic site functionality and to improve your experience.',
                },
                {
                  title: 'Strictly necessary cookies',
                  description:
                    'These cookies are essential for the website to function properly.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Analytics cookies',
                  description:
                    'These cookies help us understand how visitors interact with the site.',
                  linkedCategory: 'analytics',
                },
                {
                  title: 'Marketing cookies',
                  description:
                    'These cookies are used to show you relevant ads (not currently used).',
                  linkedCategory: 'marketing',
                },
              ],
            },
          },
        },
      },

      // Google Consent Mode v2 integration
      onFirstConsent: ({ cookie }) => {
        updateGoogleConsent(cookie.categories);
      },
      onConsent: ({ cookie }) => {
        updateGoogleConsent(cookie.categories);
      },
      onChange: ({ cookie }) => {
        updateGoogleConsent(cookie.categories);
      },
    });
  }, []);

  return null;
}

// Update Google Consent Mode based on user choices
function updateGoogleConsent(categories: string[]) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const hasAnalytics = categories.includes('analytics');
  const hasMarketing = categories.includes('marketing');

  window.gtag('consent', 'update', {
    analytics_storage: hasAnalytics ? 'granted' : 'denied',
    ad_storage: hasMarketing ? 'granted' : 'denied',
    ad_user_data: hasMarketing ? 'granted' : 'denied',
    ad_personalization: hasMarketing ? 'granted' : 'denied',
  });
}

// Add gtag type
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}
```

#### Step 3: Customize Styling (Optional)

Create file: `src/styles/cookie-consent.css` to override default styles with StepLeague branding:

```css
/* Override cookie consent colors to match StepLeague */
:root {
  --cc-bg: #1f2937; /* gray-800 */
  --cc-primary-color: #10b981; /* emerald-500 */
  --cc-secondary-color: #6b7280; /* gray-500 */
  --cc-text: #f9fafb; /* gray-50 */
}
```

#### Step 4: Add to Layout

```tsx
// In src/app/layout.tsx
import { CookieConsentBanner } from '@/components/analytics/CookieConsent';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
```

---

## Part 2: Google Tag Manager Setup

### Step 1: Create GTM Account & Container

1. Go to https://tagmanager.google.com/
2. Click **"Create Account"**
3. Fill in:
   - Account Name: `StepLeague`
   - Country: `Thailand` (or your billing country)
   - Container Name: `stepleague.app`
   - Target Platform: **Web**
4. Accept Terms of Service
5. **Copy the Container ID** (format: GTM-XXXXXXX)

### Step 2: Install GTM in Next.js

#### Option A: Using next/script (Recommended)

Create file: `src/components/analytics/GoogleTagManager.tsx`

```tsx
'use client';

import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GoogleTagManager() {
  if (!GTM_ID) return null;

  return (
    <>
      {/* GTM Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
    </>
  );
}

export function GoogleTagManagerNoscript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
```

#### Add to layout.tsx

```tsx
// In src/app/layout.tsx
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/analytics/GoogleTagManager';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GoogleTagManager />
      </head>
      <body>
        <GoogleTagManagerNoscript />
        {children}
      </body>
    </html>
  );
}
```

#### Add Environment Variable

```env
# .env.local
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Step 3: Configure GTM Tags

> **Note:** Since we're using `vanilla-cookieconsent` installed via npm (handled in code), we don't need a separate GTM tag for the consent banner. The consent component is bundled with the app.

#### 3.1: Add GA4 Configuration Tag

1. Go to **"Tags"** → **"New"**
2. Tag Configuration → **"Google Analytics: GA4 Configuration"**
3. Measurement ID: Your GA4 Measurement ID (format: G-XXXXXXX)
4. **Configuration Settings:**
   - Enable "Send a page view event when this configuration loads"
5. **Advanced Settings** → **Consent Settings:**
   - Add required consent: `analytics_storage`
6. Triggering → **"Initialization - All Pages"**
7. Name: `GA4 - Configuration`
8. Save

#### 3.2: Set Up Default Consent State

1. Go to **"Tags"** → **"New"**
2. Tag Configuration → **"Custom HTML"**
3. Paste:
```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  
  // Default consent state - deny all until user consents
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
  
  // For users outside EEA, grant by default (optional)
  // gtag('consent', 'default', {
  //   'analytics_storage': 'granted',
  //   'ad_storage': 'granted',
  //   'ad_user_data': 'granted',
  //   'ad_personalization': 'granted',
  //   'region': ['US', 'CA'] // Non-EEA regions
  // });
</script>
```
4. Triggering → **"Consent Initialization - All Pages"** (MUST fire before other tags)
5. Name: `Consent - Default State`
6. Save

---

## Part 3: Google Analytics 4 Setup

### Step 1: Create GA4 Property

1. Go to https://analytics.google.com/
2. Click **"Admin"** (gear icon bottom-left)
3. Click **"+ Create Property"**
4. Property Name: `StepLeague - Production`
5. Reporting Time Zone: Your timezone
6. Currency: USD or THB
7. Click **"Next"**
8. Business Details:
   - Industry: Health, Fitness & Wellness
   - Size: Small (1-10 employees)
9. Business Objectives: Select relevant ones
10. Click **"Create"**

### Step 2: Create Data Stream

1. Choose **"Web"**
2. Website URL: `stepleague.app`
3. Stream Name: `StepLeague Web`
4. **Enhanced Measurement:** Enable all options:
   - Page views ✅
   - Scrolls ✅
   - Outbound clicks ✅
   - Site search ✅ (if applicable)
   - Form interactions ✅
   - Video engagement ✅
   - File downloads ✅
5. Click **"Create Stream"**
6. **Copy Measurement ID** (G-XXXXXXX) - use this in GTM

### Step 3: Configure GA4 Settings

#### 3.1: Data Retention

1. Go to **Admin** → **Data Settings** → **Data Retention**
2. Change from 2 months to **14 months**
3. Toggle **"Reset user data on new activity"** ON
4. Click **"Save"**

#### 3.2: Internal Traffic Filter

1. Go to **Admin** → **Data Streams** → Select your stream
2. Click **"Configure tag settings"**
3. Click **"Define internal traffic"**
4. Click **"Create"**
5. Add your IP addresses (home, office)
6. Go to **Admin** → **Data Settings** → **Data Filters**
7. Find "Internal Traffic" filter → Set to **"Active"**

#### 3.3: Link Google Ads (Optional - for later)

1. Go to **Admin** → **Product Links** → **Google Ads Links**
2. Follow prompts to link (when ready for paid ads)

---

## Part 4: Event Tracking Strategy for StepLeague

### Conversion Tier Framework

#### Tier 1: Macro Conversions (Key Events - Mark in GA4)
These are primary business goals. **Mark as Key Events** in GA4.

| Event Name | Trigger | Parameters | Priority |
|------------|---------|------------|----------|
| `sign_up` | User completes registration | `method` (google/email) | 🔴 Critical |
| `league_created` | User creates a new league | `league_id`, `league_name` | 🔴 Critical |
| `league_joined` | User joins a league | `league_id`, `method` (invite/browse) | 🔴 Critical |
| `steps_submitted` | User submits steps | `step_count`, `league_id` | 🔴 Critical |

#### Tier 2: Micro Conversions (Key Events)
Important engagement signals. **Mark as Key Events** in GA4.

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `onboarding_completed` | User finishes onboarding | `steps_completed` |
| `first_steps_submitted` | User submits steps for first time ever | `step_count` |
| `invite_sent` | User sends league invite | `league_id`, `invite_method` |
| `goal_set` | User sets step goal | `goal_value`, `goal_type` |

#### Tier 3: Engagement Events (Standard Events)
Track but don't mark as key events. Used for funnel analysis.

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `login` | User logs in | `method` |
| `page_view` | Page load | Auto-tracked by GA4 |
| `scroll` | User scrolls | Auto-tracked |
| `click_cta` | CTA button clicked | `button_name`, `page` |
| `view_leaderboard` | Views leaderboard | `league_id` |
| `view_dashboard` | Views dashboard | - |
| `view_roadmap` | Views public roadmap | - |
| `feedback_submitted` | User submits feedback | `type` (bug/feature/other) |
| `share_achievement` | User shares achievement | `platform`, `achievement_type` |

#### Tier 4: Newsletter & Marketing (Future)

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `newsletter_signup` | Email newsletter signup | `source`, `campaign` |
| `newsletter_click` | Click from newsletter | `campaign`, `content` |

### Event Naming Rules

1. **Use snake_case:** `sign_up` not `signUp` or `SignUp`
2. **Use lowercase:** GA4 is case-sensitive
3. **Max 40 characters:** Keep names concise
4. **No reserved prefixes:** Avoid `ga_`, `firebase_`, `google_`
5. **Be descriptive:** `league_created` not `create` or `action1`
6. **Consistent verbs:** Use past tense (`submitted`, `created`, `joined`)

### Parameter Naming Rules

1. **Use snake_case:** `league_id` not `leagueId`
2. **Max 40 characters** for parameter names
3. **Reuse parameters:** Use `league_id` across all league events
4. **Register custom dimensions:** In GA4 Admin → Custom definitions

---

## Part 5: Implementation - Data Layer & Tracking Code

### Data Layer Initialization

Add to `GoogleTagManager.tsx` or a separate file:

```tsx
// src/lib/analytics.ts
'use client';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Ensure dataLayer exists
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// Push event to dataLayer
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) {
  if (typeof window === 'undefined') return;
  
  window.dataLayer.push({
    event: eventName,
    ...parameters,
  });
}

// Specific tracking functions for StepLeague
export const analytics = {
  // Tier 1: Macro Conversions
  signUp: (method: 'google' | 'email') => {
    trackEvent('sign_up', { method });
  },
  
  leagueCreated: (leagueId: string, leagueName: string) => {
    trackEvent('league_created', { league_id: leagueId, league_name: leagueName });
  },
  
  leagueJoined: (leagueId: string, method: 'invite' | 'browse') => {
    trackEvent('league_joined', { league_id: leagueId, method });
  },
  
  stepsSubmitted: (stepCount: number, leagueId: string) => {
    trackEvent('steps_submitted', { step_count: stepCount, league_id: leagueId });
  },
  
  // Tier 2: Micro Conversions
  onboardingCompleted: (stepsCompleted: number) => {
    trackEvent('onboarding_completed', { steps_completed: stepsCompleted });
  },
  
  firstStepsSubmitted: (stepCount: number) => {
    trackEvent('first_steps_submitted', { step_count: stepCount });
  },
  
  inviteSent: (leagueId: string, method: string) => {
    trackEvent('invite_sent', { league_id: leagueId, invite_method: method });
  },
  
  // Tier 3: Engagement
  login: (method: 'google' | 'email') => {
    trackEvent('login', { method });
  },
  
  ctaClicked: (buttonName: string, page: string) => {
    trackEvent('click_cta', { button_name: buttonName, page });
  },
  
  feedbackSubmitted: (type: 'bug' | 'feature' | 'other') => {
    trackEvent('feedback_submitted', { type });
  },
  
  achievementShared: (platform: string, achievementType: string) => {
    trackEvent('share_achievement', { platform, achievement_type: achievementType });
  },
  
  // Tier 4: Newsletter (Future)
  newsletterSignup: (source: string, campaign?: string) => {
    trackEvent('newsletter_signup', { source, campaign: campaign || 'organic' });
  },
};
```

### Usage in Components

```tsx
// Example: Sign up page
import { analytics } from '@/lib/analytics';

// After successful signup
analytics.signUp('google');

// After league creation
analytics.leagueCreated(league.id, league.name);

// After steps submission
analytics.stepsSubmitted(10000, league.id);
```

### Data Attributes for Click Tracking (Optional)

For elements tracked via GTM Click Triggers, use `data-*` attributes:

```tsx
<button
  data-track="cta"
  data-track-name="join_league"
  data-track-page="homepage"
>
  Join a League
</button>
```

Then in GTM, create a Click Trigger that fires when `data-track` equals `cta`.

---

## Part 6: GTM Tag Configuration for Custom Events

### Create Variables in GTM

1. Go to **Variables** → **User-Defined Variables** → **New**
2. Create these Data Layer Variables:

| Variable Name | Data Layer Variable Name |
|---------------|-------------------------|
| `DLV - league_id` | `league_id` |
| `DLV - league_name` | `league_name` |
| `DLV - method` | `method` |
| `DLV - step_count` | `step_count` |
| `DLV - button_name` | `button_name` |
| `DLV - page` | `page` |

### Create Triggers

1. **Trigger: Sign Up Event**
   - Trigger Type: Custom Event
   - Event Name: `sign_up`
   - Name: `CE - sign_up`

2. **Trigger: League Created**
   - Trigger Type: Custom Event
   - Event Name: `league_created`
   - Name: `CE - league_created`

(Repeat for all events)

### Create GA4 Event Tags

1. **Tag: GA4 - Sign Up**
   - Tag Type: Google Analytics: GA4 Event
   - Configuration Tag: {{GA4 - Configuration}}
   - Event Name: `sign_up`
   - Event Parameters:
     - `method`: {{DLV - method}}
   - Triggering: CE - sign_up
   - Consent Settings: Required consent: `analytics_storage`

(Repeat for all events)

---

## Part 7: Mark Key Events in GA4

After events are flowing:

1. Go to **GA4** → **Admin** → **Events**
2. Find each Tier 1 and Tier 2 event
3. Toggle **"Mark as key event"** ON for:
   - `sign_up` ✅
   - `league_created` ✅
   - `league_joined` ✅
   - `steps_submitted` ✅
   - `onboarding_completed` ✅
   - `first_steps_submitted` ✅
   - `invite_sent` ✅

---

## Part 8: Testing & Verification

### Testing Checklist

1. **GTM Preview Mode:**
   - Click **"Preview"** in GTM
   - Enter `stepleague.app` URL
   - Browse site and verify tags fire correctly

2. **GA4 DebugView:**
   - Go to GA4 → **Admin** → **DebugView**
   - Browse site with GTM Preview active
   - Verify events appear in real-time

3. **Consent Mode Testing:**
   - Clear cookies, revisit site
   - Verify consent banner appears
   - Accept cookies → verify GA4 starts tracking
   - Decline cookies → verify no tracking (but consent ping sent)

4. **Tag Assistant:**
   - Install [Tag Assistant Companion](https://chrome.google.com/webstore/detail/tag-assistant-companion/jmekfmbnaedfebfnmakmokmlfpblbfdm)
   - Verify consent signals being sent

### Verification Metrics

After 24-48 hours, check:
- [ ] Page views appearing in GA4 Realtime
- [ ] Custom events appearing in Events report
- [ ] Key events showing conversion counts
- [ ] No data gaps or anomalies

---

## Part 9: Future Enhancements

### Phase 2: Enhanced E-commerce (When Monetization Launches)
- `begin_checkout`
- `purchase`
- `subscription_started`
- `subscription_cancelled`

### Phase 2: Newsletter Integration
- `newsletter_signup`
- `newsletter_confirmed`
- UTM parameter tracking

### Phase 3: Advanced Attribution
- Cross-domain tracking (if needed)
- User-ID tracking for logged-in users
- Enhanced conversions

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/analytics/GoogleTagManager.tsx` | CREATE | GTM installation component |
| `src/lib/analytics.ts` | CREATE | Analytics utility functions |
| `src/app/layout.tsx` | MODIFY | Add GTM components |
| `.env.local` | MODIFY | Add GTM_ID |
| `.env.example` | MODIFY | Document GTM_ID variable |

---

## Environment Variables

```env
# Google Tag Manager
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Optional: GA4 Measurement ID (if using direct GA4 without GTM)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXX
```

---

## Summary: Click-by-Click Setup Order

1. **Code** → `npm install vanilla-cookieconsent` → Create CookieConsent component
2. **GTM** → Create container → Get Container ID
3. **GA4** → Create property → Get Measurement ID → Set 14-month retention
4. **Code** → Add GTM component → Add analytics utility → Add env vars → Add cookie consent component
5. **GTM Config** → Add default consent tag → Add GA4 config → Add event tags
6. **GA4** → Mark key events → Set up filters
7. **Test** → Preview mode → DebugView → Verify consent signals
8. **Publish** → GTM Publish → Monitor data

---

## Previous PRD
← [PRD 13: Saved Views](./PRD_13_Saved_Views.md)

## Next PRD
→ [PRD 15: Page Layout System](./PRD_15_Page_Layout_System.md)
