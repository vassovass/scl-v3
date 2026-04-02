---
## Document Context
**What**: Step-by-step Paystack account setup guide for StepLeague — pre-flight checklist, signup flow, KYC, international payments, test keys, webhooks, and PRD 76 connection
**Why**: Paystack account with test API keys is a prerequisite for PRD 76 (Subscription Management & Grandfathering); guide designed for both human and browser-agent execution
**Status**: Guide
**Last verified**: 2026-03-31
**Agent note**: This guide is the operational companion to `decisions_payment_provider.md` (PRD 72). Follow it when PRD 76 starts. Test keys are available immediately — KYC only gates live payments.
---

# Paystack Signup Guide — FNB Bank Account (South Africa)

> **For**: Solo developer, South African national, FNB bank account, physically in Vietnam
> **Decision basis**: PRD 72 (`docs/artifacts/decisions_payment_provider.md`)
> **When to use**: Before starting PRD 76 (Subscription Management & Grandfathering)

---

## 0. Timeline Summary

| Step | Time Required | Blocks Development? |
|------|--------------|-------------------|
| Account creation | 5 minutes | No — test keys available immediately |
| Email verification | 1-2 minutes | No |
| Test API keys | Instant after signup | **No — PRD 76 dev starts here** |
| KYC document upload | 10-15 minutes | No |
| KYC review & approval | 1-3 business days | Only blocks **live** payments |
| Live API keys | After KYC approval | Only needed for production |
| First FNB settlement | T+1 after first live payment | Only relevant in production |

**Key insight**: PRD 76 development can begin the same day you sign up. Test mode is fully functional without KYC approval.

---

## 1. Pre-Flight Checklist

Gather all of these **before** opening Paystack. Having everything ready avoids mid-signup delays.

### 1.1 SA Identity Document
- [ ] Valid South African ID book/card, passport, or driver's license
- [ ] Digital copy ready (photo or scan, clear and legible)
- [ ] File format: JPG, PNG, or PDF

### 1.2 FNB Bank Account Details
- [ ] Account number (your FNB cheque/savings account)
- [ ] Branch code: `250655` (universal FNB branch code)
- [ ] Account type (cheque or savings)

### 1.3 FNB Bank Confirmation Letter
- [ ] Must be **less than 6 months old**
- [ ] Free to generate — no bank visit needed

**How to get it via FNB App (recommended):**
1. Open the FNB App
2. Sign in with your username and password
3. Tap **Accounts** from the main menu
4. Select the specific account you'll use for Paystack
5. Look for **Account Confirmation Letter** or **Bank Letter**
6. Tap to download (PDF) — save to your device

**How to get it via FNB Online Banking:**
1. Log in to `https://www.online.fnb.co.za`
2. Go to **Accounts**
3. Select the account
4. Click **Settings**
5. Choose **Bank Letters** → **Account Confirmation Letter**
6. Download or email to yourself

### 1.4 Proof of Address
- [ ] Utility bill, bank statement, or municipal account
- [ ] Must be **less than 6 months old**
- [ ] Must show your name and physical address
- [ ] Digital copy ready (JPG, PNG, or PDF)

### 1.5 Contact Information
- [ ] South African mobile number (required for OTP verification)
- [ ] Email address (for account and notifications)

> **Vietnam location note**: You need an SA number that can receive SMS. Options: keep your SA SIM active with international roaming, use a VoIP service that receives SA SMS, or contact Paystack support (`support@paystack.com`) to discuss alternative verification if neither option works.

### 1.6 Business Information
Prepare these answers for the signup form:
- [ ] Business name: **StepLeague** (or your registered business name)
- [ ] Business category: **Software / Technology**
- [ ] Business description: e.g. "Fitness competition platform with per-league subscriptions"
- [ ] Website URL: your StepLeague domain (or placeholder if not live yet)

---

## 2. Signup Flow

### Step 2.1 — Open Registration
- Navigate to: `https://dashboard.paystack.com/#/signup`

### Step 2.2 — Fill Registration Form
| Field | Value |
|-------|-------|
| First name | Your legal first name (must match ID exactly) |
| Last name | Your legal last name (must match ID exactly) |
| Email | Your email address |
| Password | Strong password (save in password manager) |

### Step 2.3 — Select Country
- Select: **South Africa**

### Step 2.4 — Business Details
| Field | Value |
|-------|-------|
| Business name | StepLeague |
| What does your business do? | Fitness competition platform with per-league subscriptions |

