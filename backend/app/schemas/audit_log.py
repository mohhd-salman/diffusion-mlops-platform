from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    event: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
