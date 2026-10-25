"""MetricWatch REST API application."""

from datetime import datetime, timezone
import logging
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

# Load environment configuration
load_dotenv()

from api.deps import get_db
from api.schemas import HealthResponse
from api.v1.router import api_v1_router
from database.repository import (
    PersistenceError,
    DatasetNotFoundError,
    AnomalyNotFoundError,
    EntityValidationError,
)

logger = logging.getLogger("metricwatch.api")

app = FastAPI(
    title="MetricWatch API",
    description="Production-ready REST API for AI-powered business metric anomaly detection.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------

cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
)
allowed_origins = [
    origin.strip() for origin in cors_origins_env.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handlers (Prevent leaking sensitive internal details)
# ---------------------------------------------------------------------------

@app.exception_handler(DatasetNotFoundError)
async def dataset_not_found_handler(request: Request, exc: DatasetNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


@app.exception_handler(AnomalyNotFoundError)
async def anomaly_not_found_handler(request: Request, exc: AnomalyNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


@app.exception_handler(EntityValidationError)
async def entity_validation_handler(request: Request, exc: EntityValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.exception_handler(PersistenceError)
async def persistence_error_handler(request: Request, exc: PersistenceError):
    logger.error("Database persistence error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "A database persistence error occurred. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Health & Diagnostic Endpoints
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Check API and database health",
    description="Runs a lightweight query against PostgreSQL and reports health status.",
)
def check_health(response: Response, db: Session = Depends(get_db)) -> HealthResponse:
    now = datetime.now(timezone.utc)
    try:
        # Lightweight connectivity probe
        db.execute(text("SELECT 1"))
        return HealthResponse(
            status="healthy",
            database="connected",
            timestamp=now,
        )
    except Exception as exc:
        logger.warning("Database health probe failed: %s", exc)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="unhealthy",
            database="disconnected",
            timestamp=now,
        )


@app.get(
    "/",
    tags=["Root"],
    summary="Root entry point",
)
def root():
    return {
        "name": "MetricWatch API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# Mount API V1 routes
app.include_router(api_v1_router)