### Step 2.5 — International Customers

> **CRITICAL**: When asked "Do you want to accept payments from international customers?" — select **Yes**.
>
> This enables Visa/Mastercard/Amex acceptance from customers worldwide. If you skip this, you can only accept SA-domiciled cards. Enabling later is possible but requires additional compliance review.

### Step 2.6 — Email Verification
1. Check your inbox for the Paystack verification email
2. Click the verification link
3. You'll be redirected to the Paystack Dashboard

**You now have a Paystack account with test mode access.**

---

## 3. Business Verification / KYC

### Recommended Business Type: Sole Proprietorship

| Business Type | Collection Limit | Documents Needed | Best For |
|--------------|-----------------|-----------------|----------|
| Starter Business | Low limit | ID, bank details, confirmation letter | Testing only |
| **Sole Proprietorship** | **Higher limit** | **ID, bank details, confirmation letter, proof of address** | **StepLeague launch** |
| Registered Business | No limit | All above + CIPC certificate + director info | Scale (upgrade later) |

**Sole Proprietorship** is recommended: higher collection limits than Starter, and no CIPC company registration certificate needed (unlike Registered Business). You can upgrade to Registered Business later when revenue grows.

### Step 3.1 — Navigate to Compliance
- Dashboard → **Settings** → **Business Settings** (or **Compliance** → **Profile**)

### Step 3.2 — Set Business Type
- Select: **Sole Proprietorship**

### Step 3.3 — Upload Identity Document
- Upload your SA ID / passport / driver's license
- Ensure the image is clear, all corners visible, not expired

### Step 3.4 — Enter Bank Details
| Field | Value |
|-------|-------|
| Bank | First National Bank (FNB) |
| Account number | Your FNB account number |
| Branch code | `250655` |
| Account type | Cheque or Savings (match your actual account) |

### Step 3.5 — Upload Bank Confirmation Letter
- Upload the FNB confirmation letter from Section 1.3
- Must be less than 6 months old

### Step 3.6 — Upload Proof of Address
- Upload the document from Section 1.4
- Must be less than 6 months old
- Name and address must be clearly visible

### Step 3.7 — Submit for Review
- Review all details for accuracy
- Click **Submit**
- KYC review takes **1-3 business days**

> **CRITICAL**: The name on your Paystack account, your ID document, and your FNB bank account must **all match exactly**. Any mismatch causes KYC rejection.

---

## 4. International Payments

If you selected "Yes" for international customers during signup (Step 2.5), this should already be enabled. If not:

### Fallback: Enable After Signup
1. Dashboard → **Settings** → **Preferences**
2. Find **International Payments**
3. Toggle to **Enable**
4. May require additional compliance review

### How International Payments Work for SA Businesses

| Aspect | Detail |
|--------|--------|
| Accepted cards | Visa, Mastercard, American Express |
| Customer experience | Customer pays in their local currency (USD, EUR, GBP, etc.) |
| Conversion | Paystack auto-converts to ZAR |
| Settlement | ZAR deposited to your FNB account |
| Settlement time | T+1 (next business day) |
| Fees | 3.1% + R1 per international transaction |

> **Limitation**: SA businesses cannot accept USD directly (only Nigeria and Kenya can). Customers always pay in their own currency, and you always receive ZAR. This is fine for StepLeague — your FNB account is ZAR.

---

## 5. Getting Test API Keys

Available **immediately** after signup — no KYC approval needed.

### Step 5.1 — Navigate to API Settings
- Dashboard → **Settings** → **API Keys & Webhooks**

### Step 5.2 — Ensure Test Mode
- Look for the **Test/Live** mode toggle at the top of the dashboard
- Ensure it shows **Test Mode** (orange/yellow indicator)
- The API Keys section should show "API Configuration — Test Mode"

### Step 5.3 — Copy Keys
| Key | Prefix | Use |
|-----|--------|-----|
| Test Public Key | `pk_test_...` | Client-side (Paystack.js checkout) |
| Test Secret Key | `sk_test_...` | Server-side (API calls, webhook verification) |

### Step 5.4 — Store in Environment
Add to `.env.local` in the StepLeague project root:

