# Implementation Plan - PRD 19: League Start Date

This feature enables league owners to set a "counting start date" for their league. Steps submitted before this date will not count towards the league's leaderboard, allowing for "fresh start" competitions without affecting global data.

## User Review Required

> [!IMPORTANT]
> **New League Settings Page**: Since no "Settings" page exists, I will create a new page at `/league/[id]/settings`.
> **API Update**: I will implement a `PUT` handler on `/api/leagues/[id]` to support updating league details.

## Proposed Changes

### Database

#### [NEW] [20260103_add_league_settings.sql](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/supabase/migrations/20260103000000_add_league_settings.sql)
Add new columns to `leagues` table:
1.  `counting_start_date` (DATE, nullable) - *Original request*
2.  `description` (TEXT, nullable) - *League bio/motto*
3.  `is_public` (BOOLEAN, default false) - *For future public directory*
4.  `allow_manual_entry` (BOOLEAN, default true) - *If false, disables manual number input*
5.  `require_verification_photo` (BOOLEAN, default false) - *If true, photo is mandatory*
6.  `daily_step_goal` (INTEGER, default 10000) - *Visual target for members*
7.  `max_members` (INTEGER, default 50) - *Capacity limit*
8.  `category` (TEXT, default 'general') - *e.g., corporate, friends, competitive*

### Backend

#### [MODIFY] [database.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/types/database.ts)
- Update `leagues` table definition with all 8 new columns.

#### [MODIFY] [route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/leagues/[id]/route.ts)
- Update `PUT` handler URL params to accept all new fields.
- Validate `max_members` (min 1).
- Validate `daily_step_goal` (min 1000).

#### [MODIFY] [route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/leaderboard/route.ts)
- (No changes needed for these new settings yet, purely metadata/validation).


### Frontend

#### [NEW] [page.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/(dashboard)/league/[id]/settings/page.tsx)
- Create a modular settings page protected by role (Owner/Admin).
- Layout: Stacked "Cards" for mobile-first modularity.
- Implement `src/components/league/settings/SettingsSection.tsx` wrapper for consistent styling.

#### [NEW] Directory: `src/components/league/settings/`
- **`GeneralSettings.tsx`**:
    - League Name
    - Description (Textarea)
    - Category (Select: Friends, Corporate, Running, Walking)
    - Week Start (Mon/Sun)
- **`CompetitionSettings.tsx`**:
    - Counting Start Date
    - Daily Step Goal (Input number)
    - Max Members (Input number)
- **`RulesSettings.tsx`** (New Section):
    - Allow Manual Entry (Switch/Checkbox)
    - Require Verification Photo (Switch/Checkbox)
    - Is Public (Switch/Checkbox)
- **`DangerZone.tsx`**:
    - Delete/Archive League logic.

#### [MODIFY] [page.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/(dashboard)/league/[id]/page.tsx)
- Add a "Settings" button in the `LeagueInviteControl` / Actions area, visible only to admins/owners.

## Verification Plan

### Automated Tests
- None existing.

### Manual Verification
1.  **Migration**: Run migration and check Supabase table.
2.  **Modular Settings UI**:
    -   Go to a League where I am owner.
    -   Click "Settings".
    -   **General**: Change Name and Step Week Start. Verify they persist.
    -   **Competition**: Set a Counting Start Date. Verify it persists.
    -   **Danger**: (Optional check if implemented) Verify delete/archive warning.
3.  **Leaderboard Filtering**:
    -   Submit steps for:
        -   Today (should count).
        -   3 days ago (should NOT count, if start date is set).
    -   Check Leaderboard.
    -   Verify "Total Steps" matches only the valid days.
4.  **Permissions**:
    -   Try to access Settings as a regular member (should be denied).
