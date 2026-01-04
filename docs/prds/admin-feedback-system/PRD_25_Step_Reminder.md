# PRD 25: Smart Step Reminder System

> **Order:** 25 of 30  
> **Previous:** [PRD 24: League Hub](./PRD_24_League_Hub.md)  
> **Next:** [PRD 26: Unified Progress View](./PRD_26_Unified_Progress.md)  
> **Depends on:** PRD 22 (preferences), PRD 23 (feature flags)  
> **Status:** 📋 Proposed

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/(dashboard)/dashboard/page.tsx` - Dashboard to add indicators
   - `src/app/globals.css` - Animation utilities
   - `src/lib/analytics.ts` - Tracking patterns

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Update ROADMAP.md when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-23): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**Current:** No visual indicator when user hasn't submitted today's steps

**Impact:**
- Users forget to submit daily → broken habits → churn
- No "nudge" to complete the core action
- Streaks break silently without warning

**Research Finding:** Gentle urgency messaging increases task completion by 40%+. Streak protection messaging is highly effective for fitness apps.

---

## Outcome

Users see a contextual, animated CTA when they haven't submitted today's steps:

1. **Dashboard** - Indicator on league cards missing today
2. **League Hub** - Prominent reminder banner
3. **Streak messaging** - "Don't break your 5-day streak!"

---

## What is Needed

### 1. Step Status API Enhancement

Extend existing API to return `submitted_today` status:

```typescript
// GET /api/leagues response enhancement
{
  leagues: [
    {
      id: "...",
      name: "...",
      submitted_today: false,  // NEW
      current_streak: 5,       // NEW
      // ... existing fields
    }
  ]
}
```

### 2. Missing Step Indicator Component

Create `MissingStepReminder.tsx`:

**Variants:**
- `floating` - **DEFAULT** - Persistent floating button/banner (bottom-right), dismissible
- `badge` - Small indicator for league cards (🔴 dot)  
- `card` - Full CTA card for League Hub

**User Preference (Settings):**
Users can choose their preferred reminder style in Profile Settings:
- Floating reminder (default)
- Badge only (subtle)
- Card in League Hub (page-based)

**Props:**
```typescript
interface MissingStepReminderProps {
  variant: 'floating' | 'badge' | 'card';
  streak?: number;       // For streak messaging
  leagueId: string;
  onDismiss?: () => void;
  // Floating-specific
  position?: 'bottom-right' | 'bottom-left';
}
```

### 3. Urgency Levels (Time-Based)

| Time | Message | Animation |
|------|---------|-----------|
| Morning (6am-12pm) | "Don't forget to log today's steps" | Subtle pulse |
| Afternoon (12pm-6pm) | "You haven't submitted today" | Pulse + glow |
| Evening (6pm-10pm) | "Day's almost over! Submit now" | Bounce + urgency |
| Night (10pm-midnight) | "Last chance to submit today!" | Strong attention |

### 4. Streak Protection Messaging

When user has a streak:

```
⚠️ Don't break your 5-day streak!
Submit your steps to keep it going.
[Submit Steps →]
```

### 5. Dashboard Integration

Update `dashboard/page.tsx` to show indicators on league cards:

```tsx
<div className="relative">
  {!league.submitted_today && (
    <MissingStepReminder variant="badge" />
  )}
  <LeagueCard ... />
</div>
```

---

## Visual Design

### Badge Variant (Dashboard)

```
┌─────────────────────────────┐
│ 🔴                          │  ← Pulsing red dot
│ League Name                 │
│ Owner • 5 members           │
│ 8,420 steps this week       │
└─────────────────────────────┘
```

### Card Variant (League Hub)

```
┌─────────────────────────────┐
│ ⚠️ You haven't submitted    │
│ today's steps               │
│                             │
│ Don't break your 5-day      │
│ streak! 🔥                  │
│                             │
│ [Submit Steps →]            │  ← Primary CTA
└─────────────────────────────┘
```

---

## Animation Specification

Use existing animation utilities from `globals.css`:

```css
/* Already exists */
.animate-pulse-glow { ... }
.animate-float { ... }

/* Add if needed */
.animate-attention-pulse {
  animation: attention-pulse 2s ease-in-out 3;  /* 3 cycles only */
}

@keyframes attention-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; box-shadow: ... }
}
```

**Accessibility:** Respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-attention-pulse { animation: none; }
}
```

