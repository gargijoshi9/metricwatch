"""Database persistence layer and repository operations for MetricWatch."""

from datetime import date, datetime, timezone
import enum
from typing import Any
import pandas as pd
from sqlalchemy.orm import Session

from database.models import (
    Dataset,
    MetricValue,
    Anomaly,
    DataQualityIssue,
    DatasetStatus,
    Severity,
    Direction,
    DetectionMethod,
    IssueType,
    Resolution,
)


class PersistenceError(Exception):
    """Base exception for persistence layer operations."""
    pass


class DatasetNotFoundError(PersistenceError):
    """Raised when a requested dataset is not found in the database."""
    pass


class EntityValidationError(PersistenceError):
    """Raised when data fails entity validation before persistence."""
    pass


def _parse_enum(enum_cls: type[enum.Enum], value: Any, default: Any = None) -> Any:
    """Safely convert a string or enum instance to an Enum member."""
    if value is None:
        return default

    if isinstance(value, enum_cls):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower()
        for member in enum_cls:
            if (
                member.value.lower() == normalized
                or member.name.lower() == normalized
            ):
                return member

    if default is not None:
        return default

    valid_options = [m.value for m in enum_cls]
    raise EntityValidationError(
        f"Invalid value '{value}' for {enum_cls.__name__}. Expected one of: {valid_options}"
    )


def _parse_date(value: Any) -> date:
    """Parse a date value from a date, datetime, Timestamp, or ISO string."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        raise EntityValidationError("Record date cannot be null or empty.")

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, pd.Timestamp):
        return value.date()

    if isinstance(value, str):
        try:
            return date.fromisoformat(value.strip())
        except ValueError:
            parsed = pd.to_datetime(value, errors="coerce")
            if pd.notna(parsed):
                return parsed.date()

    raise EntityValidationError(f"Cannot parse '{value}' as a valid date.")


def _parse_float(value: Any, field_name: str, allow_none: bool = True) -> float | None:
    """Safely parse a numeric float value."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        if allow_none:
            return None
        raise EntityValidationError(f"Field '{field_name}' cannot be null.")

    try:
        numeric = float(value)
        if pd.isna(numeric):
            if allow_none:
                return None
            raise EntityValidationError(f"Field '{field_name}' cannot be NaN.")
        return numeric
    except (TypeError, ValueError) as err:
        raise EntityValidationError(
            f"Field '{field_name}' must be a numeric value, got '{value}'."
        ) from err


