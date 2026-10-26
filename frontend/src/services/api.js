/**
 * MetricWatch API Client Service
 * Connects frontend React components to the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Check backend health & database connectivity
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend health check error:', err);
    return { status: 'unreachable', database: 'disconnected', error: err.message };
  }
}

/**
 * Upload a CSV dataset file to the backend
 * @param {File} file - CSV File object
 * @param {Object} options - Optional { dateColumn, metricColumns }
 */
export async function uploadDataset(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);

  if (options.dateColumn) {
    formData.append('date_column', options.dateColumn);
  }
  if (options.metricColumns && options.metricColumns.length > 0) {
    formData.append(
      'metric_columns',
      Array.isArray(options.metricColumns)
        ? options.metricColumns.join(',')
        : options.metricColumns
    );
  }

  const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = 'Upload failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `Server returned status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}

/**
 * List past ingested datasets
 */
export async function listDatasets(skip = 0, limit = 20) {
  const res = await fetch(`${API_BASE_URL}/datasets?skip=${skip}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch dataset list');
  return await res.json();
}

/**
 * Fetch anomalies detected for a dataset
 */
export async function getDatasetAnomalies(datasetId, params = {}) {
  const query = new URLSearchParams({
    skip: params.skip || 0,
    limit: params.limit || 100,
    ...(params.severity ? { severity: params.severity } : {}),
    ...(params.direction ? { direction: params.direction } : {}),
    ...(params.metricName ? { metric_name: params.metricName } : {}),
  });

  const res = await fetch(`${API_BASE_URL}/datasets/${datasetId}/anomalies?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch anomalies for dataset ${datasetId}`);
  return await res.json();
}

/**
 * Fetch data quality issues detected for a dataset
 */
export async function getDatasetQualityIssues(datasetId, params = {}) {
  const query = new URLSearchParams({
    skip: params.skip || 0,
    limit: params.limit || 100,
    ...(params.issueType ? { issue_type: params.issueType } : {}),
    ...(params.severity ? { severity: params.severity } : {}),
  });

  const res = await fetch(`${API_BASE_URL}/datasets/${datasetId}/quality-issues?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch quality issues for dataset ${datasetId}`);
  return await res.json();
}
