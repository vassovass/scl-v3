# PRD 48: Universal Health Measurement System

> **Order:** 48
> **Status:** 📋 Proposed (Vision/Architecture)
> **Type:** Architecture
> **Dependencies:** PRD 46 (Points System)
> **Blocks:** None

---

## 🎯 Objective

Design a universal health measurement system that converts various activity metrics (calories, kilojoules, swimming laps, cycling distance) into a standardized "StepLeague Point" (SLP) unit. This enables fair competition between users tracking different activities on different devices.

**Problem Solved:** Currently, StepLeague only supports step counting. This excludes:
- Swimmers (who track laps/distance)
- Cyclists (who track kilometers)
- Users with devices that report calories/kJ instead of steps
- Users who do multiple activities

The universal system lets everyone compete on equal footing regardless of activity type.

**Long-Term Vision:** StepLeague becomes "HealthLeague" — a suite of activity-agnostic fitness competitions.

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `src/app/api/submissions/route.ts` | Current submission handling |
| `supabase/functions/verify-steps/index.ts` | AI extraction (Gemini) |
| `AGENTS.md` | Architecture patterns |

---

## 🏗️ Detailed Feature Requirements

### Section A: Universal Unit Definition — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **SLP as standard unit** | Common measurement | All activities convert to "StepLeague Points" (SLP) |
| **A-2** | **1 step = 1 SLP baseline** | Intuitive foundation | Steps remain the reference point (no conversion needed) |
| **A-3** | **Conversion table defined** | Multi-activity support | Documented formulas for each supported activity |

### Section B: Supported Activities — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Steps** | Core activity | 1 step = 1 SLP (baseline) |
| **B-2** | **Calories burned** | Universal device metric | 1 kcal = 20 SLP |
| **B-3** | **Kilojoules** | Metric alternative | 1 kJ = 5 SLP |
| **B-4** | **Swimming distance** | Swimmers | 100m = 150 SLP |
| **B-5** | **Cycling distance** | Cyclists | 1 km = 100 SLP |
| **B-6** | **Running distance** | Runners (higher intensity) | 1 km = 1,300 SLP |

### Section C: AI Extraction Enhancement — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Multi-metric detection** | Device variety | AI detects steps, calories, kJ from screenshots |
| **C-2** | **Automatic unit conversion** | User convenience | Detected value auto-converted to SLP |
| **C-3** | **Activity type inference** | Context awareness | AI infers activity type from screenshot context |
| **C-4** | **Multiple metrics in one screenshot** | Comprehensive tracking | All detected values stored, primary used for SLP |

### Section D: User Interface — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Activity type selector** | Manual entry support | Dropdown: Steps, Swim, Cycle, Run, Calories, kJ |
| **D-2** | **Unit input field** | Manual value entry | Input with appropriate unit label |
| **D-3** | **SLP conversion preview** | Transparency | Shows "X steps/km/etc = Y SLP" before submit |
| **D-4** | **Leaderboard shows SLP** | Unified ranking | Leaderboard displays SLP, not raw values |

### Section E: Database Extensions — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **Raw value storage** | Data preservation | Store original value and unit |
| **E-2** | **SLP equivalent storage** | Query efficiency | Pre-calculated SLP stored alongside raw |
| **E-3** | **Activity type tracking** | Analytics | Track which activity types users submit |

---

## ✅ Success Criteria (For Design Phase)

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Conversion formulas documented | 6 activities | Count in conversion table |
| Database schema drafted | Columns specified | Review schema section |
| AI prompt updates specified | Extraction patterns | Review AI section |
| UI requirements defined | 4 components | Review UI section |

---

## 📐 Conversion Table & Rationale

### Core Conversions

| Activity | Unit | SLP Equivalent | Rationale |
|----------|------|----------------|-----------|
| **Steps** | 1 step | 1 SLP | Baseline (reference) |
| **Calories** | 1 kcal | 20 SLP | ~50 kcal ≈ 1,000 steps (moderate walking) |
| **Kilojoules** | 1 kJ | 5 SLP | 1 kcal = 4.184 kJ, so 20/4.184 ≈ 5 |
| **Swimming** | 100m | 150 SLP | ~15 min swim ≈ 1500 steps equivalent effort |
| **Cycling** | 1 km | 100 SLP | ~3 min cycling ≈ 100 steps equivalent |
| **Running** | 1 km | 1,300 SLP | 1 km running ≈ 1,300 steps (actual footsteps) |