def _parse_int(value: Any, field_name: str, allow_none: bool = True) -> int | None:
    """Safely parse an integer value."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        if allow_none:
            return None
        raise EntityValidationError(f"Field '{field_name}' cannot be null.")

    try:
        return int(value)
    except (TypeError, ValueError) as err:
        raise EntityValidationError(
            f"Field '{field_name}' must be an integer, got '{value}'."
        ) from err


# ============================================================================
# Dataset CRUD
# ============================================================================

def create_dataset(
    db: Session,
    filename: str,
    storage_path: str | None = None,
    row_count: int | None = None,
    column_count: int | None = None,
    status: DatasetStatus | str = DatasetStatus.uploaded,
    error_message: str | None = None,
    commit: bool = True,
) -> Dataset:
    """
    Create a new Dataset metadata record.
    """
    if not filename or not str(filename).strip():
        raise EntityValidationError("Dataset filename cannot be empty.")

    parsed_status = _parse_enum(DatasetStatus, status, default=DatasetStatus.uploaded)

    if row_count is not None and row_count < 0:
        raise EntityValidationError("row_count cannot be negative.")

    if column_count is not None and column_count < 0:
        raise EntityValidationError("column_count cannot be negative.")

    dataset = Dataset(
        filename=str(filename).strip(),
        storage_path=str(storage_path).strip() if storage_path else None,
        row_count=row_count,
        column_count=column_count,
        status=parsed_status,
        error_message=error_message,
    )

    try:
        db.add(dataset)
        if commit:
            db.commit()
            db.refresh(dataset)
        else:
            db.flush()
        return dataset
    except Exception as err:
        db.rollback()
        raise PersistenceError(f"Failed to create dataset: {err}") from err


def get_dataset(db: Session, dataset_id: int) -> Dataset | None:
    """Retrieve a dataset by its primary key ID."""
    try:
        return db.query(Dataset).filter(Dataset.id == dataset_id).first()
    except Exception as err:
        raise PersistenceError(f"Failed to query dataset with ID {dataset_id}: {err}") from err


def list_datasets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: DatasetStatus | str | None = None,
) -> list[Dataset]:
    """Retrieve datasets with pagination and optional status filter."""
    try:
        query = db.query(Dataset)
        if status is not None:
            parsed_status = _parse_enum(DatasetStatus, status)
            query = query.filter(Dataset.status == parsed_status)
        return (
            query.order_by(Dataset.uploaded_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    except Exception as err:
        raise PersistenceError(f"Failed to list datasets: {err}") from err


def update_dataset_status(
    db: Session,
    dataset_id: int,
    status: DatasetStatus | str,
    error_message: str | None = None,
    cleaned_at: datetime | None = None,
    row_count: int | None = None,
    column_count: int | None = None,
    commit: bool = True,
) -> Dataset:
    """
    Update dataset processing status, timestamps, and error messages.
    """
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        raise DatasetNotFoundError(f"Dataset with ID {dataset_id} was not found.")

    parsed_status = _parse_enum(DatasetStatus, status)
    dataset.status = parsed_status

    if error_message is not None:
        dataset.error_message = error_message

    if cleaned_at is not None:
        dataset.cleaned_at = cleaned_at
    elif parsed_status == DatasetStatus.completed and dataset.cleaned_at is None:
        dataset.cleaned_at = datetime.now(timezone.utc)

    if row_count is not None:
        if row_count < 0:
            raise EntityValidationError("row_count cannot be negative.")
        dataset.row_count = row_count

    if column_count is not None:
        if column_count < 0:
            raise EntityValidationError("column_count cannot be negative.")
        dataset.column_count = column_count

    try:
        if commit:
            db.commit()
            db.refresh(dataset)
        else:
            db.flush()
        return dataset
    except Exception as err:
        db.rollback()
        raise PersistenceError(
            f"Failed to update dataset status for ID {dataset_id}: {err}"
        ) from err


def delete_dataset(db: Session, dataset_id: int, commit: bool = True) -> bool:
    """
    Delete a dataset and all associated child entities (cascaded).
    """
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        return False

    try:
        db.delete(dataset)
        if commit:
            db.commit()
        else:
            db.flush()
        return True
    except Exception as err:
        db.rollback()
        raise PersistenceError(
            f"Failed to delete dataset with ID {dataset_id}: {err}"
        ) from err


# ============================================================================
# Data Quality Issues Persistence
# ============================================================================

def _infer_quality_severity(issue_type: IssueType) -> Severity:
    """Provide a sensible default severity for quality issues when omitted."""
    if issue_type == IssueType.missing_date:
        return Severity.high
    elif issue_type == IssueType.invalid_type:
        return Severity.medium
    elif issue_type == IssueType.duplicate_row:
        return Severity.low
    return Severity.medium


def save_data_quality_issues(
    db: Session,
    dataset_id: int,
    quality_issues: list[dict[str, Any]],
    commit: bool = True,
) -> list[DataQualityIssue]:
    """
    Persist data quality issues produced by the cleaner / profiler.
    """
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        raise DatasetNotFoundError(f"Dataset with ID {dataset_id} was not found.")

    if not isinstance(quality_issues, list):
        raise EntityValidationError("quality_issues must be a list of dictionaries.")

    issue_entities = []
    for issue in quality_issues:
        raw_type = issue.get("issue_type")
        if not raw_type:
            raise EntityValidationError("Data quality issue missing 'issue_type'.")

        parsed_type = _parse_enum(IssueType, raw_type)

        raw_resolution = issue.get("resolution")
        parsed_resolution = _parse_enum(
            Resolution, raw_resolution, default=Resolution.flagged_unresolved
        )

        raw_severity = issue.get("severity")
        if raw_severity:
            parsed_severity = _parse_enum(Severity, raw_severity)
        else:
            parsed_severity = _infer_quality_severity(parsed_type)

        source_row = _parse_int(issue.get("source_row"), "source_row", allow_none=True)
        source_column = issue.get("source_column")
        description = issue.get("description", "")

        entity = DataQualityIssue(
            dataset_id=dataset_id,
            issue_type=parsed_type,
            severity=parsed_severity,
            source_row=source_row,
            source_column=str(source_column) if source_column is not None else None,
            description=str(description) if description else None,
            resolution=parsed_resolution,
        )
        issue_entities.append(entity)

    try:
        db.add_all(issue_entities)
        if commit:
            db.commit()
            for entity in issue_entities:
                db.refresh(entity)
        else:
            db.flush()
        return issue_entities
    except Exception as err:
        db.rollback()
        raise PersistenceError(
            f"Failed to persist data quality issues for dataset {dataset_id}: {err}"
        ) from err


def get_data_quality_issues(
    db: Session,
    dataset_id: int,
    issue_type: IssueType | str | None = None,
    severity: Severity | str | None = None,
) -> list[DataQualityIssue]:
    """Retrieve quality issues for a given dataset."""
    try:
        query = db.query(DataQualityIssue).filter(
            DataQualityIssue.dataset_id == dataset_id
        )
        if issue_type is not None:
            parsed_type = _parse_enum(IssueType, issue_type)
            query = query.filter(DataQualityIssue.issue_type == parsed_type)

        if severity is not None:
            parsed_severity = _parse_enum(Severity, severity)
            query = query.filter(DataQualityIssue.severity == parsed_severity)

        return query.order_by(DataQualityIssue.source_row.asc().nulls_last()).all()
    except Exception as err:
        raise PersistenceError(
            f"Failed to query quality issues for dataset {dataset_id}: {err}"
        ) from err


def save_profiling_results(
    db: Session,
    dataset_id: int,
    profile: dict[str, Any],
    commit: bool = True,
) -> Dataset:
    """
    Update dataset metadata from a profiler summary report.
    """
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        raise DatasetNotFoundError(f"Dataset with ID {dataset_id} was not found.")

    if not isinstance(profile, dict):
        raise EntityValidationError("profile must be a dictionary.")

    row_count = profile.get("row_count")
    column_count = profile.get("column_count")

    if row_count is not None:
        dataset.row_count = _parse_int(row_count, "row_count", allow_none=False)

    if column_count is not None:
        dataset.column_count = _parse_int(
            column_count, "column_count", allow_none=False
        )

    try:
        if commit:
            db.commit()
            db.refresh(dataset)
        else:
            db.flush()
        return dataset
    except Exception as err:
        db.rollback()
        raise PersistenceError(
            f"Failed to save profiling results for dataset {dataset_id}: {err}"
        ) from err


# ============================================================================
# Anomalies Persistence
# ============================================================================

def save_anomalies(
    db: Session,
    dataset_id: int,
    anomalies: list[dict[str, Any]],
    commit: bool = True,
) -> list[Anomaly]:
    """
    Persist detected anomalies for a dataset.
    """
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        raise DatasetNotFoundError(f"Dataset with ID {dataset_id} was not found.")

    if not isinstance(anomalies, list):
        raise EntityValidationError("anomalies must be a list of dictionaries.")

    anomaly_entities = []
    for item in anomalies:
        metric_name = item.get("metric_name")
        if not metric_name or not str(metric_name).strip():
            raise EntityValidationError("Anomaly requires a non-empty 'metric_name'.")

        record_date = _parse_date(item.get("record_date"))

        actual_val = _parse_float(item.get("actual_value"), "actual_value", allow_none=True)
        baseline_val = _parse_float(item.get("baseline_value"), "baseline_value", allow_none=True)
        baseline_std = _parse_float(item.get("baseline_std"), "baseline_std", allow_none=True)
        z_score = _parse_float(item.get("z_score"), "z_score", allow_none=True)
        change_pct = _parse_float(item.get("change_percent"), "change_percent", allow_none=True)

        direction = _parse_enum(Direction, item.get("direction"), default=None)
        severity = _parse_enum(Severity, item.get("severity"), default=Severity.medium)

        raw_method = item.get("detection_method")
        detection_method = _parse_enum(
            DetectionMethod, raw_method, default=DetectionMethod.zscore
        )

        source_row = _parse_int(item.get("source_row"), "source_row", allow_none=True)
        explanation = item.get("short_explanation")
        if not explanation and source_row is not None:
            direction_text = f" ({direction.value})" if direction else ""
            explanation = f"Row {source_row}: Anomaly detected in '{metric_name}'{direction_text}."

        correlated_with = _parse_int(
            item.get("correlated_with"), "correlated_with", allow_none=True
        )

        entity = Anomaly(
            dataset_id=dataset_id,
            metric_name=str(metric_name).strip(),
            record_date=record_date,
            actual_value=actual_val,
            baseline_value=baseline_val,
            baseline_std=baseline_std,
            z_score=z_score,
            change_percent=change_pct,
            direction=direction,
            severity=severity,
            detection_method=detection_method,
            short_explanation=explanation,
            correlated_with=correlated_with,
        )
        anomaly_entities.append(entity)

    try:
        db.add_all(anomaly_entities)
        if commit:
            db.commit()
            for entity in anomaly_entities:
                db.refresh(entity)
        else:
            db.flush()
        return anomaly_entities
    except Exception as err:
        db.rollback()
        raise PersistenceError(
            f"Failed to persist anomalies for dataset {dataset_id}: {err}"
        ) from err


def get_anomalies(
    db: Session,
    dataset_id: int,
    metric_name: str | None = None,
    severity: Severity | str | None = None,
    direction: Direction | str | None = None,
) -> list[Anomaly]:
    """Retrieve detected anomalies for a dataset with optional filters."""
    try:
        query = db.query(Anomaly).filter(Anomaly.dataset_id == dataset_id)

        if metric_name is not None:
            query = query.filter(Anomaly.metric_name == str(metric_name).strip())

        if severity is not None:
            parsed_severity = _parse_enum(Severity, severity)
            query = query.filter(Anomaly.severity == parsed_severity)

        if direction is not None:
            parsed_direction = _parse_enum(Direction, direction)
            query = query.filter(Anomaly.direction == parsed_direction)

        return query.order_by(Anomaly.record_date.asc(), Anomaly.id.asc()).all()
    except Exception as err:
        raise PersistenceError(
            f"Failed to query anomalies for dataset {dataset_id}: {err}"
        ) from err


# ============================================================================
# Metric Values Persistence (Selective / Optional)
# ============================================================================

def save_metric_values(
    db: Session,
    dataset_id: int,
    metric_values: list[dict[str, Any]] | pd.DataFrame,
    commit: bool = True,
) -> list[MetricValue]:
    """
    Persist individual metric rows (optional; avoids storing raw datasets by default).
    """
    dataset = get_dataset(db, dataset_id)
    if not dataset:
        raise DatasetNotFoundError(f"Dataset with ID {dataset_id} was not found.")

    rows: list[dict[str, Any]] = []
    if isinstance(metric_values, pd.DataFrame):
        rows = metric_values.to_dict(orient="records")
    elif isinstance(metric_values, list):
        rows = metric_values
    else:
        raise EntityValidationError(
            "metric_values must be a list of dictionaries or a pandas DataFrame."
        )

    metric_entities = []
    for item in rows:
        metric_name = item.get("metric_name")
        if not metric_name or not str(metric_name).strip():
            raise EntityValidationError("MetricValue requires a non-empty 'metric_name'.")

        record_date = _parse_date(item.get("record_date"))
        val = _parse_float(item.get("value"), "value", allow_none=False)

        source_row = _parse_int(item.get("source_row"), "source_row", allow_none=True)
        source_col = item.get("source_column")
        unit = item.get("unit")

        entity = MetricValue(
            dataset_id=dataset_id,
            metric_name=str(metric_name).strip(),
            record_date=record_date,
            value=val,
            unit=str(unit).strip() if unit else None,
            source_row=source_row,
            source_column=str(source_col).strip() if source_col else None,
        )
        metric_entities.append(entity)

    try:
        db.add_all(metric_entities)
        if commit:
            db.commit()
            for entity in metric_entities:
                db.refresh(entity)
        else:
            db.flush()
        return metric_entities
    except Exception as err:
        db.rollback()
        raise PersistenceError(
            f"Failed to persist metric values for dataset {dataset_id}: {err}"
        ) from err


def get_metric_values(
    db: Session,
    dataset_id: int,
    metric_name: str | None = None,
) -> list[MetricValue]:
    """Retrieve metric values for a given dataset."""
    try:
        query = db.query(MetricValue).filter(MetricValue.dataset_id == dataset_id)
        if metric_name is not None:
            query = query.filter(MetricValue.metric_name == str(metric_name).strip())
        return query.order_by(MetricValue.record_date.asc()).all()
    except Exception as err:
        raise PersistenceError(
            f"Failed to query metric values for dataset {dataset_id}: {err}"
        ) from err


# ============================================================================
# High-Level Transactional Pipeline Coordinator
# ============================================================================

def save_pipeline_run(
    db: Session,
    filename: str,
    storage_path: str | None = None,
    row_count: int | None = None,
    column_count: int | None = None,
    status: DatasetStatus | str = DatasetStatus.completed,
    profile: dict[str, Any] | None = None,
    quality_issues: list[dict[str, Any]] | None = None,
    anomalies: list[dict[str, Any]] | None = None,
    save_metrics: bool = False,
    metric_values: list[dict[str, Any]] | pd.DataFrame | None = None,
    error_message: str | None = None,
) -> Dataset:
    """
    Persist an entire pipeline run (dataset metadata, quality issues, and anomalies)
    within a single atomic transaction.

    By default, avoids storing full raw metric rows (save_metrics=False) unless
    explicitly requested.
    """
    try:
        # 1. Create dataset metadata
        parsed_status = _parse_enum(DatasetStatus, status, default=DatasetStatus.completed)

        dataset = create_dataset(
            db=db,
            filename=filename,
            storage_path=storage_path,
            row_count=row_count,
            column_count=column_count,
            status=parsed_status,
            error_message=error_message,
            commit=False,
        )

        # 2. Update profiling results if supplied
        if profile:
            save_profiling_results(db=db, dataset_id=dataset.id, profile=profile, commit=False)

        # 3. Persist data quality issues if supplied
        if quality_issues:
            save_data_quality_issues(
                db=db,
                dataset_id=dataset.id,
                quality_issues=quality_issues,
                commit=False,
            )

        # 4. Persist detected anomalies if supplied
        if anomalies:
            save_anomalies(
                db=db,
                dataset_id=dataset.id,
                anomalies=anomalies,
                commit=False,
            )

        # 5. Optionally persist metric rows if explicitly requested
        if save_metrics and metric_values is not None:
            save_metric_values(
                db=db,
                dataset_id=dataset.id,
                metric_values=metric_values,
                commit=False,
            )

        # Set cleaned timestamp on completion
        if dataset.status == DatasetStatus.completed and dataset.cleaned_at is None:
            dataset.cleaned_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(dataset)
        return dataset
    except Exception as err:
        db.rollback()
        if isinstance(err, PersistenceError):
            raise
        raise PersistenceError(f"Failed to persist pipeline run: {err}") from err
