# Business Clarity Dashboard - MVP Blueprint

## 1) Product Specification

### MVP Features
- Unified dashboard with: monthly income, monthly expenses, profit/loss, open invoices, recurring subscriptions.
- Manual transaction capture: add income and expense items quickly.
- Invoice tracking with statuses: draft, sent, overdue, paid.
- Recurring subscription tracking (monthly/yearly) and upcoming charges.
- Monthly trend graph for income/expense/profit for last 6 months.
- Lightweight category system for income/expense classification.

### V1 (Post-MVP) Features
- Bank CSV import with basic mapping assistant.
- Stripe/PayPal connection for auto-income and invoice reconciliation.
- Smart alerts: unusual spend spikes, low cash month warning.
- Multi-user role support inside a business.
- Mobile-first PWA improvements and notification center.

### Target Users
- Freelancers and solo founders.
- Agencies (2-50 people) with project-based billing.
- SMB owners without accounting training.
- Online businesses with recurring SaaS costs.

### Core Problems Solved
- "How much money did I really make this month?"
- "What fixed subscriptions are eating margin?"
- "Which invoices are still unpaid?"
- "Are we doing better or worse than last month?"

## 2) User Flow Design

### Onboarding Flow
1. Sign up with email/password.
2. Create first business (name, country, currency).
3. Show 3-card setup checklist: add income, add expense, add first invoice.
4. Land on dashboard with empty-state guidance.

### First-time Setup Flow
1. Add categories from templates (Sales, Services, Software, Marketing, Payroll).
2. Add first 5-10 transactions (quick entry).
3. Add recurring subscriptions.
4. Add open invoices.
5. Dashboard transitions from empty to real metrics.

### Daily Usage Flow
1. Open dashboard.
2. See "today summary" and quick actions.
3. Add new income/expense in under 10 seconds.
4. Mark invoices paid when payment arrives.

### Monthly Review Flow
1. Open Reports page.
2. Compare current month vs prior month.
3. Review top categories and subscriptions.
4. Export simple monthly summary (future V1).

## 3) UI/UX Structure

### Design Principles
- Minimal cards + clear numbers first.
- One primary action per screen.
- Avoid accounting jargon (use plain language).

### Dashboard
- Components: KPI cards, trend chart, unpaid invoices list, upcoming subscription list, quick-add buttons.
- Data shown: MTD income, MTD expenses, MTD profit/loss, unpaid invoice total.
- Behavior: date-range toggle (month/quarter), click KPI drills into source page.

### Income Page
- Components: transaction table, add-income modal, filters by category/date.
- Data: source, amount, date, category, notes.
- Behavior: inline edit amount/category for speed.

### Expense Page
- Components: expense table, add-expense modal, recurring tag indicator.
- Data: vendor, amount, date, category, payment method.
- Behavior: mark as recurring -> suggest subscription creation.

### Invoices Page
- Components: invoice list, status pills, create invoice drawer.
- Data: client, amount, due date, issue date, status.
- Behavior: status transitions (draft->sent->paid/overdue).

### Subscriptions Page
- Components: recurring list, next charge calendar strip, monthly run-rate stat.
- Data: provider, amount, billing cycle, next billing date.
- Behavior: auto-flag if next charge within 7 days.

### Reports Page
- Components: monthly trend chart, category breakdown, month-over-month stat cards.
- Data: 6-12 month aggregates.
- Behavior: period selector, CSV export in V1.

## 4) PostgreSQL Schema (Production-ready MVP)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, kind, name)
);

CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  occurred_on DATE NOT NULL,
  source TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  occurred_on DATE NOT NULL,
  vendor TEXT,
  payment_method TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  issued_on DATE NOT NULL,
  due_on DATE NOT NULL,
  paid_on DATE,
  status TEXT NOT NULL CHECK (status IN ('draft','sent','paid','overdue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, invoice_number)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
  start_date DATE NOT NULL,
  next_billing_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX idx_income_business_date ON income(business_id, occurred_on DESC);
CREATE INDEX idx_expenses_business_date ON expenses(business_id, occurred_on DESC);
CREATE INDEX idx_invoices_business_status_due ON invoices(business_id, status, due_on);
CREATE INDEX idx_subscriptions_business_next ON subscriptions(business_id, next_billing_date);
CREATE INDEX idx_categories_business_kind ON categories(business_id, kind);
```

## 5) Backend Architecture (FastAPI)

- API layer (`app/api`): request/response wiring only.
- Service layer (`app/services`): business logic + aggregation.
- Models (`app/models`): SQLAlchemy entities.
- Schemas (`app/schemas`): Pydantic contracts.
- Auth: JWT bearer tokens for stateless MVP APIs.

### Route Structure
- `POST /auth/register`
- `POST /auth/login`
- `GET /dashboard/summary`
- `GET /income`, `POST /income`
- `GET /expenses`, `POST /expenses`
- `GET /invoices`, `POST /invoices`, `PATCH /invoices/{id}/status`
- `GET /subscriptions`, `POST /subscriptions`
- `GET /reports/monthly`

## 6) Frontend Architecture (React)

- Routing via React Router.
- Feature folders: `pages`, `components`, `services`, `hooks`.
- State approach: server state via TanStack Query, local UI state in component state.
- Dashboard fetch strategy: single `/dashboard/summary` endpoint for above-the-fold metrics.

## 7) Core Feature Logic

- Profit/Loss: `sum(income) - sum(expenses)` by period.
- Monthly aggregation: group transactions by `DATE_TRUNC('month', occurred_on)`.
- Recurring tracking: active subscriptions by `next_billing_date`; roll next date after charge.
- Invoice status tracking:
  - `paid` if `paid_on` exists.
  - `overdue` if `due_on < today` and not paid.
  - otherwise `draft` or `sent`.

## 8) Monetization Strategy

- Free ($0): 1 business, 100 records/month, basic dashboard, 3-month history.
- Pro ($19): unlimited records, invoice workflows, 12-month reports, recurring tracker.
- Business ($49): multi-user, priority support, advanced exports/integrations.

## 9) Differentiation

- Faster than QuickBooks/Xero: health snapshot in under 10 seconds.
- Simpler than spreadsheets: structured, automated totals without formulas.
- Non-accountant language: "money in", "money out", "left over".