```env
# Paystack — Test Mode
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

> **Never commit `.env.local` to git.** It's already in `.gitignore`.

### Step 5.5 — Test Card Numbers
Use these in test mode (no real charges):

| Card Number | Type | Result |
|-------------|------|--------|
| `4084 0840 8408 4081` | Visa (SA) | Success |
| `5060 6666 6666 6666 666` | Verve | Success |

- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **PIN** (if prompted): Any 4 digits
- **OTP** (if prompted): Any value — test mode auto-approves

Refer to [Paystack Test Payments Documentation](https://paystack.com/docs/payments/test-payments/) for the full list.

---

## 6. Webhook Configuration (for PRD 76)

Webhooks are how Paystack notifies StepLeague about payment events. Configure now so the URL is ready when PRD 76 implements the handler.

### Step 6.1 — Set Webhook URL
1. Dashboard → **Settings** → **API Keys & Webhooks**
2. Scroll to **Webhook URL**
3. Enter: `https://[your-domain]/api/webhooks/paystack`
   - For local dev, use the Paystack CLI (Step 6.3) instead
   - For Vercel preview: `https://[branch].your-project.vercel.app/api/webhooks/paystack`

### Step 6.2 — Copy Webhook Secret
- Below the webhook URL, find the **Webhook Secret Key**
- Copy it to `.env.local` as `PAYSTACK_WEBHOOK_SECRET`
- This is used for HMAC signature verification (`x-paystack-signature` header)

### Step 6.3 — Local Development with Paystack CLI
For testing webhooks locally without exposing your dev server:

```bash
# Install Paystack CLI (if available) or use the dashboard webhook logs
# Alternative: use ngrok or similar tunneling tool
npx ngrok http 3000
# Then set the ngrok URL as your webhook URL in the dashboard
```

### Step 6.4 — Events to Listen For (PRD 76)

| Event | When It Fires | StepLeague Action |
|-------|--------------|-------------------|
| `charge.success` | Payment succeeds | Record in `payment_history`, activate/renew subscription |
| `subscription.create` | Subscription created | Update `league_subscriptions` status to `active` |
| `subscription.not_renew` | Customer cancels renewal | Set `cancel_at_period_end = true` |
| `subscription.disable` | Subscription deactivated | Update status to `canceled` or `expired` |
| `invoice.create` | New invoice generated | Log upcoming charge |
| `invoice.update` | Invoice status changes | Update payment tracking |
| `invoice.payment_failed` | Renewal payment fails | Start dunning/grace period flow |

### Step 6.5 — Webhook Handler Pattern (PRD 76 Reference)

The webhook endpoint will follow the `withApiHandler` pattern from the codebase:

```typescript
// POST /api/webhooks/paystack — implemented in PRD 76
export const POST = withApiHandler({
  auth: 'none',  // Webhooks are unauthenticated — verify via HMAC
  handler: async (req) => {
    // 1. Verify signature using PAYSTACK_WEBHOOK_SECRET
    // 2. Parse event type from request body
    // 3. Route to appropriate handler
    // 4. Update league_subscriptions / payment_history
    // 5. Return 200 (Paystack retries on non-200)
  }
});
```

---

## 7. Gotchas & Warnings

### 7.1 Name Matching (KYC Blocker)
All three must match exactly: Paystack account name, ID document name, FNB account name. Even small differences (middle name present/absent, abbreviations) can cause rejection.

### 7.2 SA Phone Number for OTP
Paystack sends OTP to your phone during signup and for dashboard actions. Since you're in Vietnam:
- **Best**: Keep SA SIM active with international roaming
- **Alternative**: Use a VoIP service that can receive SA SMS
- **Fallback**: Contact `support@paystack.com` to discuss alternatives

### 7.3 Vietnamese IP Address
Logging in from a Vietnamese IP is fine. Paystack verifies your business based on **registration country** (South Africa), not your physical location. No VPN needed.

### 7.4 Currency: ZAR Settlement Only
- Paystack settles in **ZAR** to your FNB account — always
- Customers pay in their local currency (USD, EUR, etc.)
- The PRD 74 schema stores `amount_cents` — for Paystack, this will be **ZAR cents**
- Tier prices displayed to users (USD) need a separate representation from settlement amounts (ZAR)
- **Decision for PRD 76**: How to handle the USD display price vs ZAR settlement amount in the schema

### 7.5 Subscription API: Two-Step Flow (Architecturally Significant)
Paystack's Subscriptions API requires a customer to have **at least one completed transaction** before a subscription can be created. This is because subscriptions use card authorizations from prior transactions.

