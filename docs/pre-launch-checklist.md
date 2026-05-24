# Nova — Pre-Launch Checklist

## Deployment

### Frontend (Vercel)
- [x] Auto-deploys from GitHub on push to `master`
- [x] `VITE_API_BASE_URL` set to `https://backend-mu-plum-54.vercel.app`
- [x] All routes work (`/`, `/dashboard/*`, auth pages, 404 page)
- [x] SPA rewrites configured in `vercel.json`

### Backend (Vercel)
- [x] Auto-deploys from GitHub on push to `master`
- [x] Environment variables set (DATABASE_URL, JWT_SECRET_KEY, CORS_ORIGINS, etc.)
- [x] Password reset tokens table migrated to Neon
- [x] Health endpoint returns `{"status":"ok"}`

### Database (Neon)
- [x] Tables: businesses, users, income, expenses, categories, invoices, subscriptions, billing_webhook_events, exchange_rates, password_reset_tokens
- [x] Indexes exist on foreign keys and date columns
- [x] Exchange rate cache works with unique constraint on `(from_currency, to_currency, rate_date)`
- [x] Password reset tokens persisted (not in-memory)

### Email (Resend)
- [x] RESEND_API_KEY configured
- [x] From address: `onboarding@resend.dev` (Resend free tier)
- [ ] ⚠️ **Before launch**: Verify a custom domain with Resend to use `nova@yourdomain.com`

## Rollback Plan

### If frontend breaks:
```bash
vercel rollback frontend-opal-eta-56.vercel.app --scope poethadar6-2929s-projects
```

### If backend breaks:
```bash
vercel rollback backend-mu-plum-54.vercel.app --scope poethadar6-2929s-projects
```

### If database breaks:
1. Neon has point-in-time recovery — use the Neon dashboard to restore
2. Or run `alembic downgrade -1` locally against the DB

### If everything breaks:
1. `git revert HEAD && git push` to revert to previous deploy
2. Rollback both Vercel projects
3. Restore Neon DB from backup

## Backup Plan

- [ ] **Before launch**: Take a Neon DB snapshot (manual or enable Continuous Backup)
- [ ] All environment variables are stored in `.env.local` (not committed)
- [ ] GitHub is the source of truth for code — there's no other backup
- [ ] Resend API key is in 1Password/Vault (save it if not already)

## Testing Checklist

### Auth
- [x] Registration with valid data works
- [x] Registration with short password (< 6 chars) rejected
- [x] Registration with duplicate email rejected
- [x] Login with correct credentials works
- [x] Login with wrong password returns friendly error
- [x] Login with nonexistent email returns friendly error
- [x] Forgot password sends email (or shows dev mode link)
- [x] Reset password with valid token works
- [x] Reset password with expired/invalid token rejected
- [x] Send 6-digit code works
- [x] Reset with code works
- [x] JWT token protects all `/dashboard/*` routes

### Dashboard
- [x] Empty state shows when no data exists
- [x] Loading skeleton shows while fetching
- [x] Stats (Income, Expenses, Profit) display correctly
- [x] Trend cards show ↑/↓/→ with percentage
- [x] Recent activity list works
- [x] Refresh button works
- [x] Onboarding checklist tracks progress
- [x] 404 page shows for unknown routes

### Income
- [x] Create income with amount, date, source
- [x] Edit income inline
- [x] Delete income with confirmation
- [x] Categorization works (auto/select)
- [x] CSV import works
- [x] Error handling for negative amounts

### Expenses
- [x] Create expense with amount, date, vendor
- [x] Edit expense inline
- [x] Delete expense with confirmation
- [x] Recurring flag works
- [x] Payment method field

### Transactions
- [x] Combined income + expense list
- [x] Filter by type (all/income/expense)
- [x] Filter by date range
- [x] Running balance column
- [x] Edit inline modal
- [x] Delete with confirmation dialog

### Reports
- [x] Monthly income/expense/profit breakdown
- [x] No longer gated behind Pro plan

### Multi-currency
- [x] Exchange rate API auto-converts on create
- [x] Fallback rates work if API is down
- [x] Rates cached in DB per currency-date pair
- [x] Dashboard uses converted amounts

### UX
- [x] Error messages are human-friendly (no raw Python errors)
- [x] Toast notifications for all actions (success/error)
- [x] Loading states on all pages
- [x] Empty states with helpful text and action buttons
- [x] Mobile responsive (600px breakpoint)
- [x] Dark mode toggle works throughout

### Security
- [x] Passwords hashed with bcrypt
- [x] JWT expires at 12 hours
- [x] Rate limiting on login (10/min), register (10/min), forgot password (3/min)
- [x] CORS restricted to frontend origin
- [x] Password reset tokens stored in DB (not in-memory)
- [x] Reset tokens expire after 30 minutes (link) / 15 minutes (code)
- [x] Secrets come from environment variables, not hardcoded
- [x] Password validation minimum 6 characters
- [x] No Pro/payment gates exposed in UI

## Known Issues (post-launch todo)
- [ ] Cents-based input is confusing — consider dollar input with automatic conversion
- [ ] No email verification for new registrations
- [ ] No account lockout after failed login attempts
- [ ] No 2FA
- [ ] CSV import requires specific header format — consider adding templates
- [ ] Reports UI is minimal — consider charts in v2

## Launch Day Steps

1. **Final DB backup** — take a Neon snapshot
2. **Test registration** — create a fresh account, go through full flow
3. **Test password reset** — verify email arrives (may not with `onboarding@resend.dev`)
4. **Monitor Vercel logs** — watch for 500 errors in the first hour
5. **Set up custom domain** — Vercel: add `nova.app` or similar. Resend: verify domain.
6. **Add analytics** — optional: Plausible, Umami, or just Vercel Analytics
7. **Share** — post on Product Hunt, Twitter, HN, Reddit r/SaaS

## Launch Readiness

| Area | Status |
|---|---|
| Authentication | ✅ Ready |
| Authorization | ✅ Ready |
| Income tracking | ✅ Ready |
| Expense tracking | ✅ Ready |
| Dashboard | ✅ Ready |
| Multi-currency | ✅ Ready |
| Reports | ✅ Ready |
| Invoices | ✅ Ready |
| Subscriptions | ✅ Ready |
| CSV import | ✅ Ready |
| Email (password reset) | ⚠️ Needs custom domain |
| Mobile experience | ⚠️ Basic (600px breakpoint) |
| Security | ✅ Ready |
| Error handling | ✅ Ready |

**Overall:** Launch ready. The two ⚠️ items are not blockers.
