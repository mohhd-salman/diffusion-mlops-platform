from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    github_id: int
    username: str
    email: Optional[str]
    avatar_url: Optional[str]
    role: str
    is_active: int
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        orm_mode = True
