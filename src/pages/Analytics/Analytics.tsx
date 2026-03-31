import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import './Analytics.css';

const TREND_OPTIONS = [
  { label: '6h', value: 6 },
  { label: '24h', value: 24 },
  { label: '7d', value: 168 },
];

const STATUS_COLORS: Record<string, string> = {
  Pending: '#6b7280',
  InProgress: '#3b82f6',
  Completed: '#16a34a',
  Cancelled: '#dc2626',
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#6b7280',
  Medium: '#ca8a04',
  High: '#ea580c',
  Critical: '#dc2626',
};

function formatMs(ms: number): string {
  if (ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TrendChart({ data }: { data: { hour: string; completed: number; failed: number }[] }) {
  if (data.length === 0) {
    return <div className="chart-empty">No trend data for this period</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.completed + d.failed), 1);
  const width = 600;
  const height = 120;
  const pad = { top: 12, right: 16, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = data.length;
  const xStep = n > 1 ? innerW / (n - 1) : innerW;

  const toX = (i: number) => pad.left + (n > 1 ? i * xStep : innerW / 2);
  const toY = (v: number) => pad.top + innerH - (v / maxVal) * innerH;

  const completedPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.completed)}`)
    .join(' ');

  const failedPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.failed)}`)
    .join(' ');

  // Y axis ticks
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  // X axis labels — show up to 6 evenly spaced
  const labelIndices = n <= 6
    ? data.map((_, i) => i)
    : [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={pad.left}
            y1={toY(tick)}
            x2={width - pad.right}
            y2={toY(tick)}
            stroke="var(--border-default)"
            strokeDasharray="4 3"
          />
          <text x={pad.left - 6} y={toY(tick) + 4} textAnchor="end" className="chart-tick">
            {tick}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {labelIndices.map((i) => (
        <text key={i} x={toX(i)} y={height - 4} textAnchor="middle" className="chart-tick">
          {formatHour(data[i].hour)}
        </text>
      ))}

      {/* Completed fill */}
      <path
        d={`${completedPath} L${toX(n - 1)},${pad.top + innerH} L${toX(0)},${pad.top + innerH} Z`}
        fill="#16a34a"
        fillOpacity={0.12}
      />

      {/* Completed line */}
      <path d={completedPath} fill="none" stroke="#16a34a" strokeWidth={2} strokeLinejoin="round" />

      {/* Failed fill */}
      <path
        d={`${failedPath} L${toX(n - 1)},${pad.top + innerH} L${toX(0)},${pad.top + innerH} Z`}
        fill="#dc2626"
        fillOpacity={0.12}
      />

      {/* Failed line */}
      <path d={failedPath} fill="none" stroke="#dc2626" strokeWidth={2} strokeLinejoin="round" strokeDasharray="5 3" />

      {/* Dots on completed */}
      {n <= 24 && data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.completed)} r={3} fill="#16a34a" />
      ))}
    </svg>
  );
}

