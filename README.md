# MetricWatch

> **Autonomous business metric monitoring and anomaly alerting system**

MetricWatch is a monitoring system that automatically watches recurring business metrics, detects statistically significant anomalies, generates a human-readable explanation, and delivers an alert when something requires attention.

Instead of requiring someone to repeatedly open spreadsheets or dashboards and look for unusual changes, MetricWatch continuously performs that monitoring in the background.

---

## Problem

Businesses regularly track metrics such as:

* Revenue
* Orders
* Website traffic
* Conversion rate
* Refunds
* Customer activity

The problem is not that these metrics are unavailable. The problem is that someone has to continuously monitor them.

Manual monitoring has several weaknesses:

* It is repetitive and time-consuming.
* Important anomalies can be missed.
* Small teams may not have a dedicated analyst monitoring metrics continuously.
* By the time an issue is noticed, valuable time may already have been lost.
* Dashboards show large amounts of information but do not necessarily tell someone when they need to act.

For example, suppose a business normally has a conversion rate around 3%.

One day:

```text
Traffic        +20%
Conversion     -42%
Revenue        -35%
Refunds        +150%
```

A dashboard can display all four numbers.

MetricWatch is designed to answer the more useful question:

> **"Did something unusual happen, and does someone need to know about it?"**

---

# What MetricWatch Does

MetricWatch turns raw business data into actionable alerts:

```text
Business Data
      ↓
Data Cleaning
      ↓
Statistical Anomaly Detection
      ↓
Cross-Metric Analysis
      ↓
Human-Readable Explanation
      ↓
Alert
```

The system is designed around a simple principle:

> **Do the statistical reasoning deterministically; use AI to communicate and contextualize the results.**

The anomaly detector does not rely on an LLM to decide whether a number is abnormal.

Instead, statistical methods identify anomalies first. The LLM is then used as an interpretation and summarization layer.

---

# Core Features

### 1. Data Ingestion

MetricWatch accepts structured business data from sources such as:

* CSV files
* Excel spreadsheets

The ingestion layer:

* Loads the data using pandas.
* Standardizes column names.
* Converts dates and numerical fields to appropriate types.
* Handles missing or invalid values explicitly.
* Produces a clean DataFrame for downstream processing.

---

### 2. Statistical Anomaly Detection

MetricWatch establishes a historical baseline for each metric using a configurable rolling window.

For example:

```text
7-day rolling mean
7-day rolling standard deviation
```

The latest value is then compared against that baseline using a z-score:

$$
z = \frac{x-\mu}{\sigma}
$$

where:

* `x` = current value
* `μ` = rolling baseline mean
* `σ` = rolling standard deviation

If the magnitude of the z-score exceeds a configured threshold, the observation is flagged as an anomaly.

Example:

```text
Metric:           Conversion Rate
Current Value:    1.8%
7-Day Mean:       3.1%
Z-Score:          -2.4
Percentage Change: -42%
Direction:        Down
```

The detector produces structured anomaly records rather than directly generating natural-language explanations.

---

### 3. Severity Classification

Not every anomaly deserves the same level of attention.

MetricWatch can classify anomalies according to their statistical magnitude and business impact.

For example:

```text
Normal
   ↓
Low
   ↓
Medium
   ↓
High
   ↓
Critical
```

Severity thresholds are configurable and can be tuned based on the characteristics of the monitored business.

---

### 4. Cross-Metric Analysis

A single anomaly may not tell the complete story.

MetricWatch therefore considers anomalies across multiple metrics occurring during the same period.

For example:

```text
Traffic        ↑ 20%
Conversion     ↓ 42%
Revenue        ↓ 35%
Refunds        ↑ 150%
```

Rather than treating these as four unrelated events, the intelligence layer can identify their co-occurrence and provide the combined context to the summarization layer.

This allows MetricWatch to surface observations such as:

> Traffic increased while conversion deteriorated significantly, coinciding with a decline in revenue and an increase in refunds.

