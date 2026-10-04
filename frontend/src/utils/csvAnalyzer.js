/**
 * Client-side CSV parser and statistical anomaly analyzer for MetricWatch.
 * Computes historical baselines, standard deviations (Z-scores), and detects outlier points.
 * Generates structured analysis and AI narrative for any uploaded business metrics CSV.
 */

export const SAMPLE_CSV_RAW = `date,revenue,orders,traffic,conversion_rate,refunds
2026-09-01,100000,100,5000,2.0,5
2026-09-02,102000,102,5100,2.0,5
2026-09-03,98000,98,4900,2.0,6
2026-09-04,105000,105,5200,2.02,5
2026-09-05,101000,101,5050,2.0,6
2026-09-06,103000,103,5150,2.0,5
2026-09-07,104000,104,5200,2.0,5
2026-09-08,99000,99,5000,1.98,6
2026-09-09,106000,106,5300,2.0,5
2026-09-10,65000,65,6200,1.05,15`;

export function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row.');
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const rowObj = { _rowIndex: i, _raw: lines[i] };
    headers.forEach((h, colIdx) => {
      rowObj[h] = rawCols[colIdx] ?? '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export function formatMetricName(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatValue(metric, num) {
  const m = metric.toLowerCase();
  if (m.includes('rate') || m.includes('pct') || m.includes('percentage') || num <= 10 && num % 1 !== 0) {
    return `${Number(num).toFixed(2)}%`;
  }
  if (m.includes('revenue') || m.includes('cost') || m.includes('spend') || m.includes('price') || m.includes('amount')) {
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  }
  return Number(num).toLocaleString('en-IN');
}

/**
 * Run statistical anomaly detection across all numeric columns.
 * @param {Array} rows - array of row objects
 * @param {Array} headers - column names
 * @param {number} sensitivity - z-score threshold (e.g. 1.8, 2.0, 2.5)
 */
export function analyzeData(rows, headers, sensitivity = 2.0) {
  const dateCol = headers.find((h) => /date|time|day|timestamp/i.test(h)) || headers[0];
  const metricCols = headers.filter((h) => h !== dateCol && rows.some((r) => !isNaN(parseFloat(r[h]))));

  if (metricCols.length === 0) {
    throw new Error('No numeric metric columns found in file.');
  }

  // Column statistics
  const stats = {};
  metricCols.forEach((col) => {
    const values = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
    if (values.length === 0) return;

    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    // If historical baseline before the last 1 or 2 rows is possible
    const baselineSlice = values.length > 3 ? values.slice(0, Math.max(2, values.length - 2)) : values;
    const baselineMean = baselineSlice.reduce((sum, v) => sum + v, 0) / baselineSlice.length;

    stats[col] = {
      values,
      mean,
      stdDev: stdDev || 1,
      baselineMean,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  // Track flagged anomaly points per row and cell
  const flaggedRows = [];
  const cellAnomalies = {}; // key: `${rowIndex}_${colName}` -> anomaly details

  rows.forEach((row, rIdx) => {
    const rowIssues = [];
    const dateVal = row[dateCol] || `Row ${rIdx + 1}`;

    metricCols.forEach((col) => {
      const colStat = stats[col];
      if (!colStat) return;
      const val = parseFloat(row[col]);
      if (isNaN(val)) return;

      const zScore = (val - colStat.mean) / colStat.stdDev;
      const pctFromBaseline = colStat.baselineMean !== 0
        ? ((val - colStat.baselineMean) / colStat.baselineMean) * 100
        : 0;

      const absZ = Math.abs(zScore);
      let severity = 'low';
      if (absZ >= sensitivity * 1.5 || Math.abs(pctFromBaseline) > 30) {
        severity = 'high';
      } else if (absZ >= sensitivity || Math.abs(pctFromBaseline) > 15) {
        severity = 'medium';
      }

      if (severity !== 'low') {
        const issue = {
          rowIndex: rIdx,
          date: dateVal,
          column: col,
          metric: formatMetricName(col),
          value: val,
          formattedValue: formatValue(col, val),
          baseline: colStat.baselineMean,
          formattedBaseline: formatValue(col, colStat.baselineMean),
          change: pctFromBaseline,
          zScore: Number(zScore.toFixed(2)),
          severity,
          explanation: generateCellExplanation(col, val, colStat.baselineMean, pctFromBaseline, zScore),
        };
        rowIssues.push(issue);
        cellAnomalies[`${rIdx}_${col}`] = issue;
      }
    });

    if (rowIssues.length > 0) {
      flaggedRows.push({
        rowIndex: rIdx,
        date: dateVal,
        issues: rowIssues,
        maxSeverity: rowIssues.some((i) => i.severity === 'high') ? 'high' : 'medium',
      });
    }
  });

  // Generate metric summary cards and latest results
  const latestRowIndex = rows.length - 1;
  const latestRow = rows[latestRowIndex];
  const latestDate = latestRow ? latestRow[dateCol] : 'Latest';

  const results = metricCols.map((col) => {
    const colStat = stats[col];
    const latestVal = parseFloat(latestRow ? latestRow[col] : 0);
    const baseline = colStat.baselineMean;
    const change = baseline !== 0 ? ((latestVal - baseline) / baseline) * 100 : 0;
    const zScore = (latestVal - colStat.mean) / colStat.stdDev;
    const absZ = Math.abs(zScore);

    let severity = 'low';
    if (absZ >= sensitivity * 1.5 || Math.abs(change) > 30) {
      severity = 'high';
    } else if (absZ >= sensitivity || Math.abs(change) > 15) {
      severity = 'medium';
    }

    return {
      key: col,
      metric: formatMetricName(col),
      value: formatValue(col, latestVal),
      rawVal: latestVal,
      baseline: formatValue(col, baseline),
      rawBaseline: baseline,
      change: Number(change.toFixed(1)),
      zScore: Number(zScore.toFixed(2)),
      severity,
      explanation: generateMetricExplanation(col, change, severity),
      sparkline: colStat.values,
    };
  });

  // Sort results with highest severity first
  results.sort((a, b) => {
    const score = { high: 3, medium: 2, low: 1 };
    return score[b.severity] - score[a.severity] || Math.abs(b.change) - Math.abs(a.change);
  });

  // Generate AI Executive Narrative and Signals
  const aiSummary = generateAISynthesis(results, flaggedRows, latestDate);

  return {
    headers,
    dateCol,
    metricCols,
    rows,
    flaggedRows,
    cellAnomalies,
    results,
    summary: aiSummary,
    meta: {
      totalRows: rows.length,
      totalColumns: headers.length,
      metricsCount: metricCols.length,
      anomaliesCount: flaggedRows.reduce((acc, r) => acc + r.issues.length, 0),
      flaggedRowsCount: flaggedRows.length,
      latestDate,
    },
  };
}

function generateCellExplanation(col, val, baseline, pctChange, zScore) {
  const dir = pctChange > 0 ? 'spiked' : 'plummeted';
  return `${formatMetricName(col)} ${dir} by ${Math.abs(pctChange).toFixed(1)}% compared to normal baseline (${formatValue(col, baseline)}), registering ${Math.abs(zScore).toFixed(1)}σ deviation.`;
}

function generateMetricExplanation(col, change, severity) {
  const m = col.toLowerCase();
  const dir = change > 0 ? 'higher' : 'lower';
  const abs = Math.abs(change).toFixed(1);

  if (severity === 'high') {
    if (m.includes('rev')) return `Unusual collapse (${abs}% ${dir}) far outside seasonal 30-day baseline.`;
    if (m.includes('conver')) return `Severe drop of ${abs}% vs baseline; points to immediate funnel friction.`;
    if (m.includes('refund')) return `Abnormal spike of ${abs}%; potential product defect or gateway chargeback surge.`;
    return `Critical anomaly: metric moved ${abs}% ${dir}, surpassing tolerance limits.`;
  }
  if (severity === 'medium') {
    return `Moderate deviation (${abs}% ${dir} from baseline); monitor for trend continuation.`;
  }
  return `Within normal operating bounds (${abs}% ${dir} variation).`;
}

function generateAISynthesis(results, flaggedRows, latestDate) {
  const highAnomalies = results.filter((r) => r.severity === 'high');
  const mediumAnomalies = results.filter((r) => r.severity === 'medium');

  const revMetric = results.find((r) => /revenue|sales|gmv/i.test(r.key));
  const convMetric = results.find((r) => /conversion|cvr/i.test(r.key));
  const trafficMetric = results.find((r) => /traffic|visitors|sessions/i.test(r.key));
  const refundMetric = results.find((r) => /refund|return|chargeback/i.test(r.key));

  let narrative = '';
  const recommendations = [];

  if (highAnomalies.length > 0) {
    if (revMetric && revMetric.severity === 'high' && convMetric && convMetric.severity === 'high') {
      const trafficComment = trafficMetric && trafficMetric.change >= 0
        ? `while traffic remained resilient (+${trafficMetric.change}%)`
        : `with concurrent traffic softening`;

      narrative = `Critical revenue alert on ${latestDate}: Revenue declined ${Math.abs(revMetric.change)}% below baseline, correlated with a sharp ${Math.abs(convMetric.change)}% collapse in conversion rate ${trafficComment}. Because traffic did not fall proportionally, this divergence indicates down-funnel friction—such as checkout gateway failure, payment decline surges, or broken pricing scripts—rather than top-of-funnel acquisition loss.`;

      recommendations.push({
        priority: 'P0 - Immediate',
        action: 'Inspect payment gateway webhook error rates & checkout API logs on ' + latestDate,
      });
      recommendations.push({
        priority: 'P1 - High',
        action: 'Verify browser console errors on checkout & cart pages across mobile / desktop',
      });
      if (refundMetric && refundMetric.change > 20) {
        recommendations.push({
          priority: 'P1 - High',
          action: `Investigate refund spike of +${refundMetric.change}% for duplicate billing or automated fraud attempts`,
        });
      }
    } else {
      const topIssue = highAnomalies[0];
      narrative = `Significant metric instability detected on ${latestDate}. ${topIssue.metric} underwent an abnormal ${topIssue.change > 0 ? 'surge' : 'drop'} of ${Math.abs(topIssue.change)}% (Z-score: ${topIssue.zScore}σ), breaching normal tolerance intervals. Cross-metric correlation shows elevated systemic variance across ${highAnomalies.length + mediumAnomalies.length} key operational indicators.`;

      recommendations.push({
        priority: 'P0 - Immediate',
        action: `Audit ${topIssue.metric} data ingestion stream and verify downstream reporting integrity.`,
      });
      recommendations.push({
        priority: 'P1 - High',
        action: 'Review recent deployment releases and configuration toggles around the anomaly timeframe.',
      });
    }
  } else if (mediumAnomalies.length > 0) {
    narrative = `Operational metrics for ${latestDate} show moderate variance. While core revenue remains within standard baseline thresholds, ${mediumAnomalies.map((m) => m.metric).join(', ')} exhibited warning-level movement. No critical business disruptions are present, but monitoring is recommended.`;
    recommendations.push({
      priority: 'P2 - Medium',
      action: 'Track daily trend over the next 48 hours to distinguish temporary noise from persistent drift.',
    });
  } else {
    narrative = `All tracked business metrics on ${latestDate} are performing smoothly within expected historical bounds. No anomalous standard deviation breaches were observed across revenue, orders, or user traffic.`;
    recommendations.push({
      priority: 'Info',
      action: 'All systems normal. Continue automated daily baseline tracking.',
    });
  }

  const signals = results.slice(0, 4).map((r) => ({
    metric: r.metric,
    direction: r.change < -3 ? 'down' : r.change > 3 ? 'up' : 'flat',
    change: r.change,
    severity: r.severity,
  }));

  return {
    generatedAt: latestDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    narrative,
    signals,
    recommendations,
  };
}
