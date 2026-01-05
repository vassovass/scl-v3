# Emergency UI Repair & Polish

- [x] **Softening Light Mode** <!-- id: 0 -->
    - [x] Update `globals.css` light theme to use Off-White (Slate-50) background vs Pure White cards. <!-- id: 1 -->
    - [x] Ensure valid HSL syntax for all variables. <!-- id: 2 -->
- [x] **Fixing Component Syntax (RGB -> HSL)** <!-- id: 3 -->
    - [x] `src/components/roadmap/RoadmapView.tsx` <!-- id: 4 -->
    - [x] `src/components/roadmap/RoadmapSubscribe.tsx` <!-- id: 5 -->
    - [x] `src/components/roadmap/CompletionMiniChart.tsx` <!-- id: 6 -->
    - [x] `src/components/ui/DateRangePicker.tsx` (Critical: hex/rgb injection fix) <!-- id: 7 -->
- [x] **Theme-Aware Logo** <!-- id: 8 -->
    - [x] Inspect Logo implementation (`NavHeader`). <!-- id: 9 -->
    - [x] Implement theme switching logic (dark/light variants). <!-- id: 10 -->
- [x] **Fixing Footer** <!-- id: 11 -->
    - [x] Inspect `GlobalFooter.tsx` for hardcoded colors/syntax errors. <!-- id: 12 -->
    - [x] Apply semantic variables. <!-- id: 13 -->
