---
name: social-sharing
description: Implements social sharing features including OG image generation, useShare hook, WhatsApp optimization, shareable URLs, and the multi-select message builder. Use when building share modals, generating Open Graph images, creating share cards, or integrating with social platforms.
compatibility: Antigravity, Claude Code, Cursor
metadata:
  version: "1.3"
  project: "stepleague"
  last_updated: "2026-01-30"
---

# Social Sharing Skill

## Overview

Social sharing in StepLeague covers OG image generation, the `useShare` hook, WhatsApp optimizations, shareable URLs, share analytics, and the modular MetricConfig system.

---

## Critical Rules

### 1. Always Use the `useShare` Hook

Never call sharing APIs directly:

```typescript
// ✅ CORRECT
import { useShare } from "@/hooks/useShare";

const { share, isSharing, copied, supportsNativeShare } = useShare({
  contentType: 'achievement',
  itemId: cardId,
});

await share({ title: "My Achievement", text: "12,345 steps!", url: shareUrl }, 'whatsapp');

// ❌ WRONG - Direct platform calls
window.open(`https://wa.me/?text=${message}`, '_blank');
```

### 2. OG Images Must Be 1200x630px

- **Size:** 1200x630 pixels (1.91:1 aspect ratio)
- **File size:** <300KB
- **Text coverage:** <20-25%
- **Format:** PNG or JPG

### 3. Use MetricConfig for Metric Display

```typescript
// ✅ CORRECT - Config-driven
import { METRIC_CONFIGS } from "@/lib/sharing/metricConfig";
const config = METRIC_CONFIGS[metricType];
const display = `${config.formatValue(value)} ${config.unit}`;

// ❌ WRONG - Hardcoded
const display = `${value.toLocaleString()} steps`;
```

### 4. WhatsApp Messages Must Be Concise

- **Max 100 characters** before the URL
- **Include hashtag** (#StepLeague)
- **One clear CTA** or achievement

---

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useShare.ts` | Multi-platform share hook |
| `src/app/api/og/route.tsx` | OG image generation API |
| `src/lib/sharing/metricConfig.ts` | Metric type configs |
| `src/lib/sharing/shareContentConfig.ts` | Content block definitions |
| `src/lib/sharing/shareMessageBuilder.ts` | Message builder |
| `src/lib/sharing/shareMessages.ts` | Legacy pre-filled messages |
| `src/lib/sharing/shareTooltips.ts` | Tooltip content |
| `src/components/sharing/ShareModal.tsx` | Share modal component |
| `src/components/sharing/ShareContentPicker.tsx` | Multi-select picker |
| `src/components/sharing/ShareDateRangePicker.tsx` | Date range for custom shares |

---

## Share Flow Patterns

### Share Modal (WhatsApp-first)

1. Card preview (shows exactly what will be shared)
2. Optional message input (max 100 chars)
3. **WhatsApp button** - Large, primary action
4. Secondary buttons (X/Twitter, Copy Link)
5. Native share option (if supported)
6. **Multi-select content picker** (PRD-57) — customizable message blocks

### Share URL Structure

**Quick shares (URL params):**
```
/share/[userId]?type=daily&metric=steps&value=12345&period=today
```

**Persistent shares (short codes):**
```
/s/xK7mN2pQ
```

### WhatsApp URL Format

```typescript
const waUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
window.open(waUrl, "_blank", "noopener,noreferrer");
```

---

## Integration Points

### Post-Submission Prompt

```typescript
const handleSubmitSuccess = () => {
  if (userPreferences.sharePromptsEnabled !== false) {
    setShowShareModal(true);
  }
};
```

### Milestone Detection

```typescript
const STREAK_MILESTONES = [7, 14, 30, 50, 100, 365];
function checkForMilestone(newStreak: number): boolean {
  return STREAK_MILESTONES.includes(newStreak);
}
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| ShareModal blocks disabled | Pass full data when opening modal OR fetch dynamically |
| Heatmap not showing | Pass `submissionData` to ShareDateRangePicker |
| Tooltips not appearing | Wrap with `TooltipProvider` (delayDuration=300) |
| DateRangePicker state resets | Use `alwaysOpen={true}` and `selectingEndRef` |
| Click outside doesn't close | Add `onClick={onClose}` to backdrop div |

---

## Reference Files

For full implementation details (MetricConfig types, message builder blocks, OG API params, data fetching patterns, tooltip system, DateRangePicker fix), see:
- **[references/implementation-details.md](./references/implementation-details.md)**

---

## Related Skills

- `analytics-tracking` - Share event tracking patterns
- `design-system` - Card and modal styling
- `api-handler` - OG API route patterns
- `react-debugging` - DateRangePicker re-render fix pattern
