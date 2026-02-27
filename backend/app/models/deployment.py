from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
import enum
from app.config import Base
from app.utils.id_generator import generate_base36_id

class DeploymentStatus(str, enum.Enum):
    building = "building"
    failed = "failed"
    succeeded = "succeeded"

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, default=lambda: generate_base36_id('dl'))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    repo_full_name = Column(String(255), nullable=True)
    repo_url = Column(String(500), nullable=True)
    branch = Column(String(100), nullable=True)
    triggered_by = Column(String, ForeignKey("users.id"), nullable=True)

    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.building, nullable=False)
    build_log = Column(Text, nullable=True)
    endpoint_url = Column(String(500), nullable=True)
    # image_url = Column(String(500), nullable=True)
    jenkins_job_name = Column(String(255), nullable=True)
    jenkins_build_number = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    project = relationship("Project", back_populates="deployments")
    user = relationship("User", back_populates="deployments")

