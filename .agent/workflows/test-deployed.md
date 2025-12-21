---
description: How to test the deployed application in browser
---

# Testing the Deployed Application

**IMPORTANT**: Always test on the deployed Vercel URL, NOT localhost.

## Deployed URL

The app is deployed at: **https://scl-v3.vercel.app/**

## When to use localhost vs deployed URL

- **localhost:3000** - Only for quick checks while actively developing with `npm run dev`
- **https://scl-v3.vercel.app/** - For all verification, QA testing, and browser automation

## Browser Testing Steps

// turbo-all
1. Navigate to https://stepleague.app
2. Sign in with test credentials if needed
3. Perform verification steps on the deployed site
4. Check browser console for any errors

## Why Not Localhost?

- Localhost requires local environment variables to be configured
- Supabase may not be properly configured locally
- The deployed site represents the true user experience
- Browser automation works more reliably with the deployed URL
