from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from collections import Counter
from datetime import datetime
from typing import Any

app = FastAPI(title="CP Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CF_API_BASE = "https://codeforces.com/api"
HTTP_TIMEOUT = 15.0


async def cf_get(client: httpx.AsyncClient, method: str, **params) -> dict[str, Any]:
    """Generic helper that calls a Codeforces API method and returns the result."""
    url = f"{CF_API_BASE}/{method}"
    response = await client.get(url, params=params, timeout=HTTP_TIMEOUT)
    response.raise_for_status()
    data = response.json()
    if data.get("status") != "OK":
        raise HTTPException(
            status_code=404,
            detail=data.get("comment", "Codeforces API returned a non-OK status."),
        )
    return data["result"]


@app.get("/api/user/{handle}")
async def get_user_dashboard(handle: str):
    """
    Aggregates Codeforces user data into a single dashboard payload:
      - Profile info  (rating, max rating, rank, avatar)
      - Rating history (for line chart)
      - Problem tag frequency from accepted submissions (for pie/radar chart)
    """
    async with httpx.AsyncClient() as client:

        # ── 1. User profile ──────────────────────────────────────────────────
        try:
            user_info_result = await cf_get(client, "user.info", handles=handle)
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=404, detail=f"Handle '{handle}' not found on Codeforces."
            )

        if not user_info_result:
            raise HTTPException(
                status_code=404, detail=f"Handle '{handle}' not found on Codeforces."
            )

        user = user_info_result[0]
        profile = {
            "handle": user.get("handle"),
            "firstName": user.get("firstName", ""),
            "lastName": user.get("lastName", ""),
            "rank": user.get("rank", "unrated"),
            "maxRank": user.get("maxRank", "unrated"),
            "rating": user.get("rating", 0),
            "maxRating": user.get("maxRating", 0),
            "avatar": user.get("titlePhoto") or user.get("avatar"),
            "country": user.get("country", ""),
            "organization": user.get("organization", ""),
            "contribution": user.get("contribution", 0),
            "friendOfCount": user.get("friendOfCount", 0),
            "registrationTimeSeconds": user.get("registrationTimeSeconds", 0),
        }

        # ── 2. Rating history ─────────────────────────────────────────────────
        try:
            rating_history_raw = await cf_get(client, "user.rating", handle=handle)
        except Exception:
            rating_history_raw = []

        rating_history = [
            {
                "contestName": entry.get("contestName", "Unknown"),
                "contestId": entry.get("contestId"),
                "rank": entry.get("rank"),
                "oldRating": entry.get("oldRating", 0),
                "newRating": entry.get("newRating", 0),
                "ratingChange": entry.get("newRating", 0) - entry.get("oldRating", 0),
                "date": datetime.utcfromtimestamp(
                    entry.get("ratingUpdateTimeSeconds", 0)
                ).strftime("%Y-%m-%d"),
            }
            for entry in rating_history_raw
        ]

        # ── 3. Accepted submissions → tag frequency ───────────────────────────
        try:
            submissions_raw = await cf_get(
                client, "user.status", handle=handle, from_=1, count=10000
            )
        except Exception:
            submissions_raw = []

        tag_counter: Counter = Counter()
        solved_problem_keys: set[str] = set()

        for sub in submissions_raw:
            if sub.get("verdict") != "OK":
                continue
            problem = sub.get("problem", {})
            # Deduplicate by problem identifier
            contest_id = problem.get("contestId", "")
            index = problem.get("index", "")
            problem_key = f"{contest_id}{index}"
            if problem_key in solved_problem_keys:
                continue
            solved_problem_keys.add(problem_key)
            for tag in problem.get("tags", []):
                tag_counter[tag] += 1

        # Top 10 tags, sorted descending
        top_tags = [
            {"tag": tag, "count": count}
            for tag, count in tag_counter.most_common(10)
        ]

        # ── 4. Submission verdict distribution ────────────────────────────────
        verdict_counter: Counter = Counter()
        for sub in submissions_raw:
            verdict = sub.get("verdict", "UNKNOWN")
            verdict_counter[verdict] += 1

        verdict_dist = [
            {"verdict": verdict, "count": count}
            for verdict, count in verdict_counter.most_common()
        ]

        # ── 5. Problems solved by rating bucket ───────────────────────────────
        rating_bucket: Counter = Counter()
        for sub in submissions_raw:
            if sub.get("verdict") != "OK":
                continue
            problem = sub.get("problem", {})
            contest_id = problem.get("contestId", "")
            index = problem.get("index", "")
            problem_key = f"{contest_id}{index}"
            pr = problem.get("rating")
            if pr:
                # Round to nearest 100-wide bucket
                bucket = (pr // 100) * 100
                rating_bucket[bucket] += 1

        problems_by_rating = [
            {"rating": str(r), "count": c}
            for r, c in sorted(rating_bucket.items())
        ]

        return {
            "profile": profile,
            "ratingHistory": rating_history,
            "tagDistribution": top_tags,
            "verdictDistribution": verdict_dist,
            "problemsByRating": problems_by_rating,
            "totalSolved": len(solved_problem_keys),
            "totalContests": len(rating_history),
        }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
