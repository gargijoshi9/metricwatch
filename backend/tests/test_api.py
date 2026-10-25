"""Integration tests for the MetricWatch REST API layer."""

from datetime import date
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.deps import get_db
from database.models import (
    Base,
    Dataset,
    DatasetStatus,
    Anomaly,
    DataQualityIssue,
    Severity,
    Direction,
    DetectionMethod,
    IssueType,
    Resolution,
)
from database.repository import (
    create_dataset,
    save_anomalies,
    save_data_quality_issues,
)
from main import app


@pytest.fixture
def db_session():
    """Create a fresh in-memory SQLite database and session for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

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


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ============================================================================
# Health and OpenAPI Tests
# ============================================================================

def test_health_check_healthy(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "timestamp" in data


def test_health_check_unhealthy(client):
    class BrokenDbSession:
        def execute(self, *args, **kwargs):
            raise RuntimeError("Database connection timed out")

    def failing_db():
        yield BrokenDbSession()

    app.dependency_overrides[get_db] = failing_db
    try:
        response = client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
    finally:
        app.dependency_overrides.clear()


def test_root_and_openapi(client):
    root_resp = client.get("/")
    assert root_resp.status_code == 200
    assert "docs" in root_resp.json()

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    assert openapi_resp.json()["info"]["title"] == "MetricWatch API"

    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200


# ============================================================================
# Dataset Upload & Ingestion Tests
# ============================================================================

def test_upload_valid_csv_success(client, db_session):
    csv_content = (
        "date,revenue,orders\n"
        "2026-01-01,100,10\n"
        "2026-01-02,102,11\n"
        "2026-01-03,98,9\n"
        "2026-01-04,101,10\n"
        "2026-01-05,99,10\n"
        "2026-01-06,100,10\n"
        "2026-01-07,102,11\n"
        "2026-01-08,98,9\n"
        "2026-01-09,101,10\n"
        "2026-01-10,30,2\n"  # Anomaly drop in revenue & orders
    )

    response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("sales.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )

    assert response.status_code == 201
    data = response.json()
    assert "dataset" in data
    assert data["dataset"]["filename"] == "sales.csv"
    assert data["dataset"]["status"] == "completed"
    assert data["dataset"]["row_count"] == 10
    assert data["dataset"]["column_count"] == 3
    assert data["anomaly_count"] >= 1

    # Verify database persistence
    dataset_id = data["dataset"]["id"]
    dataset_in_db = db_session.query(Dataset).filter_by(id=dataset_id).first()
    assert dataset_in_db is not None
    assert dataset_in_db.filename == "sales.csv"


def test_upload_invalid_file_extension(client):
    response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("data.json", io.BytesIO(b'{"key": "val"}'), "application/json")},
    )
    assert response.status_code == 400
    assert "Only CSV files (.csv) are currently supported" in response.json()["detail"]


def test_upload_empty_file(client):
    response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_oversized_file(client, monkeypatch):
    monkeypatch.setattr("api.v1.datasets.MAX_UPLOAD_SIZE_BYTES", 50)
    oversized_content = "date,revenue\n" + ("2026-01-01,100\n" * 10)

    response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("large.csv", io.BytesIO(oversized_content.encode("utf-8")), "text/csv")},
    )
    assert response.status_code == 413
    assert "exceeds maximum allowed limit" in response.json()["detail"]


def test_upload_with_explicit_columns(client):
    csv_content = (
        "record_timestamp,sales_amount,units\n"
        "2026-02-01,500,5\n"
        "2026-02-02,510,6\n"
        "2026-02-03,490,5\n"
        "2026-02-04,505,5\n"
        "2026-02-05,495,5\n"
        "2026-02-06,500,5\n"
        "2026-02-07,510,6\n"
        "2026-02-08,490,5\n"
        "2026-02-09,505,5\n"
        "2026-02-10,50,1\n"
    )

    response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("explicit.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
        data={"date_column": "record_timestamp", "metric_columns": "sales_amount,units"},
    )
    assert response.status_code == 201
    assert response.json()["dataset"]["status"] == "completed"


# ============================================================================
# Dataset Listing and Detail Tests
# ============================================================================

def test_list_datasets_and_pagination(client, db_session):
    create_dataset(db_session, filename="set1.csv", status=DatasetStatus.completed)
    create_dataset(db_session, filename="set2.csv", status=DatasetStatus.uploaded)
    create_dataset(db_session, filename="set3.csv", status=DatasetStatus.completed)

    # List all
    resp = client.get("/api/v1/datasets")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3

    # Pagination
    paginated_resp = client.get("/api/v1/datasets?skip=1&limit=1")
    assert paginated_resp.status_code == 200
    pdata = paginated_resp.json()
    assert len(pdata["items"]) == 1
    assert pdata["skip"] == 1
    assert pdata["limit"] == 1

    # Filter by status
    status_resp = client.get("/api/v1/datasets?status=uploaded")
    assert status_resp.status_code == 200
    assert status_resp.json()["total"] == 1
    assert status_resp.json()["items"][0]["filename"] == "set2.csv"


def test_get_dataset_detail(client, db_session):
    ds = create_dataset(db_session, filename="details.csv", row_count=120, column_count=4)

    resp = client.get(f"/api/v1/datasets/{ds.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == ds.id
    assert data["filename"] == "details.csv"
    assert data["row_count"] == 120

    # Not found
    missing_resp = client.get("/api/v1/datasets/999999")
    assert missing_resp.status_code == 404
    assert "not found" in missing_resp.json()["detail"].lower()


def test_get_dataset_profile(client, db_session):
    ds = create_dataset(db_session, filename="profile_check.csv", row_count=200, column_count=6)

    resp = client.get(f"/api/v1/datasets/{ds.id}/profile")
    assert resp.status_code == 200
    data = resp.json()
    assert data["dataset_id"] == ds.id
    assert data["row_count"] == 200
    assert data["column_count"] == 6
    assert "persisted_fields" in data
    assert "notice" in data

    missing = client.get("/api/v1/datasets/999999/profile")
    assert missing.status_code == 404


def test_get_dataset_quality_issues(client, db_session):
    ds = create_dataset(db_session, filename="qi.csv")
    save_data_quality_issues(
        db_session,
        ds.id,
        [
            {
                "issue_type": "missing_value",
                "source_row": 3,
                "source_column": "revenue",
                "description": "Empty revenue cell",
            },
            {
                "issue_type": "invalid_type",
                "source_row": 5,
                "source_column": "orders",
                "description": "Text in numeric column",
            },
        ],
    )

    resp = client.get(f"/api/v1/datasets/{ds.id}/quality-issues")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["issue_type"] == "missing_value"

    # Filter by issue_type
    filtered_resp = client.get(f"/api/v1/datasets/{ds.id}/quality-issues?issue_type=invalid_type")
    assert filtered_resp.status_code == 200
    assert filtered_resp.json()["total"] == 1
    assert filtered_resp.json()["items"][0]["source_column"] == "orders"

    # Not found
    missing_resp = client.get("/api/v1/datasets/999999/quality-issues")
    assert missing_resp.status_code == 404


def test_get_dataset_anomalies(client, db_session):
    ds = create_dataset(db_session, filename="anoms.csv")
    save_anomalies(
        db_session,
        ds.id,
        [
            {
                "metric_name": "conversion_rate",
                "record_date": "2026-03-01",
                "actual_value": 0.01,
                "baseline_value": 0.05,
                "baseline_std": 0.005,
                "z_score": -8.0,
                "direction": "down",
                "severity": "high",
            }
        ],
    )

    resp = client.get(f"/api/v1/datasets/{ds.id}/anomalies")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["metric_name"] == "conversion_rate"
    assert data["items"][0]["severity"] == "high"

    missing_resp = client.get("/api/v1/datasets/999999/anomalies")
    assert missing_resp.status_code == 404


# ============================================================================
# Anomalies Endpoint Tests
# ============================================================================

def test_list_all_anomalies_and_filters(client, db_session):
    ds1 = create_dataset(db_session, filename="file1.csv")
    ds2 = create_dataset(db_session, filename="file2.csv")

    save_anomalies(
        db_session,
        ds1.id,
        [
            {
                "metric_name": "clicks",
                "record_date": "2026-03-01",
                "actual_value": 10.0,
                "baseline_value": 100.0,
                "direction": "down",
                "severity": "high",
            }
        ],
    )
    save_anomalies(
        db_session,
        ds2.id,
        [
            {
                "metric_name": "impressions",
                "record_date": "2026-03-02",
                "actual_value": 5000.0,
                "baseline_value": 1000.0,
                "direction": "up",
                "severity": "low",
            }
        ],
    )

    # List all
    all_resp = client.get("/api/v1/anomalies")
    assert all_resp.status_code == 200
    assert all_resp.json()["total"] == 2

    # Filter by severity
    high_resp = client.get("/api/v1/anomalies?severity=high")
    assert high_resp.status_code == 200
    assert high_resp.json()["total"] == 1
    assert high_resp.json()["items"][0]["metric_name"] == "clicks"

    # Filter by direction
    up_resp = client.get("/api/v1/anomalies?direction=up")
    assert up_resp.status_code == 200
    assert up_resp.json()["total"] == 1
    assert up_resp.json()["items"][0]["metric_name"] == "impressions"


def test_get_and_patch_anomaly(client, db_session):
    ds = create_dataset(db_session, filename="patch_test.csv")
    anoms = save_anomalies(
        db_session,
        ds.id,
        [
            {
                "metric_name": "cpu_load",
                "record_date": "2026-03-05",
                "actual_value": 99.0,
                "baseline_value": 20.0,
                "direction": "up",
                "severity": "medium",
                "short_explanation": "Spike detected",
            }
        ],
    )
    anom_id = anoms[0].id

    # Get single detail
    detail_resp = client.get(f"/api/v1/anomalies/{anom_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == anom_id
    assert detail_resp.json()["severity"] == "medium"

    # PATCH supported fields
    patch_resp = client.patch(
        f"/api/v1/anomalies/{anom_id}",
        json={"severity": "high", "short_explanation": "Confirmed critical infrastructure bottleneck"},
    )
    assert patch_resp.status_code == 200
    pdata = patch_resp.json()
    assert pdata["severity"] == "high"
    assert pdata["short_explanation"] == "Confirmed critical infrastructure bottleneck"

    # Re-fetch to ensure persistence
    refetched = client.get(f"/api/v1/anomalies/{anom_id}").json()
    assert refetched["severity"] == "high"

    # PATCH with unsupported field 'resolution'
    unsupported_resp = client.patch(
        f"/api/v1/anomalies/{anom_id}",
        json={"resolution": "resolved"},
    )
    assert unsupported_resp.status_code == 400
    assert "resolution" in unsupported_resp.json()["detail"].lower()

    # PATCH missing anomaly
    missing_patch = client.patch("/api/v1/anomalies/99999", json={"severity": "low"})
    assert missing_patch.status_code == 404
