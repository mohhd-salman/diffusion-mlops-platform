import base64
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests

from app.dependencies import get_db
from app.models import Deployment
from app.schemas.image import ImageGenerateRequest

router = APIRouter(prefix="/images", tags=["Images"])

def check_model_health(endpoint_url: str) -> bool:
    try:
        r = requests.get(f"{endpoint_url}/health", timeout=10)
        return r.status_code == 200
    except requests.exceptions.RequestException:
        return False

@router.post("/generate/{deployment_id}", status_code=200)
def generate_image(  # <-- switched to sync because requests is sync
    deployment_id: str,
    payload: ImageGenerateRequest,
    db: Session = Depends(get_db),
):
    deployment = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not deployment or not deployment.endpoint_url:
        raise HTTPException(status_code=400, detail="Invalid deployment or missing endpoint")

    base_endpoint_url = deployment.endpoint_url.rstrip("/")
    if not check_model_health(base_endpoint_url):
        raise HTTPException(status_code=503, detail="Model service is not healthy. Please try again later.")

    model_payload = {
        "prompt": payload.prompt,
        "steps": 50,
        "guidance_scale": 7.5,
        "width": 256,
        "height": 256,
    }

    try:
        r = requests.post(f"{base_endpoint_url}/generate", json=model_payload, timeout=300)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Model Error: {r.text}")

        image_base64 = base64.b64encode(r.content).decode("utf-8")
        return {"status": "completed", "image_base64": image_base64}

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Model request timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Model request failed: {str(e)}")