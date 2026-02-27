from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import enum

# ---------------------------------------------------
# ENUM for Deployment Status
# ---------------------------------------------------
class DeploymentStatus(str, enum.Enum):
    building = "building"
    failed = "failed"
    succeeded = "succeeded"

class DeploymentBase(BaseModel):
    """Base schema for deployment, containing shared attributes."""
    repo_full_name: str  # Add repo_full_name
    repo_url: Optional[str] = None
    branch: str = Field(..., description="Git branch used for this deployment")

    class Config:
        orm_mode = True

class DeploymentCreate(DeploymentBase):
    """Schema used for creating a new deployment."""
    project_id: str = Field(..., description="ID of the project being deployed")
    triggered_by: Optional[str] = None  # Added triggered_by field

class DeploymentResponse(DeploymentBase):
    """Schema used to respond with deployment details."""
    id: str
    project_id: str
    triggered_by: Optional[str] = None
    status: DeploymentStatus
    build_log: Optional[str] = None
    endpoint_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # image_url: Optional[str] = None

    class Config:
        orm_mode = True