### Research Basis

**Steps to Calories:**
- Average: 100 steps ≈ 4-5 kcal
- Inverse: 1 kcal ≈ 20-25 steps
- We use: **1 kcal = 20 SLP**

**Swimming Equivalence:**
- 30 min moderate swim ≈ 300 kcal
- 300 kcal × 20 = 6,000 SLP
- Typical 30-min swim ≈ 1,500m
- 6,000 SLP / 15 (per 100m) = **150 SLP per 100m**

**Cycling Equivalence:**
- 30 min moderate cycling ≈ 250 kcal
- 30 min at 20km/h = 10 km
- 250 kcal × 20 = 5,000 SLP
- 5,000 / 10 km = 500 SLP/km... but cycling is less weight-bearing
- Adjusted: **100 SLP per km** (encourages more activity)

**Running Equivalence:**
- 1 km running ≈ 1,200-1,400 actual steps (stride length)
- We use: **1,300 SLP per km** (approximately actual footsteps)

---

## 🗄️ Database Schema (Draft)

### Updates to `submissions`

```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS activity_type VARCHAR(20) DEFAULT 'steps';
-- Values: steps, calories, kilojoules, swimming, cycling, running

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS raw_value DECIMAL(10,2);
-- Original value in original units

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS raw_unit VARCHAR(20);
-- Original unit: steps, kcal, kj, meters, km

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS slp_equivalent INTEGER;
-- Pre-calculated SLP value for quick queries

-- Example row:
-- activity_type: 'swimming'
-- raw_value: 2500 (meters)
-- raw_unit: 'meters'
-- slp_equivalent: 3750 (2500/100 * 150)
-- steps: NULL (or set to slp_equivalent for backward compat)
```

### Migration Strategy

```sql
-- For existing rows, steps = slp_equivalent
UPDATE submissions
SET
  activity_type = 'steps',
  raw_value = steps,
  raw_unit = 'steps',
  slp_equivalent = steps
WHERE slp_equivalent IS NULL;
```

---

## 🤖 AI Extraction Enhancement

### Updated Gemini Prompt (Conceptual)

```
Analyze this health/fitness screenshot and extract:

1. PRIMARY METRIC (choose most prominent):
   - Steps (integer)
   - Calories (kcal, number)
   - Kilojoules (kJ, number)
   - Distance (meters or km, with activity type)

2. ACTIVITY TYPE (if detectable):
   - walking, running, swimming, cycling, or unknown

3. SECONDARY METRICS (if visible):
   - List any additional metrics visible

Return JSON:
{
  "primary_metric": { "type": "steps|calories|kj|distance", "value": number, "unit": string },
  "activity_type": "walking|running|swimming|cycling|unknown",
  "secondary_metrics": [...],
  "date": "YYYY-MM-DD",
  "confidence": "high|medium|low"
}
```

### Conversion Logic (Backend)

```typescript
function convertToSLP(type: string, value: number, unit: string): number {
  switch (type) {
    case 'steps':
      return value; // 1:1

    case 'calories':
      return Math.round(value * 20);

    case 'kj':
    case 'kilojoules':
      return Math.round(value * 5);

    case 'distance':
      if (unit === 'meters') {
        // Assume swimming unless specified
        return Math.round((value / 100) * 150);
      } else if (unit === 'km') {
        // Activity-dependent
        // Default to cycling, can be overridden
        return Math.round(value * 100);
      }
      break;

    default:
      return 0;
  }
}
```

---

## 🎨 UI Concepts

### Submission Form - Activity Selector

```
┌─────────────────────────────────────────┐
│ SUBMIT YOUR ACTIVITY                    │
├─────────────────────────────────────────┤
│ Activity Type: [Steps ▼]                │
│ ┌─────────────────────┐                 │
│ │ 👟 Steps            │                 │
│ │ 🔥 Calories         │                 │
│ │ ⚡ Kilojoules       │                 │
│ │ 🏊 Swimming         │                 │
│ │ 🚴 Cycling          │                 │
│ │ 🏃 Running          │                 │
│ └─────────────────────┘                 │
│                                         │
│ Value: [________] steps                 │
│                                         │
│ = 8,500 StepLeague Points               │
│                                         │
│ [Submit Activity]                       │
└─────────────────────────────────────────┘
```

### Leaderboard with SLP