The system does **not** claim that correlation proves causation. Potential explanations are presented as hypotheses that may require further investigation.

---

### 5. Rule-Based Explanations

MetricWatch includes a deterministic rule-based explanation layer.

Example:

```text
Conversion rate fell 42% below its 7-day baseline
on September 10 (z = -2.4).
```

This provides:

* A reliable fallback.
* Predictable output.
* No dependency on an external LLM API.
* A transparent explanation of how the alert was generated.

---

### 6. LLM-Enhanced Summarization

The LLM layer receives structured anomaly information rather than raw business data.

For example:

```json
{
  "metric": "conversion_rate",
  "value": 1.8,
  "baseline_mean": 3.1,
  "z_score": -2.4,
  "pct_change": -42,
  "direction": "down"
}
```

It can then generate a concise business-oriented summary.

The LLM is intentionally not responsible for statistical anomaly detection.

Its role is to:

* Combine multiple anomalies.
* Explain the observed pattern in plain language.
* Highlight relationships between metrics.
* Produce concise summaries suitable for business users.

A rule-based fallback remains available if the LLM service is unavailable.

---

### 7. Alert Delivery

When an anomaly meets the configured alert criteria, MetricWatch can deliver the generated summary through email.

The goal is to avoid unnecessary notifications and reduce alert fatigue.

The system should notify users when an anomaly is meaningful rather than sending an alert for every minor fluctuation.

---

### 8. Historical Storage

Detected alerts can be stored for historical analysis.

The stored information can include:

```text
Timestamp
Metric
Value
Baseline
Z-Score
Percentage Change
Severity
Generated Summary
```

This creates an audit trail of previously detected issues.

---

# System Architecture

MetricWatch follows a layered architecture with clear separation of responsibilities.

```text
                         ┌─────────────────────┐
                         │    Business Data    │
                         │     CSV / Excel     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     INGESTION       │
                         │                     │
                         │ Load + Clean +      │
                         │ Validate Data       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      DETECTION      │
                         │                     │
                         │ Rolling Baseline    │
                         │ Z-Score             │
                         │ % Change            │
                         │ Severity            │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    INTELLIGENCE     │
                         │                     │
                         │ Cross-Metric        │
                         │ Analysis            │
                         │                     │
                         │ Rule-Based + LLM    │
                         │ Summarization       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      DELIVERY      │
                         │                     │
                         │ Email Alerts        │
                         │                     │
                         │ Historical Logging  │
                         └─────────────────────┘
```

---

# Backend Architecture

The backend contains the core monitoring logic.

```text
backend/
│
├── main.py
├── pipeline.py
│
├── ingestion/
│   ├── loader.py
│   └── cleaner.py
│
├── detection/
│   ├── baseline.py
│   ├── anomaly_detector.py
│   └── severity.py
│
├── intelligence/
│   ├── correlation.py
│   ├── rule_based.py
│   └── llm.py
│
├── delivery/
│   └── email.py
│
├── database/
│   └── database.py
│
└── tests/
```

### `main.py`

Application entry point and API layer.

### `pipeline.py`

Orchestrates the complete monitoring workflow.

It coordinates the different components rather than implementing all the logic itself.

### `ingestion/`

Responsible for reading and cleaning source data.

### `detection/`

Contains the statistical anomaly detection engine.

### `intelligence/`

Contains:

* Cross-metric correlation logic.
* Rule-based explanations.
* LLM-based summarization.

### `delivery/`

Responsible for sending alerts.

### `database/`

Responsible for persistent storage of historical alerts and related records.

### `tests/`

Contains unit and integration tests for the core pipeline.

---

# Frontend Architecture

The frontend is intentionally separated from the backend.

```text
frontend/
```

The frontend communicates with the backend through APIs rather than directly accessing the database or performing anomaly detection.

A future dashboard can provide:

