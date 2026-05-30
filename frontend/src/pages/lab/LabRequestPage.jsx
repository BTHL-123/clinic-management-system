import { useEffect, useState, useCallback } from "react";
import { FlaskConical, RefreshCw, CheckCircle, ClipboardEdit, X } from "lucide-react";
import { getAllLabRequests, acceptLabRequest } from "../../services/labRequestService";
import { createLabResult } from "../../services/labResultService";

const STATUS_MAP = {
  REQUESTED:   { label: "Chờ tiếp nhận", color: "#d97706", bg: "#fef3c7" },
  IN_PROGRESS: { label: "Đang xử lý",    color: "#2563eb", bg: "#dbeafe" },
  COMPLETED:   { label: "Hoàn thành",    color: "#16a34a", bg: "#dcfce7" },
  CANCELLED:   { label: "Đã hủy",        color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

const EMPTY_RESULT = {
  resultValue: "",
  normalRange: "",
  resultUnit: "",
  conclusion: "",
  resultFileUrl: "",
};

export default function LabRequestPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("IN_PROGRESS");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal nhập kết quả
  const [resultModal, setResultModal] = useState(null); // { req, item }
  const [resultForm, setResultForm] = useState(EMPTY_RESULT);
  const [savingResult, setSavingResult] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllLabRequests({ status: filterStatus || undefined, size: 50 });
      setRequests(res.data?.content || []);
      setError("");
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phiếu xét nghiệm.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      const res = await acceptLabRequest(id);
      setRequests((prev) => prev.map((r) => r.labRequestId === id ? res.data : r));
      showToast("Đã tiếp nhận phiếu xét nghiệm.");
    } catch (err) {
      showToast(err.message || "Không thể tiếp nhận phiếu.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openResultModal = (req, item) => {
    setResultModal({ req, item });
    setResultForm(EMPTY_RESULT);
  };

  const handleSaveResult = async () => {
    if (!resultForm.resultValue.trim()) {
      showToast("Vui lòng nhập giá trị kết quả.", "error");
      return;
    }
    setSavingResult(true);
    try {
      await createLabResult({
        labRequestItemId: resultModal.item.labRequestItemId,
        resultValue: resultForm.resultValue,
        normalRange: resultForm.normalRange || null,
        resultUnit: resultForm.resultUnit || null,
        conclusion: resultForm.conclusion || null,
        resultFileUrl: resultForm.resultFileUrl || null,
      });
      showToast(`Đã nhập kết quả cho "${resultModal.item.testName}".`);
      setResultModal(null);
      await fetchRequests();
    } catch (err) {
      showToast(err.message || "Không thể lưu kết quả.", "error");
    } finally {
      setSavingResult(false);
    }
  };

  const waitingCount = requests.filter((r) => r.status === "REQUESTED").length;
  const inProgressCount = requests.filter((r) => r.status === "IN_PROGRESS").length;

  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <FlaskConical size={22} />
        <h2 style={{ margin: 0, fontSize: 20 }}>Phòng xét nghiệm</h2>
      </div>

      {toast && (
        <div style={{
          background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
          color: toast.type === "error" ? "#991b1b" : "#166534",
          border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
          padding: "10px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, marginBottom: 16,
        }}>
          {toast.message}
        </div>
      )}

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20, maxWidth: 400 }}>
        {[
          { label: "Chờ tiếp nhận", value: waitingCount, color: "#d97706", bg: "#fef3c7" },
          { label: "Đang xử lý", value: inProgressCount, color: "#2563eb", bg: "#dbeafe" },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 10, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, color: "#374151" }}>{s.label}</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
        >
          <option value="">Tất cả</option>
          <option value="REQUESTED">Chờ tiếp nhận</option>
          <option value="IN_PROGRESS">Đang xử lý</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select>
        <button className="secondary-button" onClick={fetchRequests}
          style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Bệnh nhân</th>
              <th>Các xét nghiệm</th>
              <th>Thời gian</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="empty-row">Đang tải...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="empty-row">Không có phiếu xét nghiệm.</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.labRequestId}>
                  <td><strong>{req.requestCode}</strong></td>
                  <td style={{ color: "#6b7280", fontSize: 13 }}>ID: {req.patientId}</td>
                  <td>
                    {req.items?.map((item) => (
                      <div key={item.labRequestItemId} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        fontSize: 13, marginBottom: 2,
                      }}>
                        <span>
                          • {item.testName}
                          <span style={{ color: "#6b7280", fontSize: 11 }}> ({item.testCode})</span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                          {item.labResult ? (
                            <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 600 }}>✓ Đã có KQ</span>
                          ) : req.status === "IN_PROGRESS" ? (
                            <button
                              onClick={() => openResultModal(req, item)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 3,
                                padding: "2px 8px", borderRadius: 4, border: "none",
                                background: "#ede9fe", color: "#7c3aed",
                                cursor: "pointer", fontSize: 11, fontWeight: 600,
                              }}
                            >
                              <ClipboardEdit size={11} /> Nhập KQ
                            </button>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                    {new Date(req.requestedAt).toLocaleString("vi-VN", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td><StatusBadge status={req.status} /></td>
                  <td style={{ textAlign: "center" }}>
                    {req.status === "REQUESTED" && (
                      <button
                        disabled={actionLoading === req.labRequestId}
                        onClick={() => handleAccept(req.labRequestId)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "4px 12px", borderRadius: 6, border: "none",
                          background: "#dbeafe", color: "#2563eb",
                          cursor: actionLoading === req.labRequestId ? "not-allowed" : "pointer",
                          fontSize: 12, fontWeight: 600,
                          opacity: actionLoading === req.labRequestId ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle size={13} />
                        {actionLoading === req.labRequestId ? "Đang xử lý..." : "Tiếp nhận"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nhập kết quả */}
      {resultModal && (
        <div className="modal-overlay" onClick={() => setResultModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}
            style={{ width: 500, maxWidth: "95vw" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16 }}>
                Nhập kết quả — {resultModal.item.testName}
              </h3>
              <button className="icon-button" onClick={() => setResultModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px 0", display: "grid", gap: 12 }}>
              {[
                { key: "resultValue", label: "Giá trị kết quả *", placeholder: "VD: 5.2" },
                { key: "resultUnit", label: "Đơn vị", placeholder: "VD: mmol/L" },
                { key: "normalRange", label: "Khoảng bình thường", placeholder: "VD: 3.9 - 6.1" },
                { key: "conclusion", label: "Kết luận", placeholder: "Bình thường / Bất thường..." },
                { key: "resultFileUrl", label: "Link file kết quả (nếu có)", placeholder: "https://..." },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={resultForm[f.key]}
                    onChange={(e) => setResultForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 6,
                      border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="secondary-button" onClick={() => setResultModal(null)}>
                Hủy
              </button>
              <button
                className="primary-button"
                onClick={handleSaveResult}
                disabled={savingResult}
              >
                {savingResult ? "Đang lưu..." : "Lưu kết quả"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