```
┌─────────────────────────────────────────┐
│ GLOBAL LEADERBOARD (This Week)          │
├───┬──────────┬───────────┬──────────────┤
│ # │ Player   │ SLP       │ Activities   │
├───┼──────────┼───────────┼──────────────┤
│ 1 │ Sarah    │ 125,400   │ 👟🏊         │
│ 2 │ You      │ 98,750    │ 👟           │
│ 3 │ Mike     │ 87,200    │ 👟🚴         │
└───┴──────────┴───────────┴──────────────┘
```

---

## 🔄 Edge Cases

| Scenario | Handling |
|----------|----------|
| Screenshot shows both steps AND calories | Use steps as primary (more precise) |
| Activity type unclear | Default to "steps" equivalent, show warning |
| Very high conversion (10km cycle = 1000 SLP) | Cap daily SLP? Or trust user |
| Mixed activities in one day | Each submission separate, sum for daily total |
| Device shows "active calories" vs "total" | Prompt user to clarify or use conservative estimate |

---

## 📅 Implementation Plan Reference

### Phase A: Database
1. Add new columns to submissions table
2. Create conversion function
3. Migrate existing data

### Phase B: AI Enhancement
1. Update Gemini prompt for multi-metric detection
2. Implement backend conversion logic
3. Test with various screenshot types

### Phase C: Manual Entry
1. Activity type selector component
2. Dynamic unit input based on activity
3. SLP preview calculation

### Phase D: Leaderboard
1. Update queries to use slp_equivalent
2. Show activity icons on leaderboard
3. Maintain backward compatibility with steps-only view

---

## 🔗 Related Documents

- [PRD 46: Points System](./PRD_46_Points_Scoring_System.md) - Could apply to SLP
- [Gemini Verification](../../../supabase/functions/verify-steps/index.ts) - Current AI extraction

---

## Future Considerations

- **Device Integrations**: Direct API sync from Fitbit, Garmin, Apple Health?
- **Activity Challenges**: "Swim Week" or "Cycle Challenge" modes?
- **Conversion Adjustments**: Allow leagues to customize conversion rates?
- **Validation**: How to prevent gaming (e.g., claiming 100km cycle daily)?
- **App Rebranding**: "StepLeague" → "ActivityLeague" or "HealthLeague"?

---

## 🔍 Systems/Design Considerations

_Things to understand/investigate during implementation (not do immediately):_

1. **AI Prompt Versioning** - When updating Gemini prompts in `supabase/functions/verify-steps/index.ts` for multi-metric detection, version the prompts (e.g., `PROMPT_V2`). Store the prompt version used with each submission so historical extractions can be reprocessed if needed.

2. **Backward Compatibility** - The existing `steps` column must remain the source of truth for current features. The `slp_equivalent` column is additive, not a replacement. Ensure all existing queries (leaderboard, analytics, records) continue to work with `steps` while new views can use `slp_equivalent`.

3. **Leaderboard Display Modes** - Users should be able to choose "Show raw steps" vs "Show SLP" in their preferences or as a toggle on the leaderboard page. Don't force the conversion on users who only track steps—they might prefer seeing their actual step count.

4. **Device Variance** - Same activity on different devices yields different calorie counts (Fitbit vs Apple Watch vs Samsung Health). Consider tracking `source_device` or `confidence_score` to help users understand why their SLP might vary when switching devices.

---

## 💡 Proactive Considerations

_Forward-thinking items that anticipate future needs:_

1. **Conversion Rate Governance** - Store conversion rates in a config table (`activity_conversions`), not hardcoded in application code. Schema: `(activity_type, unit, slp_per_unit, effective_from)`. This allows adjustment without code deployment and enables A/B testing different rates.

2. **Activity Validation Rules** - 100km daily cycling is suspicious; 50,000 steps is unusual but possible. Plan for per-activity validation thresholds stored in config: `(activity_type, min_value, max_value, requires_verification_above)`. Submissions exceeding thresholds trigger manual review or photo verification requirement.

3. **Multi-Activity Daily Summary** - Users doing steps + cycling in one day need a unified daily view. Design the submission model to store multiple activity types per day with individual SLP values, then aggregate to a `daily_slp_total`. Schema consideration: `submissions` can have multiple rows per user-date, with a `user_daily_summary` materialized view.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-20 | Initial | Created universal health measurement vision PRD |
| 2026-01-20 | Systems/Proactive | Added modular design considerations and forward-thinking items |
