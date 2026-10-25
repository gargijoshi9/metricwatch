import logging
import os
from pathlib import Path
import tempfile
from typing import Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

logger = logging.getLogger("metricwatch.api.datasets")

from api.deps import get_db
from api.schemas import (
    DatasetResponse,
    DatasetListResponse,
    DatasetUploadResponse,
    DatasetProfileResponse,
    DataQualityIssueListResponse,
    DataQualityIssueResponse,
    AnomalyListResponse,
    AnomalyResponse,
)
from database.models import (
    Dataset,
    DatasetStatus,
    IssueType,
    Severity,
    Direction,
)
from database.repository import (
    PersistenceError,
    DatasetNotFoundError,
    get_dataset,
    list_datasets,
    count_datasets,
    list_data_quality_issues_paginated,
    list_all_anomalies,
    save_pipeline_run,
)
from ingestion.loader import load_file, LoadError
from ingestion.profiler import profile_dataframe
from ingestion.cleaner import clean, CleaningError, DATE_COLUMN_ALIASES
from detection.anomaly_detector import detect_anomalies

router = APIRouter(prefix="/datasets", tags=["Datasets"])

# Upload limits
MAX_UPLOAD_SIZE_BYTES = int(
    os.getenv("MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024))
)  # 10 MB default
CHUNK_SIZE = 64 * 1024  # 64 KB chunks


def _build_dataset_response(db: Session, dataset: Dataset) -> DatasetResponse:
    """Helper to populate DatasetResponse with counts of linked entities."""
    return DatasetResponse(
        id=dataset.id,
        filename=dataset.filename,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        status=dataset.status,
        uploaded_at=dataset.uploaded_at,
        cleaned_at=dataset.cleaned_at,
        error_message=dataset.error_message,
        storage_path=dataset.storage_path,
        quality_issue_count=(
            len(dataset.quality_issues)
            if dataset.quality_issues is not None
            else 0
        ),
        anomaly_count=(
            len(dataset.anomalies)
            if dataset.anomalies is not None
            else 0
        ),
    )


@router.post(
    "/upload",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process CSV dataset",
    description=(
        "Uploads a CSV file, validates format and size, runs ingestion profiling, "
        "cleans the data, runs rolling baseline anomaly detection, and atomically "
        "persists the results."
    ),
)
async def upload_dataset(
    file: UploadFile = File(...),
    date_column: str | None = Form(None),
    metric_columns: str | None = Form(None),
    db: Session = Depends(get_db),
) -> DatasetUploadResponse:
    # 1. Validate file extension
    filename = file.filename or "uploaded.csv"
    if not filename.lower().endswith(".csv"):
        logger.warning("Upload rejected: '%s' is not a CSV file.", filename)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV files (.csv) are currently supported.",
        )

    # 2. Stream to temporary file while enforcing max size
    temp_file = tempfile.NamedTemporaryFile(suffix=".csv", delete=False)
    temp_path = Path(temp_file.name)
    total_bytes = 0

    try:
        try:
            while chunk := await file.read(CHUNK_SIZE):
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_SIZE_BYTES:
                    logger.warning(
                        "Upload rejected: '%s' exceeds %d MB limit.",
                        filename,
                        MAX_UPLOAD_SIZE_BYTES // (1024 * 1024),
                    )
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail=(
                            f"File size exceeds maximum allowed limit of "
                            f"{MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
                        ),
                    )
                temp_file.write(chunk)
            temp_file.flush()
        finally:
            temp_file.close()

        if total_bytes == 0:
            logger.warning("Upload rejected: '%s' is empty (0 bytes).", filename)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        # 3. Load dataset using existing loader
        try:
            raw_df = load_file(str(temp_path))
        except LoadError as err:
            logger.warning("Upload rejected: load error in '%s': %s", filename, err)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse uploaded dataset: {err}",
            ) from err

        # 4. Profile dataset
        try:
            profile = profile_dataframe(raw_df)
        except Exception as err:
            logger.warning("Upload rejected: profile error in '%s': %s", filename, err)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to profile dataset: {err}",
            ) from err

        # Treat Swagger UI default placeholder "string" as None if not in columns
        raw_norm_cols = [
            str(c).strip().lower().replace(" ", "_") for c in raw_df.columns
        ]
        if (
            date_column
            and date_column.strip().lower() == "string"
            and "string" not in raw_norm_cols
        ):
            date_column = None
        if (
            metric_columns
            and metric_columns.strip().lower() == "string"
            and "string" not in raw_norm_cols
        ):
            metric_columns = None

        # 5. Resolve date column
        resolved_date_col = (
            date_column.strip() if date_column and date_column.strip() else None
        )
        if not resolved_date_col:
            candidate_dates = profile.get("candidate_date_columns", [])
            if len(candidate_dates) == 1:
                resolved_date_col = candidate_dates[0]
            else:
                # Check standard aliases in raw_df normalized columns
                norm_cols = [
                    str(c).strip().lower().replace(" ", "_") for c in raw_df.columns
                ]
                matched_aliases = [
                    raw_df.columns[i]
                    for i, nc in enumerate(norm_cols)
                    if nc in DATE_COLUMN_ALIASES
                ]
                if len(matched_aliases) == 1:
                    resolved_date_col = str(matched_aliases[0])
                elif len(candidate_dates) > 1:
                    logger.warning(
                        "Upload rejected: multiple date candidates in '%s': %s",
                        filename,
                        candidate_dates,
                    )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Multiple candidate date columns detected. "
                            "Please specify 'date_column' explicitly."
                        ),
                    )
                else:
                    logger.warning("Upload rejected: no date column in '%s'.", filename)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "No candidate date column detected. "
                            "Please specify 'date_column' explicitly."
                        ),
                    )

        # 6. Resolve metric columns
        resolved_metric_cols: list[str] = []
        if metric_columns and metric_columns.strip():
            resolved_metric_cols = [
                m.strip() for m in metric_columns.split(",") if m.strip()
            ]
        else:
            resolved_metric_cols = profile.get("candidate_numeric_columns", [])

        logger.info(
            "Processing upload '%s': date_col='%s', metric_cols=%s",
            filename,
            resolved_date_col,
            resolved_metric_cols,
        )

        # 7. Clean dataset
        try:
            cleaned_df, quality_issues = clean(
                raw_df,
                date_column=resolved_date_col,
                metric_columns=resolved_metric_cols,
            )
        except CleaningError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dataset cleaning error: {err}",
            ) from err

        # 8. Detect anomalies across resolved metrics
        all_anomalies: list[dict[str, Any]] = []
        norm_date_col = resolved_date_col.strip().lower().replace(" ", "_")

        for metric in resolved_metric_cols:
            norm_metric = str(metric).strip().lower().replace(" ", "_")
            if (
                norm_metric in cleaned_df.columns
                and norm_metric != norm_date_col
            ):
                try:
                    detected = detect_anomalies(
                        df=cleaned_df,
                        metric_column=norm_metric,
                        date_column=norm_date_col,
                    )
                    all_anomalies.extend(detected)
                except ValueError:
                    # Skip detection for columns without sufficient historical observations
                    pass

        # 9. Atomically persist pipeline run through repository
        try:
            dataset = save_pipeline_run(
                db=db,
                filename=filename,
                storage_path=f"uploads/{filename}",
                row_count=len(raw_df),
                column_count=len(raw_df.columns),
                status=DatasetStatus.completed,
                profile=profile,
                quality_issues=quality_issues,
                anomalies=all_anomalies,
                save_metrics=False,  # strictly avoid saving full raw rows
            )
        except PersistenceError as err:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database persistence failed while recording pipeline outputs.",
            ) from err

        return DatasetUploadResponse(
            dataset=_build_dataset_response(db, dataset),
            quality_issue_count=len(quality_issues),
            anomaly_count=len(all_anomalies),
            message=f"Dataset '{filename}' successfully ingested and processed.",
        )
    finally:
        # Guarantee removal of temporary disk file
        if temp_path.exists():
            try:
                os.unlink(temp_path)
            except OSError:
                pass


