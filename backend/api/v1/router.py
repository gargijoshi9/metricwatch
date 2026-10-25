"""V1 router combining datasets and anomalies endpoints."""

from fastapi import APIRouter
from api.v1.datasets import router as datasets_router
from api.v1.anomalies import router as anomalies_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(datasets_router)
api_v1_router.include_router(anomalies_router)
