from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional
from urllib.parse import urlencode

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from itsdangerous import BadSignature, URLSafeSerializer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import Badge, ContributionCache, Goal, User
from app.schemas import BadgeResponse, GoalCreate, GoalResponse, GoalUpdate

app = FastAPI(title="Open Source Contribution Tracker API")
serializer = URLSafeSerializer(settings.session_secret, salt="opensource-tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(request: Request, db: Session) -> User:
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = serializer.loads(session_cookie)
    except BadSignature as exc:
        raise HTTPException(status_code=401, detail="Invalid session") from exc
    user = db.get(User, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="Session user not found")
    return user


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    return get_current_user(request, db)


async def github_get(token: str, endpoint: str, params: dict | None = None) -> dict | list:
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(f"https://api.github.com{endpoint}", headers=headers, params=params)
        response.raise_for_status()
        return response.json()


@app.get("/")
def health_check() -> dict:
    return {"status": "ok", "service": "opensource-tracker-backend"}


@app.get("/auth/github/login")
def github_login() -> RedirectResponse:
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "read:user user:email repo",
    }
    return RedirectResponse(url=f"https://github.com/login/oauth/authorize?{urlencode(params)}", status_code=302)


@app.get("/auth/github/callback")
async def github_callback(
    code: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    if error:
        return RedirectResponse(url=f"{settings.frontend_url}/?oauth_error={error}", status_code=302)
    if not code:
        return RedirectResponse(url=f"{settings.frontend_url}/?oauth_error=missing_code", status_code=302)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": settings.github_redirect_uri,
                },
            )
            token_response.raise_for_status()
            access_token = token_response.json().get("access_token")
            if not access_token:
                return RedirectResponse(url=f"{settings.frontend_url}/?oauth_error=token_missing", status_code=302)
            gh_user = await github_get(access_token, "/user")
    except httpx.HTTPError as exc:
        _ = exc
        return RedirectResponse(url=f"{settings.frontend_url}/?oauth_error=github_auth_failed", status_code=302)

    user = db.scalar(select(User).where(User.github_id == str(gh_user["id"])))
    if not user:
        user = User(
            github_id=str(gh_user["id"]),
            github_username=gh_user["login"],
            email=gh_user.get("email"),
            avatar_url=gh_user.get("avatar_url"),
            access_token=access_token,
        )
        db.add(user)
    else:
        user.github_username = gh_user["login"]
        user.email = gh_user.get("email")
        user.avatar_url = gh_user.get("avatar_url")
        user.access_token = access_token
    db.commit()
    db.refresh(user)

    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard", status_code=302)
    response.set_cookie(
        key="session",
        value=serializer.dumps({"user_id": user.id}),
        httponly=True,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        max_age=settings.session_max_age_seconds,
    )
    return response


@app.get("/auth/me")
def auth_me(user: User = Depends(current_user)) -> dict:
    return {
        "id": user.id,
        "github_username": user.github_username,
        "avatar_url": user.avatar_url,
        "email": user.email,
    }


@app.post("/auth/logout")
def auth_logout() -> Response:
    response = Response(content='{"message":"Logged out"}', media_type="application/json")
    response.delete_cookie("session", samesite=settings.cookie_samesite)
    return response


@app.get("/github/profile")
async def github_profile(user: User = Depends(current_user)) -> dict:
    return await github_get(user.access_token, "/user")


@app.get("/github/repos")
async def github_repos(user: User = Depends(current_user)) -> list:
    repos = await github_get(user.access_token, "/user/repos", {"sort": "updated", "per_page": 20})
    return repos if isinstance(repos, list) else []


@app.get("/github/pull-requests")
async def github_pull_requests(user: User = Depends(current_user)) -> list:
    headers = {"Authorization": f"Bearer {user.access_token}", "Accept": "application/vnd.github+json"}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            search_response = await client.get(
                "https://api.github.com/search/issues",
                headers=headers,
                params={"q": f"author:{user.github_username} type:pr", "per_page": 30},
            )
            search_response.raise_for_status()
            payload = search_response.json()
            items = payload.get("items", []) if isinstance(payload, dict) else []

            enriched_items = []
            for item in items:
                pull_request_ref = item.get("pull_request", {}) if isinstance(item, dict) else {}
                pull_request_url = pull_request_ref.get("url")
                merged = False

                if pull_request_url:
                    pr_detail_response = await client.get(pull_request_url, headers=headers)
                    if pr_detail_response.status_code == 200:
                        pr_detail = pr_detail_response.json()
                        merged = bool(pr_detail.get("merged_at"))

                enriched_item = {
                    "id": item.get("id"),
                    "title": item.get("title"),
                    "state": item.get("state"),
                    "created_at": item.get("created_at"),
                    "merged": merged,
                }
                enriched_items.append(enriched_item)

            return enriched_items
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Failed to fetch pull requests") from exc