function BarSection({
  label,
  data,
  colors,
  total,
}: {
  label: string;
  data: Record<string, number>;
  colors: Record<string, string>;
  total: number;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div className="bar-section">
      <h3 className="bar-section-title">{label}</h3>
      <div className="bar-rows">
        {entries.map(([key, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="bar-row">
              <span className="bar-label">{key}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${pct}%`, background: colors[key] ?? '#6b7280' }}
                />
              </div>
              <span className="bar-value">{count}</span>
              <span className="bar-pct">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Analytics = () => {
  const {
    metrics,
    trends,
    performance,
    isLoading,
    error,
    trendHours,
    fetchAll,
    setTrendHours,
    clearError,
  } = useAnalyticsStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div className="analytics-header-left">
          <Link to="/dashboard" className="back-link">← Dashboard</Link>
          <div>
            <h1 className="analytics-title">Analytics</h1>
            <p className="analytics-subtitle">Task pipeline metrics & performance</p>
          </div>
        </div>
        <button
          className="btn-refresh"
          onClick={() => fetchAll()}
          disabled={isLoading}
          title="Refresh"
        >
          {isLoading ? '⟳ Loading…' : '⟳ Refresh'}
        </button>
      </header>

      {error && (
        <div className="analytics-error">
          <span>Could not reach analytics service — {error}</span>
          <button onClick={clearError}>&times;</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Tasks</span>
          <span className="kpi-value">{metrics?.total ?? '—'}</span>
        </div>
        <div className="kpi-card kpi-green">
          <span className="kpi-label">Success Rate</span>
          <span className="kpi-value">{metrics ? `${metrics.successRate}%` : '—'}</span>
        </div>
        <div className="kpi-card kpi-blue">
          <span className="kpi-label">Throughput / hr</span>
          <span className="kpi-value">{performance?.throughputPerHour ?? '—'}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Completed</span>
          <span className="kpi-value">{metrics?.byStatus?.Completed ?? '—'}</span>
        </div>
        <div className="kpi-card kpi-orange">
          <span className="kpi-label">In Progress</span>
          <span className="kpi-value">{metrics?.byStatus?.InProgress ?? '—'}</span>
        </div>
        <div className="kpi-card kpi-red">
          <span className="kpi-label">Cancelled</span>
          <span className="kpi-value">{metrics?.byStatus?.Cancelled ?? '—'}</span>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Completion Trend</h2>
          <div className="trend-controls">
            {TREND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`trend-btn${trendHours === opt.value ? ' active' : ''}`}
                onClick={() => setTrendHours(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-legend">
          <span className="legend-dot" style={{ background: '#16a34a' }} />
          <span className="legend-label">Completed</span>
          <span className="legend-dot legend-dashed" style={{ background: '#dc2626' }} />
          <span className="legend-label">Cancelled</span>
        </div>
        <div className="chart-container">
          {isLoading && trends.length === 0 ? (
            <div className="chart-empty">Loading…</div>
          ) : (
            <TrendChart data={trends} />
          )}
        </div>
      </div>

      {/* Breakdown + Performance */}
      <div className="two-col">
        {/* Breakdown */}
        <div className="section-card">
          <h2 className="section-title">Breakdown</h2>
          {isLoading && !metrics ? (
            <div className="chart-empty">Loading…</div>
          ) : metrics ? (
            <>
              <BarSection
                label="By Status"
                data={metrics.byStatus}
                colors={STATUS_COLORS}
                total={metrics.total}
              />
              <BarSection
                label="By Priority"
                data={metrics.byPriority}
                colors={PRIORITY_COLORS}
                total={metrics.total}
              />
            </>
          ) : (
            <div className="chart-empty">No data</div>
          )}
        </div>

        {/* Performance */}
        <div className="section-card">
          <h2 className="section-title">Performance</h2>
          {isLoading && !performance ? (
            <div className="chart-empty">Loading…</div>
          ) : performance ? (
            <>
              {Object.keys(performance.avgProcessingTimeByType).length > 0 && (
                <div className="perf-section">
                  <h3 className="bar-section-title">Avg Completion Time by Priority</h3>
                  <div className="perf-grid">
                    {Object.entries(performance.avgProcessingTimeByType).map(([k, v]) => (
                      <div key={k} className="perf-cell">
                        <span
                          className="perf-dot"
                          style={{ background: PRIORITY_COLORS[k] ?? '#6b7280' }}
                        />
                        <span className="perf-key">{k}</span>
                        <span className="perf-val">{formatMs(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {performance.workerStats.length > 0 ? (
                <div className="perf-section">
                  <h3 className="bar-section-title">Worker Stats</h3>
                  <div className="worker-table">
                    <div className="worker-row worker-head">
                      <span>Worker</span>
                      <span>Done</span>
                      <span>Cancelled</span>
                      <span>Avg Time</span>
                    </div>
                    {performance.workerStats.map((w) => (
                      <div key={w.worker} className="worker-row">
                        <span className="worker-id" title={w.worker}>
                          {w.worker.slice(0, 8)}…
                        </span>
                        <span className="worker-done">{w.completed}</span>
                        <span className="worker-fail">{w.failed}</span>
                        <span>{formatMs(w.avgDurationMs)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="chart-empty" style={{ marginTop: 16 }}>
                  No worker data — tasks need to be assigned to users
                </div>
              )}
            </>
          ) : (
            <div className="chart-empty">No data</div>
          )}
        </div>
      </div>
    </div>
  );
};
