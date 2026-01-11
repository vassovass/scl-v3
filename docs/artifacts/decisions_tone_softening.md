# Decision Record: Strategic Tone Shift ("Softening")

> **Date**: 2026-01-12
> **Status**: Approved / In Implementation
> **Context**: User Request + Business Analysis (Retention Strategy)

## 1. Context & Motivation

The current landing page and branding lean heavily into "Competition" ("Compete. Track. Win.", "No Cheating").
However, the **Business Analysis** highlights "Friend Groups" and "Office Teams" as key target segments. These groups prioritize **connection**, **consistency**, and **shared motivation** over cutthroat competition.

Furthermore, **PRD 31** (Social Encouragement) introduced "High Fives" and "Mindful Copy" to foster a supportive environment. The public facing content must align with this internal product reality to attract the right users (retention-focused vs. churn-prone competitors).

## 2. Strategic Shift

We are moving from a **"Walled Garden of Competition"** to a **"Community of Shared Progress"**.

| Dimension | Old Tone (Competitive) | New Tone (Supportive/Mindful) |
|-----------|------------------------|-------------------------------|
| **Core Value** | Winning, Beating others | Progress, Consistency, Connection |
| **Verification** | "No Cheating" (Accusatory) | "Fair & Verified" (Trust-building) |
| **Relationships**| Rivals/Opponents | Teammates/Friends |
| **Outcome** | "Climb the Leaderboard" | "Reach New Heights Together" |

## 3. Implementation: Home Page Copy Updates

### Hero Section
- **Before**: "Compete. Track. Win."
- **After**: "Motivate. Connect. Thrive."
- **Description**: "Upload step screenshots, get AI-verified, and climb the leaderboard against friends."
- **New Description**: "Upload step screenshots, get verified instantly, and stay motivated with friends."

### How It Works
- **Step 2 (AI)**: "No cheating, no manual entry errors." -> "Ensuring fair play and accurate tracking for everyone."
- **Step 3 (Leaderboard)**: "See where you rank against friends in daily and weekly standings. Stay motivated and keep moving!" -> "Celebrate milestones and see your group's progress. Connect with friends and build healthy habits together."

### Features Section
- **Heading**: "Everything you need to compete with friends" -> "Everything you need to move together"
- **AI Feature**: "Prevent cheating" -> "Ensure fairness"
- **Leaderboards**: "See who's leading" -> "Visualize progress"

## 4. Business Impact (Retention)

By softening the tone:
1.  **Wider Appeal**: Less intimidating to casual users (Friends/Corporate).
2.  **Lower Churn**: Users who "lose" a competitive league churn. Users who "participate" in a supportive league stay.
3.  **Brand Alignment**: Aligns with the new "Zen" features (High Fives, Gratitude Cards).

## 5. Next Steps

1.  Update `src/app/(home)/page.tsx` with new copy.
2.  Ensure visuals (gradients) are inviting, not aggressive.
