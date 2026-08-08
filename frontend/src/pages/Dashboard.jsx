import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";

const FILE_ICONS = {
  pdf:        { icon: "📄", color: "#e53e3e", label: "PDF" },
  word:       { icon: "📝", color: "#2b6cb0", label: "Word" },
  excel:      { icon: "📊", color: "#276749", label: "Excel" },
  image:      { icon: "🖼️", color: "#d69e2e", label: "Image" },
  text:       { icon: "📃", color: "#718096", label: "Text" },
  archive:    { icon: "🗜️", color: "#744210", label: "Archive" },
  video:      { icon: "🎬", color: "#6b46c1", label: "Video" },
  powerpoint: { icon: "📋", color: "#c05621", label: "PowerPoint" },
  unknown:    { icon: "📁", color: "#4a5568", label: "File" },
};

function ConfirmModal({ filename, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon">🗑️</div>
        <h3>Delete Document</h3>
        <p>Are you sure you want to delete <strong>"{filename}"</strong>? This action cannot be undone.</p>
        <div className="modal-btns">
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-confirm" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === "success" ? "✅" : "❌"}</span>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileRef = useRef();
  const navigate = useNavigate();

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchAll = async () => {
    try {
      const [docsRes, statsRes, userRes] = await Promise.all([
        API.get("/documents/"),
        API.get("/documents/stats"),
        API.get("/auth/me"),
      ]);
      setDocuments(docsRes.data);
      setStats(statsRes.data);
      setUser(userRes.data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (q = "") => {
    try {
      const res = await API.get("/documents/", { params: q ? { search: q } : {} });
      setDocuments(res.data);
    } catch {}
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    fetchAll();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchDocuments(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast("File exceeds 10MB limit", "error");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await API.post("/documents/upload", formData);
      addToast(`"${file.name}" uploaded successfully`);
      await fetchAll();
    } catch (err) {
      addToast(err.response?.data?.detail || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      addToast(`Preparing "${filename}"...`);
      const res = await API.get(`/documents/download/${id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast(`"${filename}" downloaded`);
    } catch {
      addToast("Download failed", "error");
    }
  };

  const handleDelete = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    const { id, name } = deleteTarget;
    setDeleteTarget(null);
    try {
      await API.delete(`/documents/${id}`);
      addToast(`"${name}" deleted`);
      await fetchAll();
    } catch {
      addToast("Delete failed", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dt) => new Date(dt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p>Loading CloudVault...</p>
    </div>
  );

  return (
    <div className="app-layout">
      <Toast toasts={toasts} remove={removeToast} />
      {deleteTarget && (
        <ConfirmModal
          filename={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <Sidebar active="documents" />

      {/* Main content */}
      <main className="main-content">
        <div className="topbar">
          <div>
            <h2 className="page-title">My Documents</h2>
            <p className="page-sub">Manage and access all your files</p>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className="search-clear" onClick={() => setSearch("")}>×</button>}
            </div>
            <label className="upload-btn-main" style={{ opacity: uploading ? 0.7 : 1 }}>
              {uploading ? "⏳ Uploading..." : "⬆ Upload File"}
              <input type="file" hidden ref={fileRef} onChange={(e) => handleUpload(e.target.files[0])} />
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <StatCard icon="📁" label="Total Documents" value={stats?.total_documents || 0} color="#ebf4ff" />
          <StatCard icon="💾" label="Storage Used" value={formatSize(stats?.total_size_bytes || 0)} sub="of 5 GB free" color="#f0fff4" />
          <StatCard icon="🕒" label="Recent Uploads" value={stats?.recent_uploads || 0} sub="last 7 days" color="#fef3c7" />
          <StatCard icon="🔒" label="Security" value="Active" sub="JWT Protected" color="#fdf2f8" />
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={`drop-zone ${dragOver ? "drag-active" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="drop-icon">☁️</span>
          <p><strong>Drag & drop files here</strong> or click Upload File above</p>
          <p className="drop-sub">PDF, Word, Excel, Images, ZIP and more · Max 10MB</p>
        </div>

        {/* Documents Table */}
        <div className="table-card">
          <div className="table-header">
            <h3>
              {search ? `Search results for "${search}"` : "All Files"}
              <span className="doc-count">{documents.length}</span>
            </h3>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>{search ? "No files match your search" : "No documents yet"}</h3>
              <p>{search ? "Try a different search term" : "Upload your first document to get started"}</p>
            </div>
          ) : (
            <table className="doc-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const typeInfo = FILE_ICONS[doc.file_type] || FILE_ICONS.unknown;
                  return (
                    <tr key={doc.id}>
                      <td className="file-name-cell">
                        <span className="file-icon">{typeInfo.icon}</span>
                        <span className="file-name">{doc.filename}</span>
                      </td>
                      <td>
                        <span className="file-badge" style={{ background: typeInfo.color + "22", color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="file-size">{formatSize(doc.file_size)}</td>
                      <td className="file-date">{formatDate(doc.uploaded_at)}</td>
                      <td>
                        <div className="action-btns">
                          <button className="action-download" onClick={() => handleDownload(doc.id, doc.filename)}>
                            ⬇ Download
                          </button>
                          <button className="action-delete" onClick={() => handleDelete(doc.id, doc.filename)}>
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