@app.get("/github/commits")
async def github_commits(user: User = Depends(current_user)) -> dict:
    # Estimate current-month commits authored by the authenticated user by
    # scanning the user's accessible repos with an author+since filter.
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat() + "Z"
    headers = {"Authorization": f"Bearer {user.access_token}", "Accept": "application/vnd.github+json"}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            repos_response = await client.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={"sort": "updated", "per_page": 25},
            )
            repos_response.raise_for_status()
            repos = repos_response.json()

            commit_count = 0
            for repo in repos if isinstance(repos, list) else []:
                full_name = repo.get("full_name")
                if not full_name:
                    continue

                commits_response = await client.get(
                    f"https://api.github.com/repos/{full_name}/commits",
                    headers=headers,
                    params={"author": user.github_username, "since": month_start, "per_page": 100, "page": 1},
                )
                if commits_response.status_code == 409:
                    # Empty repositories can return 409; skip those safely.
                    continue
                commits_response.raise_for_status()
                commits = commits_response.json()
                if isinstance(commits, list):
                    commit_count += len(commits)

            return {"username": user.github_username, "commit_count": commit_count}
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Failed to fetch commits summary") from exc


@app.get("/github/contributions")
async def github_contributions(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list:
    today = date.today()
    window_start = today - timedelta(days=29)
    rows = list(
        db.scalars(
            select(ContributionCache).where(
                ContributionCache.user_id == user.id,
                ContributionCache.date >= window_start,
                ContributionCache.date <= today,
            )
        )
    )

    by_date: Dict[date, ContributionCache] = {row.date: row for row in rows}

    # Refresh today's cache with lightweight live data from existing endpoints.
    prs = await github_pull_requests(user)
    todays_pr_count = len(
        [
            pr
            for pr in prs
            if isinstance(pr, dict)
            and pr.get("created_at")
            and str(pr.get("created_at", "")).startswith(today.isoformat())
        ]
    )
    commit_summary = await github_commits(user)
    todays_commit_count = int(commit_summary.get("commit_count", 0))

    today_row = by_date.get(today)
    if today_row is None:
        today_row = ContributionCache(
            user_id=user.id,
            date=today,
            pr_count=todays_pr_count,
            commit_count=todays_commit_count,
        )
        db.add(today_row)
        db.commit()
        db.refresh(today_row)
        by_date[today] = today_row
    else:
        today_row.pr_count = todays_pr_count
        today_row.commit_count = todays_commit_count
        db.commit()
        db.refresh(today_row)

    result = []
    current = window_start
    while current <= today:
        row = by_date.get(current)
        result.append(
            {
                "date": current.isoformat(),
                "pr_count": row.pr_count if row else 0,
                "commit_count": row.commit_count if row else 0,
            }
        )
        current += timedelta(days=1)

    return result


@app.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)) -> List[Dict[str, object]]:
    users = list(db.scalars(select(User)))
    rankings: List[Dict[str, object]] = []

    today = date.today()
    month_start = today.replace(day=1)
    for user in users:
        contribution_totals = db.execute(
            select(
                func.coalesce(func.sum(ContributionCache.pr_count), 0),
                func.coalesce(func.sum(ContributionCache.commit_count), 0),
            ).where(
                ContributionCache.user_id == user.id,
                ContributionCache.date >= month_start,
                ContributionCache.date <= today,
            )
        ).one()
        pr_total = int(contribution_totals[0] or 0)
        commit_total = int(contribution_totals[1] or 0)

        badge_count = db.scalar(select(func.count(Badge.id)).where(Badge.user_id == user.id)) or 0
        completed_goals = (
            db.scalar(
                select(func.count(Goal.id)).where(
                    Goal.user_id == user.id,
                    Goal.current_progress >= Goal.monthly_pr_target,
                )
            )
            or 0
        )

        points = (pr_total * 3) + commit_total + (int(badge_count) * 10) + (int(completed_goals) * 20)
        rankings.append({"username": user.github_username, "points": points})

    rankings.sort(key=lambda item: int(item["points"]), reverse=True)
    if not rankings:
        return []
    return [
        {"rank": idx + 1, "username": row["username"], "points": row["points"]}
        for idx, row in enumerate(rankings[:20])
    ]


@app.get("/goals", response_model=List[GoalResponse])
def list_goals(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Goal]:
    return list(db.scalars(select(Goal).where(Goal.user_id == user.id)))


@app.post("/goals", response_model=GoalResponse)
def create_goal(payload: GoalCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Goal:
    goal = Goal(user_id=user.id, monthly_pr_target=payload.monthly_pr_target, current_progress=payload.current_progress)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@app.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: int, payload: GoalUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Goal:
    goal = db.get(Goal, goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    if payload.monthly_pr_target is not None:
        goal.monthly_pr_target = payload.monthly_pr_target
    if payload.current_progress is not None:
        goal.current_progress = payload.current_progress
    db.commit()
    db.refresh(goal)
    return goal


@app.get("/badges", response_model=List[BadgeResponse])
def list_badges(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Badge]:
    return list(db.scalars(select(Badge).where(Badge.user_id == user.id)))


@app.post("/badges/calculate", response_model=List[BadgeResponse])
def calculate_badges(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Badge]:
    goals = list(db.scalars(select(Goal).where(Goal.user_id == user.id)))
    for goal in goals:
        if goal.current_progress >= goal.monthly_pr_target:
            existing = db.scalar(select(Badge).where(Badge.user_id == user.id, Badge.badge_name == "Goal Crusher"))
            if not existing:
                db.add(Badge(user_id=user.id, badge_name="Goal Crusher", description="Completed monthly PR target."))
    db.commit()
    return list(db.scalars(select(Badge).where(Badge.user_id == user.id)))


