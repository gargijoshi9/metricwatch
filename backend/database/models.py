import enum
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, Text, Enum, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class DatasetStatus(enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Severity(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Direction(enum.Enum):
    up = "up"
    down = "down"


class DetectionMethod(enum.Enum):
    zscore = "zscore"


class ReportStatus(enum.Enum):
    pending = "pending"
    generated = "generated"
    failed = "failed"


class AlertStatus(enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


class IssueType(enum.Enum):
    missing_value = "missing_value"
    invalid_type = "invalid_type"
    missing_date = "missing_date"
    duplicate_row = "duplicate_row"


class Resolution(enum.Enum):
    dropped = "dropped"
    interpolated = "interpolated"
    forward_filled = "forward_filled"
    flagged_unresolved = "flagged_unresolved"


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    row_count = Column(Integer)
    column_count = Column(Integer)
    status = Column(Enum(DatasetStatus), default=DatasetStatus.uploaded)
    cleaned_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    storage_path = Column(String)

    metric_values = relationship("MetricValue", back_populates="dataset", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="dataset", cascade="all, delete-orphan")
    quality_issues = relationship("DataQualityIssue", back_populates="dataset", cascade="all, delete-orphan")


class MetricValue(Base):
    __tablename__ = "metric_values"

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    metric_name = Column(String, nullable=False)
    record_date = Column(Date, nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=True)
    source_row = Column(Integer)
    source_column = Column(String)

    dataset = relationship("Dataset", back_populates="metric_values")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    metric_name = Column(String, nullable=False)
    record_date = Column(Date, nullable=False)
    actual_value = Column(Float)
    baseline_value = Column(Float)
    baseline_std = Column(Float)
    z_score = Column(Float)
    change_percent = Column(Float)
    direction = Column(Enum(Direction))
    severity = Column(Enum(Severity))
    detection_method = Column(Enum(DetectionMethod), default=DetectionMethod.zscore)
    short_explanation = Column(String)
    correlated_with = Column(Integer, ForeignKey("anomalies.id"), nullable=True)

    dataset = relationship("Dataset", back_populates="anomalies")
    report = relationship("Report", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="anomaly", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id", ondelete="CASCADE"))
    summary = Column(Text)
    recommendations = Column(Text, nullable=True)
    status = Column(Enum(ReportStatus), default=ReportStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    anomaly = relationship("Anomaly", back_populates="report")
    alerts = relationship("Alert", back_populates="report", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id", ondelete="CASCADE"))
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"))
    recipient = Column(String, nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.pending)
    attempt_count = Column(Integer, default=0)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    anomaly = relationship("Anomaly", back_populates="alerts")
    report = relationship("Report", back_populates="alerts")


class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    issue_type = Column(Enum(IssueType))
    severity = Column(Enum(Severity))
    source_row = Column(Integer, nullable=True)
    source_column = Column(String, nullable=True)
    description = Column(Text)
    resolution = Column(Enum(Resolution))

    dataset = relationship("Dataset", back_populates="quality_issues")