```text
┌─────────────────────────────────────────────┐
│                 MetricWatch                 │
├─────────────────────────────────────────────┤
│                                             │
│  Active Alerts                              │
│                                             │
│  Conversion Rate    ↓ 42%       HIGH        │
│  Revenue            ↓ 35%       HIGH        │
│  Refunds            ↑ 150%      HIGH        │
│                                             │
├─────────────────────────────────────────────┤
│ Latest Summary                              │
│                                             │
│ Traffic increased while conversion          │
│ deteriorated significantly...               │
│                                             │
├─────────────────────────────────────────────┤
│ Alert History                               │
│                                             │
│ Date       Metric          Severity         │
│ Sep 10     Conversion      High             │
│ Sep 07     Refunds         Medium           │
│ Sep 03     Revenue         Low              │
└─────────────────────────────────────────────┘
```

The frontend is a presentation layer; the backend remains responsible for the underlying analysis.

---

# End-to-End Workflow

A typical MetricWatch run looks like this:

### Step 1 — Load Data

```text
CSV / Excel
     ↓
loader.py
```

### Step 2 — Clean Data

```text
Raw DataFrame
     ↓
cleaner.py
     ↓
Validated DataFrame
```

### Step 3 — Establish Baseline

For each metric:

```text
Historical observations
        ↓
Rolling mean
        +
Rolling standard deviation
```

### Step 4 — Detect Anomalies

```text
Current value
      ↓
Compare against baseline
      ↓
Calculate z-score
      ↓
Calculate percentage change
      ↓
Flag anomaly if threshold exceeded
```

### Step 5 — Determine Severity

```text
Anomaly
   ↓
Severity classification
```

### Step 6 — Analyze Relationships

```text
Multiple anomalies
        ↓
Cross-metric analysis
        ↓
Combined context
```

### Step 7 — Generate Explanation

```text
Structured anomaly data
        ↓
Rule-based explanation
        +
Optional LLM summarization
```

### Step 8 — Store Result

```text
Alert
  ↓
Database
```

### Step 9 — Notify User

```text
Important alert
      ↓
Email
```

---

# Why Statistical Detection Instead of a Complex ML Model?

MetricWatch intentionally starts with an interpretable statistical approach rather than immediately using models such as:

* Isolation Forest
* LSTM
* Autoencoders
* Transformer-based forecasting

The goal is not to use the most complicated algorithm available.

The goal is to produce an anomaly detection system that is:

* Explainable
* Fast
* Easy to debug
* Easy to validate
* Easy to communicate to business users

A z-score based alert can be explained directly:

> "The current conversion rate is 2.4 standard deviations below its recent baseline."

That makes the detection process transparent.

More advanced detection algorithms can be introduced later if the data characteristics justify them.

---

# Design Principles

## Separation of Concerns

Each component has a specific responsibility.

```text
Ingestion     → What is the data?
Detection     → What is unusual?
Intelligence  → What does the pattern mean?
Delivery      → Who needs to know?
Database      → What happened historically?
Frontend      → How should the information be displayed?
```

This makes individual components replaceable without rewriting the entire system.

---

## Explainability First

The system should always be able to answer:

> **Why was this metric flagged?**

The statistical detection layer provides the evidence, while the intelligence layer converts that evidence into a readable explanation.

---

## AI Where It Adds Value

The LLM is not used simply to label the project as "AI-powered."

Statistical methods determine whether something unusual happened.

The LLM is used where natural-language reasoning and summarization are useful:

```text
Statistics
     ↓
Evidence
     ↓
LLM
     ↓
Explanation
```

---

## Alert Fatigue Prevention

A monitoring system that sends too many notifications quickly becomes useless.

MetricWatch therefore separates:

```text
Detection
```

from:

```text
Alerting
```

An anomaly can be detected and logged without necessarily triggering an immediate notification.

Only anomalies meeting configured severity or business criteria should generate alerts.

---

# Current Project Structure

