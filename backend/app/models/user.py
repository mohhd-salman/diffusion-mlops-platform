from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from app.config import Base
from app.utils.id_generator import generate_base36_id

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: generate_base36_id('usr'))
    github_id = Column(Integer, unique=True, nullable=False)
    username = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True, index=True)
    avatar_url = Column(String, nullable=True)
    github_access_token = Column(Text, nullable=True)

    role = Column(String, default="user")   # user, admin
    is_active = Column(Integer, default=1)  # 1=active, 0=disabled

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
