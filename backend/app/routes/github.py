from fastapi import APIRouter, Depends, HTTPException, Query, status
import httpx
from sqlalchemy.orm import Session
from app.models import User
from app.dependencies import get_db
from app.utils.security import decrypt_token, get_current_user
from typing import List

router = APIRouter()


@router.get("/repos")
async def list_github_repos(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    include_forks: bool = Query(False),
    include_archived: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch authenticated user's GitHub repos."""
    if not current_user.github_access_token:
        raise HTTPException(status_code=400, detail="No GitHub token found")

    try:
        token = decrypt_token(current_user.github_access_token)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt GitHub token")

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/user/repos?page={page}&per_page={per_page}",
            headers={"Authorization": f"token {token}"}
        )

    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code,
                            detail=res.json().get("message", "GitHub API error"))

    repos = res.json()
    return [
        {
            "name": r["name"],
            "full_name": r["full_name"],
            "html_url": r["html_url"],
            "private": r["private"],
            "default_branch": r.get("default_branch", "main"),
        }
        for r in repos if (include_forks or not r.get("fork")) and (include_archived or not r.get("archived"))
    ]


@router.get("/repos/{owner}/{repo}/branches", response_model=List[str])
async def list_github_branches(
    owner: str, repo: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch all branches for a given repo."""
    if not current_user.github_access_token:
        raise HTTPException(status_code=400, detail="No GitHub token found")

    try:
        token = decrypt_token(current_user.github_access_token)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt GitHub token")

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/branches",
            headers={"Authorization": f"token {token}"}
        )

    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail="Failed to fetch branches")

    return [b["name"] for b in res.json()]
