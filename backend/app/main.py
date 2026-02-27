from fastapi import FastAPI, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from app.dependencies import get_db
from app.routes import router as api_router
from app.config import FRONTEND_URL

logger = logging.getLogger(__name__)

app = FastAPI(
    title="MLOps Platform Backend",
    description="Backend API for model deployment and management",
    version="1.0.0",
)

# CORS for frontend app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # could add localhost variations here if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "database": "unreachable", "error": str(e)},
        )

# Register all routers
app.include_router(api_router)
