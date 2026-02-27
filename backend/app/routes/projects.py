from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models import Project, User
from app.dependencies import get_db
from app.utils.security import get_current_user
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    """Create new project for current user."""
    project = Project(user_id=current_user.id, **payload.dict())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    return db.query(Project).filter(Project.user_id == current_user.id).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id,
                                       Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id,
                                       Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id,
                                       Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None

@router.get("/total/projects", response_model=int)
def get_total_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_projects = db.query(Project).filter(Project.user_id == current_user.id).count()
    return total_projects

@router.get("/status/{status}", response_model=int)
def get_projects_by_status(status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if status not in ["active", "archived"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'archived'.")

    projects = db.query(Project).filter(Project.user_id == current_user.id, Project.status == status).count()
    return projects


