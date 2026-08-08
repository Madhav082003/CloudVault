import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function Settings() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    Promise.all([API.get("/auth/me"), API.get("/documents/stats")])
      .then(([u, s]) => { setUser(u.data); setStats(s.data); })
      .catch((err) => { if (err.response?.status === 401) navigate("/login"); })
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", text: "New passwords do not match" }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: "error", text: "Password must be at least 6 characters" }); return; }
    setPwdLoading(true);
    try {
      await API.post("/auth/change-password", { current_password: currentPwd, new_password: newPwd });
      setPwdMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) {
      setPwdMsg({ type: "error", text: err.response?.data?.detail || "Failed to change password" });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    try {
      await API.delete("/auth/delete-account");
      localStorage.removeItem("token");
      navigate("/register");
    } catch {
      alert("Failed to delete account");
    }
  };

  const storagePercent = Math.min(((stats?.total_size_bytes || 0) / (5 * 1024 * 1024 * 1024)) * 100, 100);

  if (loading) return (
    <div className="app-layout">
      <Sidebar active="settings" />
      <main className="main-content"><div className="loading-screen"><div className="loader" /><p>Loading settings...</p></div></main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar active="settings" />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h2 className="page-title">Settings</h2>
            <p className="page-sub">Manage your account and preferences</p>
          </div>
        </div>

        <div className="settings-grid">

          {/* Profile */}
          <div className="settings-card">
            <h3 className="settings-section-title">👤 Profile</h3>
            <div className="profile-row">
              <div className="profile-avatar-lg">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="profile-details">
                <div className="profile-email">{user?.email}</div>
                <div className="profile-since">Member since {formatDate(user?.created_at)}</div>
                <span className="plan-badge">Free Plan</span>
              </div>
            </div>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-value">{stats?.total_documents || 0}</div>
                <div className="profile-stat-label">Documents</div>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <div className="profile-stat-value">{formatSize(stats?.total_size_bytes || 0)}</div>
                <div className="profile-stat-label">Storage Used</div>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <div className="profile-stat-value">{stats?.recent_uploads || 0}</div>
                <div className="profile-stat-label">This Week</div>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="settings-card">
            <h3 className="settings-section-title">💾 Storage & Plan</h3>
            <div className="storage-info">
              <div className="storage-info-row">
                <span>{formatSize(stats?.total_size_bytes || 0)} used</span>
                <span>5 GB free</span>
              </div>
              <div className="storage-bar-lg">
                <div className="storage-fill-lg" style={{ width: `${storagePercent}%` }} />
              </div>
              <div className="storage-pct">{storagePercent.toFixed(2)}% of 5 GB used</div>
            </div>
            <div className="plan-upgrade-box">
              <div className="plan-upgrade-left">
                <div className="plan-name">⚡ CloudVault Pro</div>
                <div className="plan-desc">100 GB storage · Priority support · AI features early access</div>
              </div>
              <button className="upgrade-btn" disabled>Coming Soon</button>
            </div>
          </div>

          {/* Change Password */}
          <div className="settings-card">
            <h3 className="settings-section-title">🔒 Security</h3>
            <form onSubmit={handleChangePassword} className="pwd-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                />
              </div>
              {pwdMsg && (
                <div className={`settings-msg ${pwdMsg.type}`}>
                  {pwdMsg.type === "success" ? "✅" : "⚠️"} {pwdMsg.text}
                </div>
              )}
              <button type="submit" className="settings-btn-primary" disabled={pwdLoading}>
                {pwdLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* AI Feature Teaser */}
          <div className="settings-card ai-settings-card">
            <div className="ai-settings-badge">✨ Coming Soon</div>
            <h3 className="settings-section-title">🤖 CloudVault AI</h3>
            <p className="ai-settings-desc">
              Ask questions about your uploaded documents using natural language.
              Powered by RAG (Retrieval-Augmented Generation) — your documents become
              a searchable knowledge base.
            </p>

            <div className="ai-how-it-works">
              <div className="ai-step">
                <div className="ai-step-num">1</div>
                <div className="ai-step-text">
                  <strong>Upload</strong>
                  <span>Add PDFs, Word, Excel files to CloudVault</span>
                </div>
              </div>
              <div className="ai-step-arrow">→</div>
              <div className="ai-step">
                <div className="ai-step-num">2</div>
                <div className="ai-step-text">
                  <strong>Extract</strong>
                  <span>AI reads and indexes your document content</span>
                </div>
              </div>
              <div className="ai-step-arrow">→</div>
              <div className="ai-step">
                <div className="ai-step-num">3</div>
                <div className="ai-step-text">
                  <strong>Ask</strong>
                  <span>Chat with your documents in plain English</span>
                </div>
              </div>
            </div>

            <div className="ai-examples">
              <div className="ai-example-chip">💬 "Summarize this contract"</div>
              <div className="ai-example-chip">💬 "What are the key dates in this report?"</div>
              <div className="ai-example-chip">💬 "Compare these two proposals"</div>
            </div>

            <button className="ai-waitlist-btn" disabled>Get Early Access →</button>
          </div>

          {/* Danger Zone */}
          <div className="settings-card danger-card">
            <h3 className="settings-section-title danger-title">⚠️ Danger Zone</h3>
            {!showDeleteConfirm ? (
              <div className="danger-row">
                <div>
                  <div className="danger-action-title">Delete Account</div>
                  <div className="danger-action-desc">Permanently delete your account and all documents. This cannot be undone.</div>
                </div>
                <button className="danger-btn" onClick={() => setShowDeleteConfirm(true)}>
                  Delete Account
                </button>
              </div>
            ) : (
              <div className="delete-confirm">
                <p>Type <strong>DELETE</strong> to confirm account deletion:</p>
                <input
                  type="text"
                  placeholder="Type DELETE"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                />
                <div className="delete-confirm-btns">
                  <button
                    className="danger-btn"
                    disabled={deleteInput !== "DELETE"}
                    onClick={handleDeleteAccount}
                  >
                    Confirm Delete
                  </button>
                  <button className="settings-btn-secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
