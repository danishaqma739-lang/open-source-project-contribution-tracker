# Open Source Project Contribution Tracker

A full-stack platform where developers authenticate with GitHub, track pull requests and commits, manage monthly goals, earn badges, and compare progress on a leaderboard.

## Tech Stack

- Frontend: React 18 + TypeScript + Vite + React Router + React Query + Axios
- Backend: FastAPI + SQLAlchemy 2.0 + Alembic + httpx
- Database: PostgreSQL
- Auth: GitHub OAuth 2.0 with backend-managed httpOnly session cookie
- Deployment target: Vercel (frontend) + Railway (backend)

## Project Structure

```text
opensource-tracker/
├── frontend/
├── backend/
└── README.md
```

## Backend Setup

1. Go to backend:
   - `cd backend`
2. Create and activate virtual environment:
   - `python -m venv .venv`
   - Windows bash: `source .venv/Scripts/activate`
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Create env file:
   - `cp .env.example .env` (or create `.env` manually on Windows)
5. Run migrations:
   - `alembic upgrade head`
6. Start API:
   - `uvicorn app.main:app --reload`

Backend default URL: `http://localhost:8001`

Health check:
- `GET /`

## Frontend Setup

1. Open a second terminal:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Configure env:
   - copy `.env.example` to `.env`
4. Start frontend:
   - `npm run dev`

Frontend default URL: `http://localhost:5173`

## PostgreSQL Setup

1. Create a database named `opensource_tracker`.
2. Update backend `.env`:
   - `DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/opensource_tracker`
3. Run Alembic:
   - `alembic upgrade head`

Tables included:
- `users`
- `goals`
- `badges`
- `contribution_cache`

## GitHub OAuth Setup

1. Create a GitHub OAuth App in GitHub Developer Settings.
2. Set callback URL:
   - `http://localhost:8001/auth/github/callback`
3. Add to backend `.env`:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_REDIRECT_URI`
   - `SESSION_SECRET`
   - `FRONTEND_URL`

Flow:
- `GET /auth/github/login`
- `GET /auth/github/callback`

Access token is stored on backend only and never exposed to frontend. Session is maintained with an httpOnly cookie.

## API Endpoints

- Health: `GET /`
- Auth:
  - `GET /auth/github/login`
  - `GET /auth/github/callback`
- GitHub proxy:
  - `GET /github/profile`
  - `GET /github/repos`
  - `GET /github/pull-requests`
  - `GET /github/commits`
  - `GET /github/contributions`
- Goals:
  - `GET /goals`
  - `POST /goals`
  - `PUT /goals/{goal_id}`
- Badges:
  - `GET /badges`
  - `POST /badges/calculate`
- Leaderboard:
  - `GET /leaderboard`

## Environment Variables

Backend (`backend/.env`):

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/opensource_tracker
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:8001/auth/github/callback
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
SESSION_MAX_AGE_SECONDS=604800
```

Cookie settings notes:
- `COOKIE_SECURE=false` for local HTTP development.
- Set `COOKIE_SECURE=true` in production (HTTPS only).
- `COOKIE_SAMESITE` supports `lax`, `strict`, or `none` (use `none` only with HTTPS + secure cookies).

Frontend (`frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8001
```

## Run Locally

1. Start PostgreSQL.
2. Start backend (`uvicorn app.main:app --reload --port 8001`).
3. Start frontend (`npm run dev`).
4. Open frontend URL and sign in with GitHub.

## Deployment (Vercel + Railway)

### Frontend (Vercel)

- `frontend/vercel.json` is included for SPA route rewrites.
- Set `VITE_API_BASE_URL` in Vercel environment variables to your Railway backend URL.

### Backend (Railway)

- `backend/Dockerfile` and `backend/Procfile` are included.
- Set Railway environment variables:
  - `DATABASE_URL`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_REDIRECT_URI` (your deployed backend callback URL)
  - `FRONTEND_URL` (your deployed frontend URL)
  - `SESSION_SECRET`
- Run migrations in Railway shell/release phase:
  - `alembic upgrade head`

## Release Checklist

- Rotate `GITHUB_CLIENT_SECRET` and keep it only in `backend/.env` / hosting secrets.
- Confirm callback URL exactly matches deployment backend URL:
  - `https://<your-backend-domain>/auth/github/callback`
- Set production cookie envs:
  - `COOKIE_SECURE=true`
  - `COOKIE_SAMESITE=lax` (or `none` only if cross-site is required and HTTPS is enabled)
- Verify health endpoint:
  - `GET /` returns `200`
- Verify login flow:
  - login -> callback -> dashboard -> logout -> login page
- Verify goals and badges:
  - create/update goal, run `Calculate Badges`, refresh and confirm persistence
- Verify dashboard data:
  - profile, PRs, commits, contributions load without errors
- Run local checks before deploy:
  - `frontend: npm run build`
  - `backend: python -m compileall app`

## Notes on UI/Data

- Dashboard and pages are wired for API-first usage.
- Fallback dummy data is used in frontend components when API data is unavailable, so UI can be previewed before full backend integration.

## Future Improvements

- Replace placeholder commit aggregation with GitHub GraphQL contribution queries
- Add refresh tokens and stronger encrypted token-at-rest strategy
- Add test coverage (unit + integration + e2e)
- Add background jobs for contribution cache updates
- Improve badge engine with streak and milestone rules
- Add production session storage (Redis) and secure cookies in production mode
