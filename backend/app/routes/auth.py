from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
import httpx
from jose import jwt
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from app.models import User, AuditLog
from app.dependencies import get_db
from app.utils.security import encrypt_token, get_current_user
from app.schemas.user import UserResponse
from app.config import (
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    JWT_SECRET,
    JWT_ALGORITHM,
    FRONTEND_URL,
    BACKEND_URL,
)

router = APIRouter()

@router.get("/auth/github/login")
def github_login():
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/auth/github/callback",
        "scope": "read:user user:email repo",
    }
    github_url = "https://github.com/login/oauth/authorize?" + urlencode(params)
    return RedirectResponse(url=github_url)


@router.get("/auth/github/callback")
async def github_callback(code: str, request: Request, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback and create/update user in DB."""
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )

        if token_res.status_code != 200:
            db.add(AuditLog(user_id=None, event="login_failed",
                            ip_address=request.client.host,
                            user_agent=request.headers.get("user-agent")))
            db.commit()
            raise HTTPException(status_code=400, detail="GitHub token exchange failed")

        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub token missing")

        user_res = await client.get("https://api.github.com/user",
                                    headers={"Authorization": f"token {access_token}"})
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch GitHub profile")
        profile = user_res.json()

        if not profile.get("email"):
            email_res = await client.get("https://api.github.com/user/emails",
                                         headers={"Authorization": f"token {access_token}"})
            emails = email_res.json()
            profile["email"] = next((e["email"] for e in emails if e.get("primary")), None)

    user = db.query(User).filter_by(github_id=profile["id"]).first()
    if not user:
        user = User(
            github_id=profile["id"],
            username=profile["login"],
            email=profile.get("email"),
            avatar_url=profile.get("avatar_url"),
            github_access_token=encrypt_token(access_token),
            last_login=datetime.now(timezone.utc),
        )
        db.add(user)
    else:
        user.username = profile["login"]
        user.email = profile.get("email")
        user.avatar_url = profile.get("avatar_url")
        user.github_access_token = encrypt_token(access_token)
        user.last_login = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    db.add(AuditLog(user_id=user.id, event="login_success",
                    ip_address=request.client.host,
                    user_agent=request.headers.get("user-agent")))
    db.commit()

    # Issue JWT
    payload = {
        "user_id": user.id,
        "username": user.username,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    jwt_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    # Return with secure cookie
    response = RedirectResponse(url=f"{FRONTEND_URL}/projects")
    response.set_cookie("access_token", jwt_token,
                        httponly=True, secure=False, samesite="Lax",
                        max_age=7 * 24 * 60 * 60)
    return response


@router.get("/auth/me", response_model=UserResponse)
def auth_me(current_user: User = Depends(get_current_user)):
    """Return current logged-in user info (from JWT)."""
    return current_user


@router.post("/auth/logout")
def logout(response: JSONResponse):
    # Clear the JWT cookie
    response = JSONResponse(content={"ok": True, "message": "Logged out successfully"})
    response.delete_cookie("access_token")
    return response
