# Social Sharing Implementation Details

## MetricConfig Type Definition

**File:** `src/lib/sharing/metricConfig.ts`

```typescript
export type MetricType =
  | 'steps'
  | 'calories'
  | 'slp'
  | 'distance'
  | 'swimming'
  | 'cycling'
  | 'running';

export interface MetricConfig {
  type: MetricType;
  displayName: string;      // "Steps", "Calories", "SLP"
  unit: string;             // "steps", "kcal", "SLP", "km"
  emoji: string;            // "🚶", "🔥", "⚡", "🚴"
  gradient: string;         // Tailwind gradient classes
  formatValue: (value: number) => string;
}

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  steps: {
    type: 'steps',
    displayName: 'Steps',
    unit: 'steps',
    emoji: '🚶',
    gradient: 'from-sky-500 to-emerald-500',
    formatValue: (v) => v.toLocaleString(),
  },
  // Future metrics added here (PRD-48)
};
```

---

## Multi-Select Message Builder (PRD-57)

**Problem:** Users sharing custom date ranges get misleading messages like "Just logged 29,730 steps today!" when it's actually a 5-day total.

**Solution:** Let users pick exactly what content appears in their share message.

**Files:**
- `src/lib/sharing/shareContentConfig.ts` - Content block definitions
- `src/lib/sharing/shareMessageBuilder.ts` - Message builder function
- `src/components/sharing/ShareContentPicker.tsx` - UI component

**Available Content Blocks:**

| Block ID | Example Output | Category |
|----------|----------------|----------|
| `total_steps` | "29,730 steps" | Basic |
| `day_count` | "📅 5 days" | Basic |
| `date_range` | "(25 Jan - 29 Jan)" | Basic |
| `average` | "📊 Avg: 5,946/day" | Detailed |
| `individual_days` | "Mon: 6,200 ⭐\nTue: 5,100..." | Detailed |
| `best_day` | "⭐ Best: 8,500 (27 Jan)" | Detailed |
| `streak` | "🔥 14 days streak" | Comparison |
| `rank` | "🏆 Rank #3" | Comparison |
| `improvement` | "📈 +15% vs last period" | Comparison |

**Usage:**

```typescript
import { buildShareMessage } from "@/lib/sharing/shareMessageBuilder";
import { ShareContentPicker } from "@/components/sharing/ShareContentPicker";

const result = buildShareMessage(selectedBlocks, {
  totalSteps: 29730,
  dayCount: 5,
  startDate: "2026-01-25",
  endDate: "2026-01-29",
  averageSteps: 5946,
  dailyBreakdown: [...],
  bestDaySteps: 8500,
  bestDayDate: "2026-01-27",
});
```

**Passing Data to ShareModal:**

```typescript
openShareModal({
  cardType: "custom_period",
  value: totalSteps,
  metricType: "steps",
  dayCount: periodStats.days_submitted,
  periodStart: dateRange.start,
  periodEnd: dateRange.end,
  averageSteps: periodStats.average_per_day,
  dailyBreakdown: [{ date: "2026-01-25", steps: 6200 }, ...],
  bestDaySteps: bestStats.best_day_steps,
  bestDayDate: bestStats.best_day_date,
  improvementPct: comparisonStats?.improvement_pct,
});
```

---

## Pre-filled Messages (Legacy Fallback)

**File:** `src/lib/sharing/shareMessages.ts`

```typescript
export const SHARE_MESSAGES: Record<CardType, (data: ShareData) => string> = {
  daily: (d) => `Just logged ${d.formattedValue} today! ${d.emoji} #StepLeague`,
  weekly: (d) => `My week: ${d.formattedValue} (avg ${d.average}/day) 💪 #StepLeague`,
  personal_best: (d) => `NEW PERSONAL BEST! ${d.formattedValue} 🏆 #StepLeague`,
  streak: (d) => `${d.value} days in a row! 🔥 #StepLeague`,
  challenge: (d) => `Can you beat my ${d.formattedValue}? 💪 #StepLeague`,
  rank_change: (d) => `Moved from #${d.oldRank} to #${d.newRank}! 🚀 #StepLeague`,
};
```

---

## OG Image Generation Details

**File:** `src/app/api/og/route.tsx`

### OG API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metric_type` | string | Yes | steps, calories, slp, distance, etc. |
| `value` | number | Yes | The metric value |
| `name` | string | Yes | User's display name |
| `rank` | number | No | League rank (1-based) |
| `period` | string | No | "Today", "This Week", "Jan 1-7" |
| `improvement` | number | No | Improvement percentage |
| `league` | string | No | League name |
| `emoji` | string | No | Override default emoji |
| `theme` | string | No | "dark" or "light" |