---

## Analytics Tracking

Per AGENTS.md, add tracking:

```typescript
// When reminder is shown
analytics.engagement.reminderShown(leagueId, urgencyLevel, hasStreak);

// When CTA is clicked
analytics.engagement.reminderClicked(leagueId, source);  // source: 'dashboard' | 'hub'

// When reminder is dismissed
analytics.engagement.reminderDismissed(leagueId);
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/league/MissingStepReminder.tsx` | **NEW** - Reminder component |
| `src/app/api/leagues/route.ts` | **MODIFY** - Add `submitted_today` field |
| `src/app/(dashboard)/dashboard/page.tsx` | **MODIFY** - Add badge indicators |
| `src/app/(dashboard)/league/[id]/page.tsx` | **MODIFY** - Add card reminder |
| `src/app/globals.css` | **MODIFY** - Add attention animation |
| `src/lib/analytics.ts` | **MODIFY** - Add reminder tracking |

---

## Success Criteria

- [ ] Dashboard shows 🔴 indicator on leagues missing today's submission
- [ ] League Hub shows reminder CTA when not submitted
- [ ] Streak messaging appears when user has active streak
- [ ] Animation respects `prefers-reduced-motion`
- [ ] Analytics events fire correctly
- [ ] Mobile-responsive
- [ ] Build passes (`npm run build`)

---

## Proactive Enhancements

> These enhancements go beyond the basic requirements to deliver exceptional UX.

### 1. Smart Snooze

When user dismisses floating reminder:

| Option | Behavior |
|--------|----------|
| "Remind me later" | Snooze 2 hours |
| "Dismiss for today" | Gone until tomorrow |
| "I already walked" | Opens submit modal |

Stored in `user_preferences.reminder_dismissed_until`.

### 2. Streak Save Notification

If user is about to lose a streak (after 8pm, not submitted):

```
┌────────────────────────────────────────┐
│ 🔥 STREAK ALERT!                       │
│                                        │
│ You're about to lose your 12-day       │
│ streak! Submit before midnight.        │
│                                        │
│ [Submit Now]  [I'll do it later]       │
└────────────────────────────────────────┘
```

Uses stronger urgency colors (amber → red as time passes).

### 3. Contextual Tips

First-time reminder shows helpful tip:

```
💡 Tip: Submit your steps every day to
build a streak and climb the leaderboard!
```

Shown only once, stored in localStorage.

### 4. Celebration on Submit

After submitting (especially if saving streak):

- Confetti animation (reuse existing `Confetti.tsx`)
- "🔥 Streak saved!" or "✅ Day logged!" toast

### 5. Streak Freeze System (Duolingo Model)

> **Research:** Duolingo found streak freezes reduced churn by 21% for at-risk users.

**Concept:** Users can "freeze" their streak for 1 day when they can't submit.

**Database Additions:**
```sql
-- Add to user_records table (existing)
ALTER TABLE user_records 
ADD COLUMN streak_freezes_available INTEGER DEFAULT 2,
ADD COLUMN last_streak_freeze_used TIMESTAMPTZ,
ADD COLUMN streak_frozen_dates DATE[] DEFAULT '{}';

-- Or if user_records doesn't exist yet, add to user_preferences
```

**Behavior Rules:**
| Rule | Implementation |
|------|----------------|
| **Bank limit** | Max 2 freezes available at a time |
| **Earn rate** | +1 freeze earned per 7-day streak milestone |
| **Use limit** | Max 2 uses per month (resets 1st of month) |
| **Auto-use** | Option to auto-freeze if day ends without submission |
| **Visibility** | Show "🛡️ 2 streak freezes" in progress view |

**UI Flow:**

```
User without submission at 11pm:
┌────────────────────────────────────────┐
│ 🔥 Your 12-day streak is at risk!      │
│                                        │
│ You haven't submitted today.           │
│                                        │
│ [Submit Now]                           │
│                                        │
│ ─ or ─                                 │
│                                        │
│ [🛡️ Use Streak Freeze]                │
│ 2 freezes remaining                    │
└────────────────────────────────────────┘
```

**After freeze used:**
```
✅ Streak freeze activated!
Your 12-day streak is protected.
🛡️ 1 freeze remaining
```

---

## Out of Scope

- Push notifications (future)
- Email reminders (separate PRD)
- Custom reminder times

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD based on UX analysis and research |
