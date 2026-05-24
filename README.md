# Business Clarity SaaS (Production-ready MVP)

Multi-tenant financial tracking SaaS for SMBs with FastAPI, PostgreSQL, React, and Lemon Squeezy billing.

## Deployment targets
- Backend: Render or Railway
- Frontend: Vercel
- Database: Neon or Supabase Postgres

## Backend deployment (Render/Railway)
1. Provision PostgreSQL and copy connection string to `DATABASE_URL`.
2. Set backend env vars from `backend/.env.example`.
3. Run migrations before app start:
   ```bash
   cd backend
   alembic upgrade head
   ```
4. Start server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

Notes:
- `/health` is available for platform health checks.
- CORS is controlled via `CORS_ORIGINS` (comma-separated).
- `render.yaml` and `railway.json` are included.

## Frontend deployment (Vercel)
1. Set `VITE_API_BASE_URL` to your deployed backend URL.
2. Build command: `npm run build`
3. Output dir: `dist`
4. SPA routing is handled by `frontend/vercel.json` rewrite.

## Local verification

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run build
npm run dev
```

## Launch readiness checklist
- [ ] Register/login works in production URL
- [ ] Business create/select works
- [ ] Income/expense/invoice/subscription CRUD works
- [ ] Dashboard metrics update with real data
- [ ] Pricing page `/pricing` renders and converts
- [ ] Lemon checkout redirects successfully
- [ ] Lemon webhook updates `plan`, `subscription_status`, `provider`, `provider_customer_id`
- [ ] Reports are Pro-gated and export works
- [ ] Multi-tenant isolation verified with two businesses/users
- [ ] Alembic migration chain runs cleanly from zero (`alembic upgrade head`)

## Product UX readiness
- Friendly empty states are present across dashboard + CRUD pages
- Onboarding checklist appears on dashboard
- Invite link and demo link are copyable from dashboard
- Bubble cards include readable hierarchy, hover feedback, loading skeletons

## Plan model
- Free: limited records
- Starter ($10): full tracking
- Pro ($20): reports + export