### Example URL

```
/api/og?metric_type=steps&value=12345&name=John&rank=3&period=This%20Week&improvement=15&league=Team%20Alpha
```

### WhatsApp OG Tags (generateMetadata)

```typescript
export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const ogImageUrl = new URL("/api/og", process.env.NEXT_PUBLIC_APP_URL);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl.toString(), width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl.toString()],
    },
  };
}
```

---

## Data Fetching in ShareModal

When users select "Custom" card type and pick a date range, data must be fetched dynamically.

**File:** `src/components/sharing/ShareModal.tsx`

```typescript
const [fetchedDailyBreakdown, setFetchedDailyBreakdown] = useState<DailyBreakdownEntry[]>();
const [availableDates, setAvailableDates] = useState<SubmissionDateInfo[]>([]);

// Fetch available dates on mount (for heatmap)
useEffect(() => {
  if (!isOpen) return;
  const fetchAvailableDates = async () => {
    const res = await apiRequest(`submissions/available-dates?start=${startDate}&end=${endDate}`);
    setAvailableDates(res.dates || []);
  };
  fetchAvailableDates();
}, [isOpen]);

// Fetch breakdown when custom period changes
useEffect(() => {
  if (!cardData.customPeriod || cardData.cardType !== "custom_period") return;
  const { start, end } = cardData.customPeriod;
  // Fetch and calculate best day, total, average...
}, [cardData.customPeriod, cardData.cardType]);
```

---

## Tooltip Pattern

**Files:**
- `src/lib/sharing/shareTooltips.ts` - Centralized tooltip content
- `src/components/ui/tooltip.tsx` - shadcn/ui Tooltip component

**Sources:** `CARD_TYPE_TOOLTIPS`, `CATEGORY_TOOLTIPS`, `SECTION_TOOLTIPS`, `getBlockTooltip(block, isAvailable)`

```typescript
<TooltipProvider delayDuration={300}>
  <Tooltip>
    <TooltipTrigger asChild><button>...</button></TooltipTrigger>
    <TooltipContent side="bottom">{CARD_TYPE_TOOLTIPS[cardType]}</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## DateRangePicker Inline Mode Fix

**Problem:** `selectingEnd` state resets between clicks because parent re-renders.

**Solution:** Use `alwaysOpen={true}` and a ref:

```typescript
// In ShareDateRangePicker
<DateRangePicker alwaysOpen={true} ... />

// In DateRangePicker
const selectingEndRef = useRef(false);
const handleDayClick = (day: Date) => {
  if (!selectingEndRef.current) {
    onSelect({ from: day, to: undefined });
    selectingEndRef.current = true;
  } else {
    onSelect({ from: date.from, to: day });
    selectingEndRef.current = false;
    onClose?.();
  }
};
```

**Files Modified:**
- `src/components/ui/DateRangePicker.tsx` - Added `alwaysOpen` prop and `selectingEndRef`
- `src/components/sharing/ShareDateRangePicker.tsx` - Added `alwaysOpen={true}`

---

## Share Analytics Events

```typescript
// Track share intent (modal opened)
analytics.trackEvent('share_intent', {
  card_type: 'daily',
  metric_type: 'steps',
  source: 'stats_hub',
});

// Track share completion
analytics.share('achievement', cardId, platform);
```

### UTM Parameters

```typescript
const shareUrl = new URL(baseUrl);
shareUrl.searchParams.set('utm_source', 'share');
shareUrl.searchParams.set('utm_medium', platform);
shareUrl.searchParams.set('utm_campaign', cardType);
```

### Share Funnel

1. `share_intent` - User opened share modal
2. `share` - User completed share action
3. `share_link_click` - Recipient clicked shared link
4. `share_conversion` - Recipient signed up

---

## Research References

- [Frontiers Psychology - Fitness Social Media Impact](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1635912/full)
- [OG Image Gallery - Dimensions Guide](https://www.ogimage.gallery/libary/the-ultimate-guide-to-og-image-dimensions-2024-update)
- [OpenGraph.xyz - Image Best Practices](https://www.opengraph.xyz/blog/the-ultimate-guide-to-open-graph-images)
