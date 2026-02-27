from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
import enum
from app.config import Base
from app.utils.id_generator import generate_base36_id

class ProjectStatus(str, enum.Enum):
    active = "active"
    archived = "archived"

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: generate_base36_id('pl'))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    repo_full_name = Column(String(255), nullable=False)
    branch = Column(String(100), nullable=False, default="main")
    repo_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)

    status = Column(Enum(ProjectStatus), default=ProjectStatus.active, nullable=False)
    last_deployed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="projects")
    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")
