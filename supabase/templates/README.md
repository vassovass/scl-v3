# Supabase Email Templates

Branded HTML email templates for Supabase Auth emails. Version-controlled here and deployed via Supabase Dashboard.

## Custom Domain URLs

Templates use `{{ .TokenHash }}` instead of `{{ .ConfirmationURL }}` so that email links point to `stepleague.app` rather than the Supabase project URL. Links route through `/api/auth/confirm` which calls `verifyOtp()` to validate the token and establish a session.

**Prerequisite**: Set **Site URL** to `https://stepleague.app` in Supabase Dashboard → Authentication → URL Configuration.

## Templates

| File | Dashboard Type | Subject Line |
|------|----------------|--------------|
| `reset-password.txt` | Reset Password | Reset your StepLeague password |
| `confirm-signup.txt` | Confirm signup | Confirm your StepLeague account |
| `magic-link.txt` | Magic Link | Sign in to StepLeague |
| `invite-user.txt` | Invite user | You're invited to StepLeague |
| `change-email.txt` | Change Email Address | Confirm your email change |
| `reauthentication.txt` | Reauthentication | Confirm your StepLeague action |

## How to Deploy

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select the template type (e.g., "Reset Password")
3. Replace the **Subject** with the value from the table above
4. Replace the **Body** by pasting the full HTML from the corresponding `.txt` file
5. Click **Save**
6. Repeat for all 6 template types

## How It Works

```
Email link: stepleague.app/api/auth/confirm?token_hash=...&type=recovery
    → /api/auth/confirm route calls verifyOtp({ token_hash, type })
    → Session established, redirect to /update-password (or /dashboard)
```

The `/api/auth/confirm` route (`src/app/api/auth/confirm/route.ts`) handles:
- Token verification via `supabase.auth.verifyOtp()`
- User sync to `public.users` table
- World League auto-enrollment (non-recovery types)
- Type-based redirects (recovery → `/update-password`, others → `/dashboard`)

## Template Variables

| Variable | Used In | Description |
|----------|---------|-------------|
| `{{ .SiteURL }}` | All (in URLs) | Resolves to `https://stepleague.app` |
| `{{ .TokenHash }}` | All (in URLs) | Hashed token for verification |
| `{{ .Token }}` | `reauthentication` | 6-digit OTP code |
| `{{ .Email }}` | `reset-password`, `change-email` | User's current email |
| `{{ .NewEmail }}` | `change-email` | New email being confirmed |

## Design

- Dark theme matching the StepLeague app (`#020617` bg, `#0f172a` card)
- 600px max-width centered card with border
- Table-based layout for email client compatibility (Gmail, Outlook, Apple Mail)
- All inline styles (no `<style>` blocks)
- MSO/VML conditionals for Outlook rounded button support
- Bulletproof button technique (table cell, not padded anchor)
- System font stack (no custom web fonts)