**PRD 76 checkout flow must be:**
1. Initialize a one-time transaction (first payment)
2. Customer completes payment on Paystack checkout
3. `charge.success` webhook fires with `authorization_code`
4. Backend creates subscription using that authorization

This differs from Stripe/Paddle where subscription creation and first payment happen atomically. PRD 76 must account for this two-step pattern.

### 7.6 Sole Proprietorship Collection Limits
Sole Proprietorship has higher limits than Starter but is still capped. Monitor your collection total in the dashboard. When you approach the limit:
1. Dashboard → **Compliance** → **Profile**
2. Change business type to **Registered Business**
3. Upload CIPC certificate and director information

### 7.7 Test Mode ≠ Live Mode
Test and Live modes are **completely separate environments**. Plans, customers, subscriptions, and API keys created in test mode do not exist in live mode. When switching to production:
- Re-create all subscription plans in live mode
- Update `.env` variables to `pk_live_...` and `sk_live_...`
- Update webhook URL if different for production

### 7.8 No Paystack MCP Server
Unlike Paddle and Stripe, Paystack has no MCP server. All billing management is through the Dashboard UI or direct API calls. The API is clean enough that a lightweight MCP server could be built later if needed.

### 7.9 Webhook Idempotency
Paystack may send the same webhook event multiple times (retries on non-200 response). The PRD 76 webhook handler **must be idempotent** — processing the same event twice should not create duplicate records or charge customers twice. Use `external_subscription_id` and `external_transaction_id` as deduplication keys.

### 7.10 Bank Confirmation Letter Expiry
The FNB confirmation letter must be **less than 6 months old** at the time of KYC submission. If your KYC is delayed or you need to re-submit, generate a fresh letter.

---

## 8. Connection to PRD 76

This table maps signup outputs to PRD 76 implementation requirements:

| Signup Output | PRD 76 Consumption |
|--------------|-------------------|
| Test public key (`pk_test_...`) | Paystack.js checkout initialization on client |
| Test secret key (`sk_test_...`) | Server-side API calls (create plan, create subscription) |
| Webhook secret | HMAC signature verification in `/api/webhooks/paystack` |
| Webhook URL configured | Receives lifecycle events for state machine transitions |
| International payments enabled | Global customers can subscribe to leagues |

### Environment Variables (3 total)

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...  # or pk_live_... in production
PAYSTACK_SECRET_KEY=sk_test_...              # or sk_live_... in production
PAYSTACK_WEBHOOK_SECRET=whsec_...
```

### Provider Adapter Pattern

All Paystack-specific code should live in a provider adapter to preserve the migration path to Paddle:

```
src/lib/payments/paystack.ts    ← Paystack-specific API calls
src/lib/payments/types.ts       ← Provider-agnostic interfaces
```

The `league_subscriptions.metadata` JSONB column stores Paystack-specific data (plan codes, authorization codes), keeping the core columns provider-agnostic.

### Schema Mapping (PRD 74 → Paystack)

| PRD 74 Column | Paystack Equivalent |
|--------------|-------------------|
| `league_subscriptions.external_subscription_id` | Paystack subscription code |
| `league_subscriptions.external_customer_id` | Paystack customer code |
| `payment_history.external_payment_id` | Paystack transaction reference |
| `league_subscriptions.metadata` | `{ "paystack_plan_code": "PLN_xxx" }` (provider-specific data per subscription) |

---

## 9. Post-Signup Verification Checklist

After completing signup, verify each item:

- [ ] Can log in to Paystack Dashboard at `https://dashboard.paystack.com`
- [ ] Dashboard shows **Test Mode** toggle
- [ ] Test public key (`pk_test_...`) is visible in Settings → API Keys
- [ ] Test secret key (`sk_test_...`) is visible in Settings → API Keys
- [ ] International payments are enabled (check Settings → Preferences)
- [ ] Webhook URL is configured (check Settings → API Keys & Webhooks)
- [ ] Webhook secret is copied to `.env.local`
- [ ] All three keys are in `.env.local` and the dev server loads them
- [ ] Can initialize a test transaction using the test card (`4084 0840 8408 4081`)
- [ ] KYC documents are submitted (ID, bank confirmation, proof of address)
- [ ] Business type shows **Sole Proprietorship** in Compliance settings

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-31 | Initial | Created Paystack signup guide as PRD 76 prerequisite — covers pre-flight, signup, KYC, international payments, test keys, webhooks, gotchas, and PRD 76 connection |
