"""Anomalies router: listing, detail, and updating supported fields."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from api.deps import get_db
from api.schemas import (
    AnomalyResponse,
    AnomalyListResponse,
    AnomalyUpdateRequest,
)
from database.models import Severity, Direction
from database.repository import (
    AnomalyNotFoundError,
    EntityValidationError,
    get_anomaly,
    update_anomaly,
    list_all_anomalies,
)

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])


@router.get(
    "",
    response_model=AnomalyListResponse,
    summary="List anomalies across datasets with filters",
)
def get_anomalies_list(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=100, description="Page limit"),
    dataset_id: int | None = Query(None, description="Filter by dataset ID"),
    severity: Severity | None = Query(None, description="Filter by anomaly severity"),
    direction: Direction | None = Query(None, description="Filter by direction (up/down)"),
    metric_name: str | None = Query(None, description="Filter by metric name"),
    db: Session = Depends(get_db),
) -> AnomalyListResponse:
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


@router.get(
    "/{anomaly_id}",
    response_model=AnomalyResponse,
    summary="Get single anomaly detail",
)
def get_anomaly_detail(
    anomaly_id: int,
    db: Session = Depends(get_db),
) -> AnomalyResponse:
    anomaly = get_anomaly(db=db, anomaly_id=anomaly_id)
    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Anomaly with ID {anomaly_id} was not found.",
        )
    return AnomalyResponse.model_validate(anomaly)


@router.patch(
    "/{anomaly_id}",
    response_model=AnomalyResponse,
    summary="Update supported anomaly fields",
    description=(
        "Updates validated fields supported by the Anomaly model: "
        "severity, short_explanation, and correlated_with. "
        "Notice that 'resolution' belongs to DataQualityIssue and is not supported on Anomaly."
    ),
)
async def patch_anomaly(
    anomaly_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> AnomalyResponse:
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload.",
        )

    if not isinstance(body, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must be a JSON object.",
        )

    # Explicit check for unsupported fields like 'resolution'
    if "resolution" in body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Field 'resolution' is not supported on Anomaly entities. "
                "Resolution status is tracked on DataQualityIssue entities."
            ),
        )

    # Validate allowed fields using Pydantic schema
    try:
        validated_data = AnomalyUpdateRequest(**body)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error: {err}",
        ) from err

    try:
        updated = update_anomaly(
            db=db,
            anomaly_id=anomaly_id,
            severity=validated_data.severity,
            short_explanation=validated_data.short_explanation,
            correlated_with=validated_data.correlated_with,
        )
        return AnomalyResponse.model_validate(updated)
    except AnomalyNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Anomaly with ID {anomaly_id} was not found.",
        )
    except EntityValidationError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err
