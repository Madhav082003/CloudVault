import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Sidebar({ active }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([API.get("/auth/me"), API.get("/documents/stats")])
      .then(([u, s]) => { setUser(u.data); setStats(s.data); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const storagePercent = Math.min(
    ((stats?.total_size_bytes || 0) / (5 * 1024 * 1024 * 1024)) * 100,
    100
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">☁️</span>
        <span className="logo-text">CloudVault</span>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${active === "documents" ? "active" : ""}`}>
          <span>📁</span> Documents
        </Link>
        <Link to="/analytics" className={`nav-item ${active === "analytics" ? "active" : ""}`}>
          <span>📊</span> Analytics
        </Link>
        <Link to="/settings" className={`nav-item ${active === "settings" ? "active" : ""}`}>
          <span>⚙️</span> Settings
        </Link>
      </nav>

      <div className="sidebar-storage">
        <div className="storage-label">
          <span>Storage Used</span>
          <span>{formatSize(stats?.total_size_bytes || 0)}</span>
        </div>
        <div className="storage-bar">
          <div className="storage-fill" style={{ width: `${storagePercent}%` }} />
        </div>
        <div className="storage-limit">of 5 GB free</div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || "?"}</div>
        <div className="user-info">
          <div className="user-email">{user?.email || "Loading..."}</div>
          <div className="user-plan">Free Plan</div>
        </div>
        <button className="logout-icon" onClick={handleLogout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}
