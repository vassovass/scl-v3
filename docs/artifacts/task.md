# PRD 19: League Start Date

## Database
- [ ] Create migration for `counting_start_date` in `leagues` table <!-- id: 0 -->

## Backend
- [ ] Update `src/types/database.ts` with new column <!-- id: 1 -->
- [ ] Update `src/app/api/leagues/[id]/route.ts` to handle `counting_start_date` update <!-- id: 2 -->
- [ ] Update Leaderboard logic to filter by `counting_start_date` <!-- id: 3 -->
    - [ ] Check `src/app/api/leaderboard/route.ts` or relevant RPC function

## Frontend
- [ ] Update League Settings UI to include Date Picker for `counting_start_date` <!-- id: 4 -->
- [ ] Verify Leaderboard view respects the start date <!-- id: 5 -->

## Verification
- [ ] Verify migration runs successfully <!-- id: 6 -->
- [ ] Verify setting start date in UI persists <!-- id: 7 -->
- [ ] Verify steps before start date are excluded from leaderboard <!-- id: 8 -->
- [ ] Verify steps after start date are included <!-- id: 9 -->
