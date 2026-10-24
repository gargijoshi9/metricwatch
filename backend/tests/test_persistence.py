"""Unit tests for the database persistence layer and repository operations."""

from datetime import date, datetime, timezone
import pytest
import pandas as pd
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from database.models import (
    Base,
    Dataset,
    DatasetStatus,
    Anomaly,
    DataQualityIssue,
    MetricValue,
    Severity,
    Direction,
    DetectionMethod,
    IssueType,
    Resolution,
)
from database.repository import (
    PersistenceError,
    DatasetNotFoundError,
    EntityValidationError,
    create_dataset,
    get_dataset,
    list_datasets,
    update_dataset_status,
    delete_dataset,
    save_data_quality_issues,
    get_data_quality_issues,
    save_profiling_results,
    save_anomalies,
    get_anomalies,
    save_metric_values,
    get_metric_values,
    save_pipeline_run,
)


@pytest.fixture
def db_session():
    """Create a fresh in-memory SQLite database and session for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    # Enable foreign keys for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# ============================================================================
# Dataset Tests
# ============================================================================

def test_create_and_get_dataset(db_session):
    dataset = create_dataset(
        db=db_session,
        filename="metrics_2026.csv",
        storage_path="/data/metrics_2026.csv",
        row_count=100,
        column_count=5,
        status="uploaded",
    )

    assert dataset.id is not None
    assert dataset.filename == "metrics_2026.csv"
    assert dataset.row_count == 100
    assert dataset.column_count == 5
    assert dataset.status == DatasetStatus.uploaded

    retrieved = get_dataset(db_session, dataset.id)
    assert retrieved is not None
    assert retrieved.id == dataset.id
    assert retrieved.filename == "metrics_2026.csv"


def test_create_dataset_validation(db_session):
    with pytest.raises(EntityValidationError, match="filename cannot be empty"):
        create_dataset(db=db_session, filename="")

    with pytest.raises(EntityValidationError, match="filename cannot be empty"):
        create_dataset(db=db_session, filename="   ")

    with pytest.raises(EntityValidationError, match="row_count cannot be negative"):
        create_dataset(db=db_session, filename="test.csv", row_count=-1)

    with pytest.raises(EntityValidationError, match="column_count cannot be negative"):
        create_dataset(db=db_session, filename="test.csv", column_count=-5)


def test_list_datasets_and_filter(db_session):
    create_dataset(db_session, filename="d1.csv", status=DatasetStatus.uploaded)
    create_dataset(db_session, filename="d2.csv", status=DatasetStatus.processing)
    create_dataset(db_session, filename="d3.csv", status=DatasetStatus.completed)

    all_datasets = list_datasets(db_session)
    assert len(all_datasets) == 3

    processing_only = list_datasets(db_session, status="processing")
    assert len(processing_only) == 1
    assert processing_only[0].filename == "d2.csv"

    paginated = list_datasets(db_session, skip=1, limit=1)
    assert len(paginated) == 1


def test_update_dataset_status(db_session):
    dataset = create_dataset(db_session, filename="d1.csv", status="uploaded")

    updated = update_dataset_status(
        db_session,
        dataset.id,
        status="completed",
        row_count=150,
        column_count=8,
    )

    assert updated.status == DatasetStatus.completed
    assert updated.row_count == 150
    assert updated.column_count == 8
    assert updated.cleaned_at is not None

    with pytest.raises(DatasetNotFoundError):
        update_dataset_status(db_session, 99999, status="failed")


def test_delete_dataset_cascades(db_session):
    dataset = create_dataset(db_session, filename="cascade_test.csv")

    save_data_quality_issues(
        db_session,
        dataset.id,
        [{"issue_type": "missing_value", "source_row": 3, "description": "Null val"}],
    )
    save_anomalies(
        db_session,
        dataset.id,
        [{
            "metric_name": "sales",
            "record_date": "2026-10-01",
            "actual_value": 50.0,
            "baseline_value": 100.0,
            "direction": "down",
        }],
    )

    assert len(get_data_quality_issues(db_session, dataset.id)) == 1
    assert len(get_anomalies(db_session, dataset.id)) == 1

    deleted = delete_dataset(db_session, dataset.id)
    assert deleted is True
    assert get_dataset(db_session, dataset.id) is None

    # Verify children were cascaded
    assert db_session.query(DataQualityIssue).filter_by(dataset_id=dataset.id).count() == 0
    assert db_session.query(Anomaly).filter_by(dataset_id=dataset.id).count() == 0

    # Nonexistent dataset delete returns False
    assert delete_dataset(db_session, 99999) is False


# ============================================================================
# Data Quality Issues Tests
# ============================================================================

def test_save_and_get_data_quality_issues(db_session):
    dataset = create_dataset(db_session, filename="quality.csv")

    issues_input = [
        {
            "issue_type": "missing_date",
            "source_row": 2,
            "source_column": "order_date",
            "description": "Date missing",
            "resolution": "flagged_unresolved",
        },
        {
            "issue_type": "invalid_type",
            "source_row": 5,
            "source_column": "revenue",
            "description": "Value 'abc' not numeric",
            "resolution": "dropped",
            "severity": "high",
        },
        {
            "issue_type": "duplicate_row",
            "source_row": 8,
            "description": "Duplicate record",
        },
    ]

    saved = save_data_quality_issues(db_session, dataset.id, issues_input)
    assert len(saved) == 3

    assert saved[0].issue_type == IssueType.missing_date
    assert saved[0].severity == Severity.high  # inferred for missing_date
    assert saved[0].source_row == 2
    assert saved[0].source_column == "order_date"

    assert saved[1].issue_type == IssueType.invalid_type
    assert saved[1].severity == Severity.high  # explicitly provided
    assert saved[1].resolution == Resolution.dropped

    assert saved[2].severity == Severity.low  # inferred for duplicate_row

    # Filtering
    missing_dates = get_data_quality_issues(db_session, dataset.id, issue_type="missing_date")
    assert len(missing_dates) == 1
    assert missing_dates[0].source_row == 2


def test_save_quality_issues_errors(db_session):
    dataset = create_dataset(db_session, filename="err.csv")

    with pytest.raises(DatasetNotFoundError):
        save_data_quality_issues(db_session, 99999, [])

    with pytest.raises(EntityValidationError, match="missing 'issue_type'"):
        save_data_quality_issues(db_session, dataset.id, [{"description": "No type"}])

    with pytest.raises(EntityValidationError, match="Invalid value 'nonexistent_issue'"):
        save_data_quality_issues(
            db_session, dataset.id, [{"issue_type": "nonexistent_issue"}]
        )


def test_save_profiling_results(db_session):
    dataset = create_dataset(db_session, filename="profile.csv")

    profile_data = {
        "row_count": 250,
        "column_count": 12,
        "duplicate_row_count": 3,
        "candidate_date_columns": ["date"],
        "candidate_numeric_columns": ["sales", "visits"],
    }

    updated = save_profiling_results(db_session, dataset.id, profile_data)
    assert updated.row_count == 250
    assert updated.column_count == 12


# ============================================================================
# Anomaly Tests
# ============================================================================

def test_save_and_get_anomalies(db_session):
    dataset = create_dataset(db_session, filename="anomalies.csv")

    anomalies_data = [
        {
            "metric_name": "orders",
            "record_date": date(2026, 10, 15),
            "actual_value": 45.0,
            "baseline_value": 120.0,
            "baseline_std": 15.0,
            "z_score": -5.0,
            "change_percent": -62.5,
            "direction": "down",
            "severity": "high",
            "detection_method": "zscore",
            "source_row": 16,
        },
        {
            "metric_name": "orders",
            "record_date": "2026-10-16",
            "actual_value": 200.0,
            "baseline_value": 110.0,
            "baseline_std": 20.0,
            "z_score": 4.5,
            "change_percent": 81.8,
            "direction": "up",
            "severity": "medium",
            "short_explanation": "Surge in flash sale orders",
        },
    ]

    saved = save_anomalies(db_session, dataset.id, anomalies_data)
    assert len(saved) == 2

    first = saved[0]
    assert first.metric_name == "orders"
    assert first.record_date == date(2026, 10, 15)
    assert first.actual_value == 45.0
    assert first.baseline_value == 120.0
    assert first.baseline_std == 15.0
    assert first.z_score == -5.0
    assert first.change_percent == -62.5
    assert first.direction == Direction.down
    assert first.severity == Severity.high
    assert first.detection_method == DetectionMethod.zscore
    assert "Row 16" in first.short_explanation

    second = saved[1]
    assert second.record_date == date(2026, 10, 16)
    assert second.direction == Direction.up
    assert second.short_explanation == "Surge in flash sale orders"

    # Query with filters
    high_anomalies = get_anomalies(db_session, dataset.id, severity="high")
    assert len(high_anomalies) == 1
    assert high_anomalies[0].record_date == date(2026, 10, 15)

    up_anomalies = get_anomalies(db_session, dataset.id, direction="up")
    assert len(up_anomalies) == 1
    assert up_anomalies[0].actual_value == 200.0


def test_save_anomalies_validation(db_session):
    dataset = create_dataset(db_session, filename="val.csv")

    with pytest.raises(DatasetNotFoundError):
        save_anomalies(db_session, 99999, [])

    with pytest.raises(EntityValidationError, match="requires a non-empty 'metric_name'"):
        save_anomalies(db_session, dataset.id, [{"record_date": "2026-10-01"}])

    with pytest.raises(EntityValidationError, match="Record date cannot be null"):
        save_anomalies(
            db_session, dataset.id, [{"metric_name": "sales", "record_date": None}]
        )

    with pytest.raises(EntityValidationError, match="Cannot parse 'invalid-date'"):
        save_anomalies(
            db_session, dataset.id, [{"metric_name": "sales", "record_date": "invalid-date"}]
        )


# ============================================================================
# Metric Values Tests (Selective / Optional)
# ============================================================================

def test_save_and_get_metric_values(db_session):
    dataset = create_dataset(db_session, filename="metrics.csv")

    df = pd.DataFrame({
        "metric_name": ["revenue", "revenue", "visitors"],
        "record_date": ["2026-10-01", "2026-10-02", "2026-10-01"],
        "value": [1500.5, 2300.0, 450.0],
        "unit": ["USD", "USD", "count"],
        "source_row": [2, 3, 2],
    })

    saved = save_metric_values(db_session, dataset.id, df)
    assert len(saved) == 3

    rev_metrics = get_metric_values(db_session, dataset.id, metric_name="revenue")
    assert len(rev_metrics) == 2
    assert rev_metrics[0].value == 1500.5
    assert rev_metrics[1].value == 2300.0


# ============================================================================
# High-Level Pipeline Run & Transaction Rollback Tests
# ============================================================================

def test_save_pipeline_run_success(db_session):
    quality_issues = [
        {
            "issue_type": "missing_value",
            "source_row": 4,
            "source_column": "conversion_rate",
            "description": "Missing value",
        }
    ]

    anomalies = [
        {
            "metric_name": "conversion_rate",
            "record_date": "2026-10-18",
            "actual_value": 0.01,
            "baseline_value": 0.04,
            "baseline_std": 0.005,
            "z_score": -6.0,
            "change_percent": -75.0,
            "direction": "down",
            "severity": "high",
        }
    ]

    dataset = save_pipeline_run(
        db=db_session,
        filename="pipeline_run.csv",
        storage_path="/uploads/pipeline_run.csv",
        row_count=50,
        column_count=4,
        status="completed",
        profile={"row_count": 50, "column_count": 4},
        quality_issues=quality_issues,
        anomalies=anomalies,
        save_metrics=False,  # default: avoid storing raw metric rows
    )

    assert dataset.id is not None
    assert dataset.status == DatasetStatus.completed
    assert dataset.cleaned_at is not None

    # Verify relationships
    assert len(dataset.quality_issues) == 1
    assert dataset.quality_issues[0].issue_type == IssueType.missing_value

    assert len(dataset.anomalies) == 1
    assert dataset.anomalies[0].metric_name == "conversion_rate"

    # Verify raw metric rows were not stored
    assert len(dataset.metric_values) == 0


def test_transaction_rollback_on_failure(db_session):
    """
    Ensure that if an error occurs during multi-entity persistence,
    all changes are rolled back and no partial records persist.
    """
    valid_dataset_filename = "rollback_test.csv"

    # Attempt to persist with an invalid anomaly record
    with pytest.raises(PersistenceError):
        save_pipeline_run(
            db=db_session,
            filename=valid_dataset_filename,
            anomalies=[
                {
                    "metric_name": "good_metric",
                    "record_date": "2026-10-01",
                    "actual_value": 100.0,
                },
                {
                    "metric_name": "bad_metric",
                    "record_date": "NOT_A_DATE",  # causes parsing failure
                    "actual_value": 200.0,
                },
            ],
        )

    # Verify the entire transaction rolled back: dataset was not created
    existing_datasets = db_session.query(Dataset).filter_by(filename=valid_dataset_filename).all()
    assert len(existing_datasets) == 0

    # Verify no orphan anomalies exist
    assert db_session.query(Anomaly).count() == 0
