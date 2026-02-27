from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import enum
from app.schemas.deployment import DeploymentResponse

# ---------------------------------------------------
# ENUM for Project Status
# ---------------------------------------------------
class ProjectStatus(str, enum.Enum):
    active = "active"
    archived = "archived"

class ProjectCreate(BaseModel):
    """Schema for creating a new project."""
    repo_full_name: str
    branch: str
    repo_url: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = ProjectStatus.active  # Added status field

    class Config:
        orm_mode = True

class ProjectUpdate(BaseModel):
    """Schema for updating an existing project."""
    branch: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

    class Config:
        orm_mode = True

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    repo_full_name: str
    branch: str
    repo_url: Optional[str]
    description: Optional[str]
    status: ProjectStatus
    last_deployed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    deployments: List[DeploymentResponse]  # Added deployments field to include deployment details

    class Config:
        orm_mode = True
