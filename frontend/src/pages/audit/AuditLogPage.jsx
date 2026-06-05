import { useEffect, useMemo, useState } from "react";
import { Eye, FileClock, RefreshCw, Search, X } from "lucide-react";
import { getAuditLogs } from "../../services/auditLogService.js";

const PAGE_SIZE = 10;

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  });
};

const actorLabel = (log) => {
  if (!log.userId) return "Hệ thống";
  return log.userFullName || log.userEmail || `User #${log.userId}`;
};

const formatJson = (value) => {
  if (!value) return "—";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
      <span style={{ color: "#0f172a", overflowWrap: "anywhere" }}>{value || "—"}</span>
    </div>
  );
}

function JsonBlock({ title, value }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 14 }}>{title}</h3>
      <pre style={{
        minHeight: 120,
        maxHeight: 260,
        overflow: "auto",
        margin: 0,
        padding: 12,
        borderRadius: 8,
        border: "1px solid #d7dee8",
        background: "#f8fafc",
        color: "#1f2933",
        fontSize: 13,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      }}>
        {formatJson(value)}
      </pre>
    </div>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [filters, setFilters] = useState({ action: "", tableName: "", userId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const queryParams = useMemo(() => ({
    page: pagination.page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
    action: filters.action.trim() || undefined,
    tableName: filters.tableName.trim() || undefined,
    userId: filters.userId || undefined,
  }), [filters, pagination.page]);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAuditLogs(queryParams);
      const data = response.data;
      setLogs(data.content || []);
      setPagination((current) => ({
        ...current,
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0,
      }));
    } catch (err) {
      setError(err.message || "Không thể tải nhật ký hoạt động.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const updateFilter = (field, value) => {
    setPagination((current) => ({ ...current, page: 0 }));
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const resetFilters = () => {
    setPagination((current) => ({ ...current, page: 0 }));
    setFilters({ action: "", tableName: "", userId: "" });
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <h1>Nhật ký hệ thống</h1>
          <p className="muted">Theo dõi các hoạt động đã được ghi nhận trong hệ thống.</p>
        </div>
        <div className="heading-actions">
          <button className="ghost-button" type="button" onClick={loadAuditLogs}>
            <RefreshCw size={17} />
            Làm mới
          </button>
        </div>
      </section>

      <section className="panel">
        <form className="toolbar" onSubmit={(event) => event.preventDefault()}>
          <label className="search-box">
            <Search size={17} />
            <input
              value={filters.action}
              onChange={(event) => updateFilter("action", event.target.value)}
              placeholder="Lọc theo hành động: CREATE, UPDATE..."
            />
          </label>
          <input
            value={filters.tableName}
            onChange={(event) => updateFilter("tableName", event.target.value)}
            placeholder="Table name: users, appointments..."
          />
          <input
            type="number"
            min="1"
            value={filters.userId}
            onChange={(event) => updateFilter("userId", event.target.value)}
            placeholder="User ID"
          />
          <button className="ghost-button" type="button" onClick={resetFilters}>
            Xóa lọc
          </button>
        </form>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="panel table-panel">
        <div className="table-header">
          <h2>Hoạt động đã ghi nhận</h2>
          <span className="muted">{pagination.totalElements} bản ghi</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Bảng/Tài nguyên</th>
                <th>Record ID</th>
                <th>IP</th>
                <th style={{ textAlign: "center" }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="empty-row">Đang tải nhật ký hoạt động...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-row">Chưa có nhật ký hoạt động.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.auditLogId}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>
                      <strong>{actorLabel(log)}</strong>
                      {log.userEmail && <div className="muted" style={{ fontSize: 12 }}>{log.userEmail}</div>}
                    </td>
                    <td>
                      <span className="status-badge badge-active">{log.action}</span>
                    </td>
                    <td>{log.tableName || "—"}</td>
                    <td>{log.recordId || "—"}</td>
                    <td>{log.ipAddress || "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Xem chi tiết log ${log.auditLogId}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            className="ghost-button"
            type="button"
            disabled={pagination.page === 0 || loading}
            onClick={() => setPagination((current) => ({ ...current, page: Math.max(current.page - 1, 0) }))}
          >
            Trước
          </button>
          <span className="muted">
            Trang {pagination.page + 1} / {Math.max(pagination.totalPages, 1)}
          </span>
          <button
            className="ghost-button"
            type="button"
            disabled={pagination.page + 1 >= pagination.totalPages || loading}
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
          >
            Sau
          </button>
        </div>
      </section>

      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-card modal-lg" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <FileClock size={20} />
                Chi tiết nhật ký
              </h2>
              <button className="icon-button" type="button" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
              <DetailRow label="Audit log ID" value={selectedLog.auditLogId} />
              <DetailRow label="Thời gian" value={formatDateTime(selectedLog.createdAt)} />
              <DetailRow label="Người thực hiện" value={actorLabel(selectedLog)} />
              <DetailRow label="User ID" value={selectedLog.userId} />
              <DetailRow label="Email" value={selectedLog.userEmail} />
              <DetailRow label="Hành động" value={selectedLog.action} />
              <DetailRow label="Table name" value={selectedLog.tableName} />
              <DetailRow label="Record ID" value={selectedLog.recordId} />
              <DetailRow label="IP address" value={selectedLog.ipAddress} />
              <DetailRow label="User agent" value={selectedLog.userAgent} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              <JsonBlock title="Old value" value={selectedLog.oldValue} />
              <JsonBlock title="New value" value={selectedLog.newValue} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