```text
metricwatch/
│
├── README.md
├── .gitignore
├── .env.example
│
├── backend/
│   ├── requirements.txt
│   ├── main.py
│   ├── pipeline.py
│   │
│   ├── data/
│   │   ├── raw/
│   │   │   └── sample_business_data.csv
│   │   └── processed/
│   │
│   ├── ingestion/
│   │   ├── loader.py
│   │   └── cleaner.py
│   │
│   ├── detection/
│   │   ├── baseline.py
│   │   ├── anomaly_detector.py
│   │   └── severity.py
│   │
│   ├── intelligence/
│   │   ├── correlation.py
│   │   ├── rule_based.py
│   │   └── llm.py
│   │
│   ├── delivery/
│   │   └── email.py
│   │
│   ├── database/
│   │   └── database.py
│   │
│   └── tests/
│       ├── test_ingestion.py
│       ├── test_detection.py
│       └── test_pipeline.py
│
└── frontend/
```

---

# Development Roadmap

MetricWatch will be developed incrementally.

### Phase 1 — Core Data Pipeline

* [ ] CSV/Excel ingestion
* [ ] Data cleaning
* [ ] Missing-value handling
* [ ] Data validation

### Phase 2 — Anomaly Detection

* [ ] Rolling baseline
* [ ] Rolling standard deviation
* [ ] Z-score calculation
* [ ] Percentage change
* [ ] Severity classification

### Phase 3 — Intelligence

* [ ] Rule-based explanations
* [ ] Cross-metric analysis
* [ ] LLM summarization
* [ ] LLM fallback handling

### Phase 4 — Persistence & Alerts

* [ ] SQLite storage
* [ ] Alert history
* [ ] Email notifications
* [ ] Alert thresholds

### Phase 5 — Automation

* [ ] Scheduled execution
* [ ] Automatic data checks
* [ ] Automatic alert generation
* [ ] Error handling and logging

### Phase 6 — Frontend

* [ ] Dashboard
* [ ] Anomaly table
* [ ] Alert history
* [ ] Summary view
* [ ] Dataset upload
* [ ] Configuration/settings

---

# Example Alert

A final alert could look like:

```text
🚨 MetricWatch Alert

Date: September 10, 2026
Severity: High

Conversion Rate
----------------
Current:       1.05%
7-Day Baseline: 2.00%
Change:        -47.5%
Z-Score:       -3.1

Revenue
----------------
Change:        -38%

Refunds
----------------
Change:        +150%

Summary
----------------
Traffic increased during the period while conversion
rate declined substantially, coinciding with a significant
revenue decline and an increase in refunds. This pattern
may indicate a conversion or post-purchase issue and
requires further investigation.
```

The important distinction is that MetricWatch reports **observed evidence and plausible relationships** rather than pretending that correlation automatically identifies the root cause.

---

# Tech Stack

| Component         | Technology                     |
| ----------------- | ------------------------------ |
| Data Processing   | Python, pandas, NumPy          |
| Input Formats     | CSV, Excel                     |
| Anomaly Detection | Rolling statistics, z-score    |
| Backend           | Python                         |
| AI Summarization  | LLM API                        |
| Storage           | SQLite                         |
| Email             | SMTP / transactional email API |
| Frontend          | React / Next.js                |
| Testing           | pytest                         |
| Configuration     | python-dotenv                  |

---

# Running the Project

Backend setup:

```bash
cd backend

python -m venv .venv
```

Activate the environment:

### Windows

```bash
.venv\Scripts\activate
```

### Linux/macOS

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the application:

```bash
python main.py
```

The exact startup command may change depending on the backend framework and API implementation.

---

# Project Goal

MetricWatch is designed to demonstrate how a real monitoring system can combine:

```text
Data Engineering
       +
Statistics
       +
Automation
       +
LLM-based Interpretation
       +
Backend Engineering
       +
Frontend Visualization
```

The goal is not to build another dashboard that displays numbers.

The goal is to build a system that **watches those numbers, identifies meaningful deviations, explains what happened, and proactively brings the issue to the user's attention.**
