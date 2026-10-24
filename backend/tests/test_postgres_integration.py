"""PostgreSQL integration tests for MetricWatch.

These tests run exclusively against a dedicated test database specified via
TEST_DATABASE_URL (or POSTGRES_TEST_DATABASE_URL).

SAFETY GUARANTEE:
Integration tests will NEVER run against the development or production database
(DATABASE_URL). If TEST_DATABASE_URL is not set, this entire module is safely skipped.
"""

from datetime import date, datetime, timezone
import os
from dotenv import load_dotenv
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load .env from backend or root directory
load_dotenv()

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
)
from database.repository import (
    PersistenceError,
    create_dataset,
    get_dataset,
    delete_dataset,
    save_data_quality_issues,
    save_anomalies,
    save_metric_values,
    save_pipeline_run,
)

# ---------------------------------------------------------------------------
# Safety Guard & Fixtures
# ---------------------------------------------------------------------------

TEST_DB_ENV_VARS = ["TEST_DATABASE_URL", "POSTGRES_TEST_DATABASE_URL"]


def get_test_postgres_url() -> str | None:
    for var in TEST_DB_ENV_VARS:
        url = os.getenv(var)
        if url and url.strip():
            return url.strip()
    return None


TEST_PG_URL = get_test_postgres_url()
MAIN_APP_DB_URL = os.getenv("DATABASE_URL", "").strip()

# Module-level skip if no dedicated test database is configured
if not TEST_PG_URL:
    pytest.skip(
        "TEST_DATABASE_URL / POSTGRES_TEST_DATABASE_URL is not configured. "
        "Skipping PostgreSQL integration tests to protect development and production databases.",
        allow_module_level=True,
    )

# Strict protection: ensure test database is NOT the main development/production database
if MAIN_APP_DB_URL and TEST_PG_URL == MAIN_APP_DB_URL:
    raise RuntimeError(
        "CRITICAL SAFETY VIOLATION: TEST_DATABASE_URL is identical to DATABASE_URL. "
        "Destructive integration tests must NEVER be executed against the development "
        "or production database."
    )


@pytest.fixture(scope="module")
def pg_engine():
    """Module-scoped PostgreSQL test engine."""
    engine = create_engine(TEST_PG_URL)

    # Ensure tables and enums exist on the dedicated test database
    Base.metadata.create_all(bind=engine)

    yield engine

    # Optional: clean up tables after all integration tests finish
    # Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def pg_session(pg_engine):
    """Function-scoped PostgreSQL session with transaction isolation."""
    connection = pg_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = Session()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


# ---------------------------------------------------------------------------
# PostgreSQL Integration Tests
# ---------------------------------------------------------------------------

@pytest.mark.postgres_integration
def test_postgres_dataset_persistence(pg_session):
    """Verify standard dataset insertion and retrieval on live PostgreSQL."""
    dataset = create_dataset(
        db=pg_session,
        filename="pg_test_orders.csv",
        storage_path="s3://metricwatch/pg_test_orders.csv",
        row_count=500,
        column_count=10,
        status=DatasetStatus.uploaded,
    )

    assert dataset.id is not None
    assert dataset.uploaded_at is not None
    assert dataset.status == DatasetStatus.uploaded

    retrieved = get_dataset(pg_session, dataset.id)
    assert retrieved is not None
    assert retrieved.filename == "pg_test_orders.csv"


@pytest.mark.postgres_integration
def test_postgres_foreign_key_and_cascade_delete(pg_session):
    """
    Verify PostgreSQL native foreign keys and ON DELETE CASCADE behavior.
    Deleting a parent Dataset must automatically remove child anomalies,
    data quality issues, and metric values at the PostgreSQL engine level.
    """
    dataset = create_dataset(
        db=pg_session,
        filename="pg_cascade_test.csv",
        status=DatasetStatus.completed,
    )

    # Add child DataQualityIssue
    save_data_quality_issues(
        db=pg_session,
        dataset_id=dataset.id,
        quality_issues=[
            {
                "issue_type": "missing_value",
                "source_row": 12,
                "source_column": "revenue",
                "description": "Missing revenue entry",
            }
        ],
    )

    # Add child Anomaly
    save_anomalies(
        db=pg_session,
        dataset_id=dataset.id,
        anomalies=[
            {
                "metric_name": "revenue",
                "record_date": date(2026, 10, 20),
                "actual_value": 150.0,
                "baseline_value": 900.0,
                "baseline_std": 100.0,
                "z_score": -7.5,
                "change_percent": -83.3,
                "direction": "down",
                "severity": "high",
                "detection_method": "zscore",
            }
        ],
    )

    # Add child MetricValue
    save_metric_values(
        db=pg_session,
        dataset_id=dataset.id,
        metric_values=[
            {
                "metric_name": "revenue",
                "record_date": date(2026, 10, 20),
                "value": 150.0,
                "source_row": 12,
            }
        ],
    )

    # Verify children exist in PostgreSQL
    assert pg_session.query(DataQualityIssue).filter_by(dataset_id=dataset.id).count() == 1
    assert pg_session.query(Anomaly).filter_by(dataset_id=dataset.id).count() == 1
    assert pg_session.query(MetricValue).filter_by(dataset_id=dataset.id).count() == 1

    # Delete parent dataset
    deleted = delete_dataset(pg_session, dataset.id)
    assert deleted is True

    # PostgreSQL must have cascaded deletions
    assert pg_session.query(Dataset).filter_by(id=dataset.id).first() is None
    assert pg_session.query(DataQualityIssue).filter_by(dataset_id=dataset.id).count() == 0
    assert pg_session.query(Anomaly).filter_by(dataset_id=dataset.id).count() == 0
    assert pg_session.query(MetricValue).filter_by(dataset_id=dataset.id).count() == 0


@pytest.mark.postgres_integration
def test_postgres_transaction_rollback_integrity(pg_session):
    """
    Verify PostgreSQL transaction rollback behavior.
    When a batch insert fails (e.g. invalid date / constraint error),
    PostgreSQL must abort the transaction and rollback without leaving partial rows.
    """
    unique_name = f"pg_rollback_{int(datetime.now(timezone.utc).timestamp())}.csv"

    with pytest.raises(PersistenceError):
        save_pipeline_run(
            db=pg_session,
            filename=unique_name,
            anomalies=[
                {
                    "metric_name": "valid_metric",
                    "record_date": "2026-10-01",
                    "actual_value": 100.0,
                },
                {
                    "metric_name": "invalid_metric",
                    "record_date": "UNPARSABLE_DATE",
                    "actual_value": 200.0,
                },
            ],
        )

    # Verify nothing was committed to PostgreSQL
    assert pg_session.query(Dataset).filter_by(filename=unique_name).count() == 0
