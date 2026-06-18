# Nova — Pre-Launch Checklist

## Deployment

### Frontend (Vercel)
- [x] Auto-deploys from GitHub on push to `master`
- [x] `VITE_API_BASE_URL` set to `https://backend-mu-plum-54.vercel.app`
- [x] All routes work (`/`, `/dashboard/*`, auth pages, 404 page)
- [x] SPA rewrites configured in `vercel.json`
- [x] Premium UI redesign live (Linear/Apple/Notion-inspired)
- [x] Loading spinner shown during auth load (no more blank screen)
- [x] No `console.log` in production code

### Backend (Vercel)
- [x] Auto-deploys from GitHub on push to `master`
- [x] Environment variables set (DATABASE_URL, JWT_SECRET_KEY, CORS_ORIGINS, etc.)
- [x] Password reset tokens table migrated to Neon
- [x] Health endpoint returns `{"status":"ok"}`
- [x] JWT secret must be set via env var (no default fallback)
- [x] App debug defaults to `False`

### Database (Neon)
- [x] Tables: businesses, users, income, expenses, categories, invoices, subscriptions, billing_webhook_events, exchange_rates, password_reset_tokens
- [x] Indexes exist on foreign keys and date columns
- [x] Exchange rate cache works with unique constraint on `(from_currency, to_currency, rate_date)`
- [x] Password reset tokens persisted (not in-memory)
- [x] Alembic migrations 0001–0004 applied

### Email (SendGrid)
- [ ] ⚠️ **Before launch**: Set `SENDGRID_API_KEY` on Vercel backend env vars
- [ ] ⚠️ **Before launch**: Remove `RESEND_API_KEY` from Vercel backend env vars
- [ ] **If verifying from address**: SendGrid free tier can send from any single sender identity — verify `poethadar6@gmail.com` in SendGrid dashboard

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
- [ ] All environment variables are stored in `.env` (gitignored, permissions 600)
- [ ] GitHub is the source of truth for code — there's no other backup
- [ ] SendGrid API key saved in a password manager

## Testing Checklist

### Auth
- [x] Registration with valid data works (auto-verified until SendGrid is set)
- [x] Registration with short password (< 8 chars) rejected
- [x] Registration with duplicate email rejected
- [x] Login with correct credentials works
- [x] Login with wrong password returns friendly error
- [x] Login with nonexistent email returns friendly error
- [x] Forgot password sends 6-digit code via email (dev fallback shows code)
- [x] Reset password with valid code works
- [x] Reset password with expired/invalid code rejected
- [x] Send 6-digit code again via resend endpoint
- [x] JWT token protects all `/dashboard/*` routes
- [x] JWT expires after 12 hours (forces re-login)
- [x] Account lockout after 5 failed login attempts (15 min cooldown)
- [x] Email verification flow (verify email, resend verification)
- [x] Password min length 8 enforced on all password fields

### Dashboard
- [x] Empty state shows when no data exists
- [x] Loading skeleton shows while fetching
- [x] Animated stat counters (income, expenses, profit)
- [x] Trend badges (↑/↓/→ with percentage)
- [x] Recent activity list works
- [x] Refresh button works
- [x] Onboarding checklist tracks progress
- [x] 404 page shows for unknown routes
- [x] Sidebar with SVG icons, premium business selector, logout button

### Income
- [x] Create income with amount, date, source (dollar input, stored in cents)
- [x] Edit income inline
- [x] Delete income with confirmation
- [x] Categorization works (auto/select)
- [x] CSV import works
- [x] Error handling for negative amounts

### Expenses
- [x] Create expense with amount, date, vendor (dollar input, stored in cents)
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
- [x] CSV export works
- [x] Not gated behind any plan

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
- [x] Dark mode toggle works throughout (SVG sun/moon toggle)
- [x] Landing page: premium glass nav, gradient hero text, SVG mockup, testimonials

### Security
- [x] Passwords hashed with bcrypt
- [x] JWT expires at 12 hours (was 30 days)
- [x] JWT secret must be set via env var (no default fallback)
- [x] Rate limiting on login (10/min), register (10/min), forgot password (3/min)
- [x] Rate limiter respects X-Forwarded-For (Vercel proxy)
- [x] CORS restricted to frontend origin
- [x] Password reset tokens stored in DB (not in-memory)
- [x] Reset tokens expire after 30 minutes (link) / 15 minutes (code)
- [x] Secrets come from environment variables, never hardcoded
- [x] Password validation minimum 8 characters
- [x] Account locked after 5 failed attempts (15 min)
- [x] Email verification infrastructure ready
- [x] No Pro/payment gates exposed in UI
- [x] ForgotPasswordPage does not reveal whether email exists

## Known Issues (post-launch todo)
- [ ] No 2FA
- [ ] CSV import requires specific header format — consider adding templates
- [ ] Reports UI is minimal — consider charts in v2
- [ ] Email verification auto-skips users until SendGrid key is live
- [ ] Deprecation warnings: `datetime.utcnow()`, `on_event` — non-blocking

## Launch Day Steps

1. **Set SendGrid API key** on Vercel backend env vars
2. **Remove RESEND_API_KEY** from Vercel backend env vars
3. **Take a Neon DB snapshot** (manual or enable Continuous Backup)
4. **Test registration** — create a fresh account, go through full flow
5. **Test password reset** — verify email arrives via SendGrid
6. **Test verify email flow** — confirm verification email arrives and link works
7. **Monitor Vercel logs** — watch for 500 errors in the first hour
8. **Add analytics** — optional: Plausible, Umami, or just Vercel Analytics
9. **Share** — post on Product Hunt, Twitter, HN, Reddit r/SaaS

## Launch Readiness

| Area | Status |
|---|---|
| Authentication | ✅ Ready |
| Authorization | ✅ Ready |
| Income tracking | ✅ Ready |
| Expense tracking | ✅ Ready |
| Dashboard | ✅ Ready (premium UI) |
| Multi-currency | ✅ Ready |
| Reports | ✅ Ready (CSV export included) |
| Invoices | ✅ Ready |
| Subscriptions | ✅ Ready |
| CSV import | ✅ Ready |
| Email (password reset, verify) | ⚠️ Needs SendGrid API key on Vercel |
| UI/UX | ✅ Ready (premium redesign complete) |
| Security | ✅ Ready (audit blockers fixed) |
| Error handling | ✅ Ready |
| Loading states | ✅ Ready (spinner, skeleton, shimmer) |

**Overall:** Launch ready. The ⚠️ email item is the last env var config step on Vercel.