@router.get(
    "",
    response_model=DatasetListResponse,
    summary="List datasets with pagination",
)
def get_datasets(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    status: DatasetStatus | None = Query(None, description="Filter by dataset status"),
    db: Session = Depends(get_db),
) -> DatasetListResponse:
    items = list_datasets(db=db, skip=skip, limit=limit, status=status)
    total = count_datasets(db=db, status=status)
    return DatasetListResponse(
        items=[_build_dataset_response(db, d) for d in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse,
    summary="Get dataset details",
)
def get_dataset_details(
    dataset_id: int,
    db: Session = Depends(get_db),
) -> DatasetResponse:
    dataset = get_dataset(db=db, dataset_id=dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} was not found.",
        )
    return _build_dataset_response(db, dataset)


@router.get(
    "/{dataset_id}/profile",
    response_model=DatasetProfileResponse,
    summary="Get dataset profiling results",
)
def get_dataset_profile(
    dataset_id: int,
    db: Session = Depends(get_db),
) -> DatasetProfileResponse:
    dataset = get_dataset(db=db, dataset_id=dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} was not found.",
        )

    return DatasetProfileResponse(
        dataset_id=dataset.id,
        filename=dataset.filename,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        status=dataset.status,
    )


@router.get(
    "/{dataset_id}/quality-issues",
    response_model=DataQualityIssueListResponse,
    summary="Get dataset quality issues",
)
def get_dataset_quality_issues(
    dataset_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    issue_type: IssueType | None = Query(None),
    severity: Severity | None = Query(None),
    db: Session = Depends(get_db),
) -> DataQualityIssueListResponse:
    try:
        items, total = list_data_quality_issues_paginated(
            db=db,
            dataset_id=dataset_id,
            skip=skip,
            limit=limit,
            issue_type=issue_type,
            severity=severity,
        )
        return DataQualityIssueListResponse(
            items=[DataQualityIssueResponse.model_validate(i) for i in items],
            total=total,
            skip=skip,
            limit=limit,
        )
    except DatasetNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} was not found.",
        )


@router.get(
    "/{dataset_id}/anomalies",
    response_model=AnomalyListResponse,
    summary="Get anomalies for a dataset",
)
def get_dataset_anomalies(
    dataset_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    metric_name: str | None = Query(None),
    severity: Severity | None = Query(None),
    direction: Direction | None = Query(None),
    db: Session = Depends(get_db),
) -> AnomalyListResponse:
    dataset = get_dataset(db=db, dataset_id=dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID {dataset_id} was not found.",
        )

    items, total = list_all_anomalies(
        db=db,
        skip=skip,
        limit=limit,
        dataset_id=dataset_id,
        severity=severity,
        direction=direction,
        metric_name=metric_name,
    )
    return AnomalyListResponse(
        items=[AnomalyResponse.model_validate(a) for a in items],
        total=total,
        skip=skip,
        limit=limit,
    )
