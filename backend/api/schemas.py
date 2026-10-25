"""Pydantic request and response schemas for MetricWatch REST API."""

from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from database.models import (
    DatasetStatus,
    Severity,
    Direction,
    DetectionMethod,
    IssueType,
    Resolution,
)


# ============================================================================
# Health Schemas
# ============================================================================

class HealthResponse(BaseModel):
    status: str = Field(..., examples=["healthy"])
    database: str = Field(..., examples=["connected"])
    timestamp: datetime


# ============================================================================
# Data Quality Issue Schemas
# ============================================================================

class DataQualityIssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    issue_type: IssueType
    severity: Severity | None = None
    source_row: int | None = None
    source_column: str | None = None
    description: str | None = None
    resolution: Resolution | None = None


class DataQualityIssueListResponse(BaseModel):
    items: list[DataQualityIssueResponse]
    total: int
    skip: int
    limit: int


# ============================================================================
# Anomaly Schemas
# ============================================================================

class AnomalyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    metric_name: str
    record_date: date
    actual_value: float | None = None
    baseline_value: float | None = None
    baseline_std: float | None = None
    z_score: float | None = None
    change_percent: float | None = None
    direction: Direction | None = None
    severity: Severity | None = None
    detection_method: DetectionMethod | None = None
    short_explanation: str | None = None
    correlated_with: int | None = None


class AnomalyListResponse(BaseModel):
    items: list[AnomalyResponse]
    total: int
    skip: int
    limit: int


class AnomalyUpdateRequest(BaseModel):
    """
    Fields that can be updated on an Anomaly entity.
    Notice that resolution status belongs to DataQualityIssue, not Anomaly.
    """
    model_config = ConfigDict(extra="forbid")

    severity: Severity | None = None
    short_explanation: str | None = Field(None, max_length=1000)
    correlated_with: int | None = None


# ============================================================================
# Dataset Schemas
# ============================================================================

class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    row_count: int | None = None
    column_count: int | None = None
    status: DatasetStatus
    uploaded_at: datetime | None = None
    cleaned_at: datetime | None = None
    error_message: str | None = None
    storage_path: str | None = None
    quality_issue_count: int = 0
    anomaly_count: int = 0


class DatasetListResponse(BaseModel):
    items: list[DatasetResponse]
    total: int
    skip: int
    limit: int


class DatasetUploadResponse(BaseModel):
    dataset: DatasetResponse
    quality_issue_count: int
    anomaly_count: int
    message: str


class DatasetProfileResponse(BaseModel):
    dataset_id: int
    filename: str
    row_count: int | None
    column_count: int | None
    status: DatasetStatus
    persisted_fields: list[str] = ["row_count", "column_count"]
    notice: str = (
        "Dataset dimensions (row_count, column_count) are persisted in the database schema. "
        "Detailed per-column distribution stats and candidate type classifications are computed "
        "during ingestion but not persisted as a dedicated table in the current schema."
    )
