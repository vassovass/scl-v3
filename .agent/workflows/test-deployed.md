---
description: How to test the deployed application in browser
---

# Testing the Deployed Application

**IMPORTANT**: Always test on the deployed Vercel URL, NOT localhost.

## Deployed URL

The app is deployed at: **https://stepleague.app**

## When to use localhost vs deployed URL

- **https://stepleague.app** - For all verification, QA testing, and browser automation

## Browser Testing Steps

// turbo-all
0. Wait 60 seconds for Vercel to deploy AFTER pushed commit
1. Navigate to https://stepleague.app
2. Sign in with test credentials if needed
3. Perform verification steps on the deployed site
4. Check browser console for any errors

## Why Not Localhost?

- Localhost requires local environment variables to be configured
- Supabase may not be properly configured locally
- The deployed site represents the true user experience
- Browser automation works more reliably with the deployed URL