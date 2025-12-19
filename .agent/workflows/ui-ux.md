---
description: UI/UX Agent - Design, user experience, and visual improvements
---

# UI/UX Agent Workflow

This workflow is for improving the user interface, user experience, and visual design of StepCountLeague.

## Focus Areas

1. **Authentication UX** - Sign up, sign in, sign out flows with proper feedback
2. **Visual Design** - Modern, polished dark theme with animations
3. **Responsive Design** - Mobile-first, works on all devices
4. **Loading States** - Skeleton loaders, spinners, progress indicators
5. **Error Handling** - Clear, friendly error messages and recovery paths
6. **Micro-interactions** - Hover effects, transitions, button feedback
7. **Accessibility** - ARIA labels, focus states, keyboard navigation

## Design System Reference

- **Base Colors**: slate-950 (dark bg), slate-900 (cards), slate-800 (borders)
- **Accent**: sky-500 (primary actions), sky-400 (hover states)
- **Text**: slate-50 (headers), slate-300 (body), slate-400 (muted)
- **Success**: emerald-500
- **Error**: rose-500
- **Warning**: amber-500

## Standard Patterns

### User Feedback on Actions
- Show loading spinner during async operations
- Disable buttons while processing
- Show success/error toasts or inline messages
- Redirect to appropriate page after successful action

### Button States
```tsx
// All action buttons should have:
// - loading state with spinner
// - disabled state while processing
// - hover/focus effects
<button
  disabled={loading}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? <Spinner /> : "Action Label"}
</button>
```

### Form Validation
- Inline validation on blur
- Clear error messages under fields
- Disable submit until valid
- Show submission progress

## Checklist Before PR

- [ ] Tested all interactive states (hover, focus, active)
- [ ] Loading states show immediately on action
- [ ] Error states are handled gracefully
- [ ] Redirects happen after successful actions
- [ ] Mobile responsive (test at 375px width)
- [ ] No layout shifts during loading
- [ ] Accessibility checked (keyboard navigation, screen reader)

## Key Files to Modify

- `src/components/` - Reusable UI components
- `src/app/globals.css` - Global styles and utilities
- `src/app/(auth)/` - Auth pages (sign-in, sign-up)
- `src/app/(dashboard)/` - Protected pages
- `src/components/providers/AuthProvider.tsx` - Auth context with signOut

## Example: Fixing Logout UX

The logout should:
1. Show "Signing out..." state on button
2. Clear session
3. Redirect to sign-in page with success message
4. Show "You've been signed out" on the sign-in page
