from fastapi import APIRouter
from . import auth, github, projects, deployments, images

router = APIRouter()

router.include_router(auth.router, prefix="", tags=["Auth"])
router.include_router(github.router, prefix="/github", tags=["GitHub"])
router.include_router(projects.router, prefix="/projects", tags=["Projects"])
router.include_router(deployments.router, prefix="/deployments", tags=["Deployments"])
router.include_router(images.router, tags=["Images"])
