import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";

const FILE_COLORS = {
  pdf:        "#ef4444",
  word:       "#3b82f6",
  excel:      "#22c55e",
  image:      "#f59e0b",
  text:       "#8b5cf6",
  archive:    "#f97316",
  video:      "#ec4899",
  powerpoint: "#f97316",
  unknown:    "#94a3b8",
};

const FILE_LABELS = {
  pdf: "PDF", word: "Word", excel: "Excel", image: "Image",
  text: "Text", archive: "Archive", video: "Video",
  powerpoint: "PowerPoint", unknown: "Other",
};

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DonutChart({ data, total }) {
  if (total === 0) return <div className="donut-empty">No data yet</div>;

  let cumulative = 0;
  const segments = Object.entries(data).map(([type, count]) => {
    const pct = (count / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { type, count, pct, start };
  });

  const gradient = segments
    .map((s) => `${FILE_COLORS[s.type] || "#94a3b8"} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`)
    .join(", ");

  return (
    <div className="donut-wrapper">
      <div
        className="donut"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="donut-hole">
          <div className="donut-total">{total}</div>
          <div className="donut-label">files</div>
        </div>
      </div>
      <div className="donut-legend">
        {segments.map((s) => (
          <div key={s.type} className="legend-item">
            <span className="legend-dot" style={{ background: FILE_COLORS[s.type] || "#94a3b8" }} />
            <span className="legend-name">{FILE_LABELS[s.type] || s.type}</span>
            <span className="legend-count">{s.count} ({s.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="bar-chart">
      {Object.entries(data).map(([day, count]) => (
        <div key={day} className="bar-col">
          <div className="bar-value">{count > 0 ? count : ""}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ height: `${(count / max) * 100}%` }}
            />
          </div>
          <div className="bar-label">{day}</div>
        </div>
      ))}
    </div>
  );
}

function StorageBar({ data }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="storage-breakdown">
      <div className="storage-stacked-bar">
        {Object.entries(data).map(([type, size]) => (
          <div
            key={type}
            className="stacked-segment"
            style={{
              width: `${(size / total) * 100}%`,
              background: FILE_COLORS[type] || "#94a3b8",
            }}
            title={`${FILE_LABELS[type] || type}: ${formatSize(size)}`}
          />
        ))}
      </div>
      <div className="storage-legend">
        {Object.entries(data).map(([type, size]) => (
          <div key={type} className="legend-item">
            <span className="legend-dot" style={{ background: FILE_COLORS[type] || "#94a3b8" }} />
            <span className="legend-name">{FILE_LABELS[type] || type}</span>
            <span className="legend-count">{formatSize(size)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    Promise.all([
      API.get("/documents/analytics"),
      API.get("/documents/stats"),
    ]).then(([a, s]) => {
      setAnalytics(a.data);
      setStats(s.data);
    }).catch((err) => {
      if (err.response?.status === 401) navigate("/login");
    }).finally(() => setLoading(false));
  }, []);

  const totalDocs = stats?.total_documents || 0;
  const totalSize = stats?.total_size_bytes || 0;
  const avgSize = totalDocs > 0 ? totalSize / totalDocs : 0;

  if (loading) return (
    <div className="app-layout">
      <Sidebar active="analytics" />
      <main className="main-content"><div className="loading-screen"><div className="loader" /><p>Loading analytics...</p></div></main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar active="analytics" />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h2 className="page-title">Analytics</h2>
            <p className="page-sub">Insights about your document storage</p>
          </div>
          <div className="date-badge">Last 7 days</div>
        </div>

        {/* Summary */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#ebf4ff" }}>📁</div>
            <div className="stat-info">
              <div className="stat-value">{totalDocs}</div>
              <div className="stat-label">Total Documents</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#f0fff4" }}>💾</div>
            <div className="stat-info">
              <div className="stat-value">{formatSize(totalSize)}</div>
              <div className="stat-label">Storage Used</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fef3c7" }}>📈</div>
            <div className="stat-info">
              <div className="stat-value">{stats?.recent_uploads || 0}</div>
              <div className="stat-label">Uploads This Week</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fdf2f8" }}>⚖️</div>
            <div className="stat-info">
              <div className="stat-value">{formatSize(avgSize)}</div>
              <div className="stat-label">Avg File Size</div>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="charts-row">
          {/* Donut */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>File Type Distribution</h3>
              <p>Breakdown by document type</p>
            </div>
            <DonutChart
              data={analytics?.type_counts || {}}
              total={totalDocs}
            />
          </div>

          {/* Bar chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Upload Activity</h3>
              <p>Files uploaded in the last 7 days</p>
            </div>
            <BarChart data={analytics?.daily_uploads || {}} />
          </div>
        </div>

        {/* Storage by type */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Storage by File Type</h3>
            <p>Which types consume the most space</p>
          </div>
          {Object.keys(analytics?.type_sizes || {}).length === 0 ? (
            <p className="no-data">No data yet — upload some documents</p>
          ) : (
            <StorageBar data={analytics?.type_sizes || {}} />
          )}
        </div>

        {/* AI Insights — Coming Soon */}
        <div className="ai-teaser-card">
          <div className="ai-teaser-badge">✨ Coming Soon</div>
          <div className="ai-teaser-content">
            <div className="ai-teaser-left">
              <h3>🤖 CloudVault AI Insights</h3>
              <p>
                Unlock AI-powered analytics that automatically summarize your documents,
                detect patterns, and answer questions about your files using natural language.
              </p>
              <div className="ai-teaser-features">
                <div className="ai-feature">📄 Auto-summarize uploaded documents</div>
                <div className="ai-feature">🔍 Semantic search across all files</div>
                <div className="ai-feature">💬 Ask questions, get instant answers</div>
                <div className="ai-feature">📊 AI-generated document reports</div>
              </div>
              <button className="ai-waitlist-btn" disabled>Get Early Access →</button>
            </div>
            <div className="ai-teaser-preview">
              <div className="ai-chat-mock">
                <div className="ai-chat-msg user">What is the deadline in the Q3 report?</div>
                <div className="ai-chat-msg bot">
                  <span className="bot-icon">🤖</span>
                  Based on your Q3_Report.pdf, the project deadline is <strong>September 30, 2026</strong>. The report also mentions a review checkpoint on September 15.
                </div>
                <div className="ai-chat-msg user">Summarize the contract.pdf</div>
                <div className="ai-chat-msg bot">
                  <span className="bot-icon">🤖</span>
                  <span className="blurred-text">The contract covers a 12-month engagement between...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
