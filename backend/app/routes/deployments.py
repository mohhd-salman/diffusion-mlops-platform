from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import requests
from typing import List, Optional, Dict
from app.models import Deployment, Project, User
from app.dependencies import get_db
from app.utils.security import get_current_user, decrypt_token
from app.schemas.deployment import DeploymentCreate, DeploymentResponse, DeploymentStatus
from datetime import datetime, timezone
from app.config import JENKINS_URL, JENKINS_USER, JENKINS_API_TOKEN, JOB_NAME, JOB_TOKEN
import logging

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/start/{project_id}", response_model=DeploymentResponse, status_code=status.HTTP_201_CREATED)
async def trigger_deployment(project_id: str, payload: DeploymentCreate, db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    """Create a new deployment record and trigger Jenkins pipeline."""

    # 1. Validate Project
    project = db.query(Project).filter_by(id=project_id, user_id=current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        # 2. Create the deployment record (Set to BUILDING initially)
        deployment = Deployment(
            project_id=project.id,
            repo_full_name=project.repo_full_name,
            repo_url=project.repo_url,
            branch=payload.branch,
            triggered_by=current_user.id,
            status=DeploymentStatus.building,
            created_at=datetime.now(timezone.utc)
        )
        db.add(deployment)
        db.commit()
        db.refresh(deployment)

        # Update the project with the latest deployment details
        project.last_deployed_at = deployment.created_at
        db.commit()

    except Exception as e:
        # If DB creation fails, this is a real system error. Rollback and raise 500.
        db.rollback()
        logger.error(f"Database Error creating deployment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create deployment record")

    # 3. Trigger Jenkins (The Risky Part)
    try:
        logger.info(f"Triggering Jenkins deployment for project {project.id}")

        github_token = decrypt_token(current_user.github_access_token)

        trigger_jenkins_deployment(
            repo_url=project.repo_url,
            branch_name=payload.branch,
            deployment_id=str(deployment.id),
            github_token=github_token
        )


    except Exception as e:
        logger.error(f"Jenkins Trigger Failed for project {project_id}: {str(e)}")

        # Update status to FAILED
        deployment.status = DeploymentStatus.failed

        error_msg = str(e).replace("500: ", "").replace("504: ", "").replace("502: ", "")
        deployment.build_log = f"System Error: Could not connect to Jenkins.\nDetails: {error_msg}"

        db.commit()
        db.refresh(deployment)

        # Return the deployment so the Frontend shows "Failed" instead of crashing
        return deployment

    return deployment


@router.get("/", response_model=List[DeploymentResponse])
def list_deployments(project_id: Optional[str] = Query(None), db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    """List deployments, optionally filter by project_id."""
    query = db.query(Deployment).join(Project).filter(Project.user_id == current_user.id)
    query = query.options(joinedload(Deployment.project))  # Eager load project details

    if project_id:
        query = query.filter(Deployment.project_id == project_id)

    deployments = query.all()

    return deployments


@router.get("/{deployment_id}", response_model=DeploymentResponse)
def get_deployment(deployment_id: str, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    """Get details of a deployment by ID."""
    deployment = db.query(Deployment).join(Project).filter(
        Deployment.id == deployment_id, Project.user_id == current_user.id
    ).first()

    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    return deployment


@router.post("/jenkins/callback")
def deployment_callback(payload: dict, db: Session = Depends(get_db)):
    """Receive Jenkins build results."""
    try:
        # Ensure the required fields are in the payload
        required_fields = ["deployment_id", "status", "build_number", "build_log", "endpoint_url"]
        if not all(field in payload for field in required_fields):
            raise HTTPException(status_code=400, detail="Missing required callback parameters")

        deployment_id = payload["deployment_id"]
        status = payload["status"]
        jenkins_job_name = payload.get("jenkins_job_name", JOB_NAME)  # Use .get in case jenkins doesn't send name
        endpoint_url = payload["endpoint_url"]
        build_number = payload["build_number"]
        build_log = payload["build_log"]

        deployment = db.query(Deployment).filter_by(id=deployment_id).first()
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        deployment.status = (
            DeploymentStatus.succeeded if status == "success" else DeploymentStatus.failed
        )
        deployment.endpoint_url = endpoint_url
        deployment.jenkins_job_name = jenkins_job_name
        deployment.jenkins_build_number = build_number
        deployment.build_log = build_log
        deployment.updated_at = datetime.now(timezone.utc)
        db.commit()

        project = deployment.project
        project.last_deployed_at = datetime.now(timezone.utc)
        db.commit()

        return {"message": "Callback processed successfully"}

    except Exception as e:
        # If any exception occurs, log the error and handle failure
        db.rollback()
        logger.error(f"Error processing Jenkins callback: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing Jenkins callback")


@router.get("/status/stats", response_model=Dict[str, int])
def get_deployment_status_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch deployment stats grouped by status (succeeded, failed), and total count."""
    try:
        deployment_stats = db.query(Deployment.status, func.count(Deployment.id).label('count')) \
            .join(Project).filter(Project.user_id == current_user.id) \
            .group_by(Deployment.status).all()

        stats = {
            "Succeeded": 0,
            "Failed": 0,
            "Total": 0,  # To keep track of total deployments
        }

        # Populate stats dictionary with the actual counts
        for status, count in deployment_stats:
            if status == DeploymentStatus.succeeded:
                stats["Succeeded"] = count
            elif status == DeploymentStatus.failed:
                stats["Failed"] = count

        # Calculate total deployments by summing the succeeded and failed counts
        stats["Total"] = stats["Succeeded"] + stats["Failed"]

        return stats

    except Exception as e:
        logger.error(f"Error in fetching deployment status stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch deployment stats")


def trigger_jenkins_deployment(repo_url: str, branch_name: str, deployment_id: str, github_token: str):
    # Construct the parameters for Jenkins job
    params = {
        "token": JOB_TOKEN,  # Job authentication token from Jenkins
        "REPO_URL": repo_url,
        "BRANCH_NAME": branch_name,
        "DEPLOYMENT_ID": deployment_id,
        "GITHUB_TOKEN": github_token,  # User's GitHub token
    }

    # Construct the authentication header
    auth = (JENKINS_USER, JENKINS_API_TOKEN)
    url = f"{JENKINS_URL}/job/{JOB_NAME}/buildWithParameters"

    try:
        # Trigger the Jenkins job via a POST request with parameters and authentication
        response = requests.post(url, params=params, auth=auth, timeout=30)

        # If the request fails, raise an exception
        if response.status_code != 201:
            raise HTTPException(status_code=500, detail=f"Failed to trigger Jenkins job: {response.text}")

        return True

    # Specific Error Handling for cleaner logs
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Connection to Jenkins timed out (30s)")
    except requests.ConnectionError:
        raise HTTPException(status_code=502, detail="Could not connect to Jenkins (Server might be down)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Jenkins trigger error: {str(e)}")