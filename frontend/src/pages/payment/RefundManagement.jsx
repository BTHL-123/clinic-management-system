import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, FileText, X, AlertCircle } from "lucide-react";
import { getRefunds, approveRefund, rejectRefund } from "../../services/refundService";

function RejectModal({ isOpen, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", padding: "24px", borderRadius: "12px",
        width: "90%", maxWidth: "450px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.2rem" }}>Từ chối hoàn tiền</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "14px" }}>
          Vui lòng nhập lý do từ chối yêu cầu hoàn tiền này. Bệnh nhân sẽ nhìn thấy lý do này.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do từ chối..."
          rows={4}
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: "1px solid #cbd5e1", outline: "none", resize: "none",
            marginBottom: "20px", fontFamily: "inherit", fontSize: "14px",
            boxSizing: "border-box"
          }}
        />
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1",
              background: "#fff", cursor: "pointer", fontWeight: 600, color: "#475569"
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy || !reason.trim()}
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "none",
              background: (busy || !reason.trim()) ? "#fca5a5" : "#dc2626",
              color: "#fff", cursor: (busy || !reason.trim()) ? "not-allowed" : "pointer",
              fontWeight: 600
            }}
          >
            {busy ? "Đang xử lý..." : "Từ chối yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RefundManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [busyAction, setBusyAction] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, size: 10, sortBy: "requestedAt", direction: "desc" };
      if (statusFilter) params.status = statusFilter;
      const res = await getRefunds(params);
      setData(res.data || res);
    } catch (err) {
      setError(err.message || "Lỗi tải dữ liệu hoàn tiền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm("Bạn có chắc chắn duyệt yêu cầu hoàn tiền này? Tiền phải được chuyển khoản trước.")) return;
    setBusyAction(true);
    setError(null);
    setSuccessMsg("");
    try {
      await approveRefund(id);
      setSuccessMsg("Đã duyệt yêu cầu hoàn tiền thành công!");
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi khi duyệt");
    } finally {
      setBusyAction(false);
    }
  };

  const openRejectModal = (id) => {
    setRejectTargetId(id);
    setRejectModalOpen(true);
  };

  const handleReject = async (reason) => {
    if (!rejectTargetId) return;
    setBusyAction(true);
    setError(null);
    setSuccessMsg("");
    try {
      await rejectRefund(rejectTargetId, { rejectReason: reason });
      setSuccessMsg("Đã từ chối yêu cầu hoàn tiền.");
      setRejectModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi khi từ chối");
    } finally {
      setBusyAction(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING": return <span style={{ background: "#fef08a", color: "#854d0e", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Chờ duyệt</span>;
      case "APPROVED":
      case "COMPLETED": return <span style={{ background: "#bbf7d0", color: "#166534", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Hoàn thành</span>;
      case "REJECTED": return <span style={{ background: "#fecaca", color: "#991b1b", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Đã từ chối</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>Quản lý hoàn tiền</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Duyệt hoặc từ chối các yêu cầu hoàn tiền từ bệnh nhân.</p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", background: "#fff", cursor: "pointer" }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: "12px", background: "#f0fdf4", color: "#16a34a", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
          <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <tr>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Mã hoàn tiền</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Bệnh nhân</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Số tiền</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Ngày yêu cầu</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Trạng thái</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>Đang tải dữ liệu...</td></tr>
            ) : data?.content?.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>Không có dữ liệu hoàn tiền.</td></tr>
            ) : (
              data?.content?.map(r => (
                <tr key={r.refundId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{r.refundCode}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>HĐ: {r.paymentCode}</div>
                  </td>
                  <td style={{ padding: "16px", color: "#334155" }}>{r.requestedByName || "—"}</td>
                  <td style={{ padding: "16px", fontWeight: 600, color: "#dc2626" }}>{r.refundAmount?.toLocaleString("vi-VN")} đ</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{r.requestedAt ? new Date(r.requestedAt).toLocaleString("vi-VN") : "—"}</td>
                  <td style={{ padding: "16px" }}>{getStatusBadge(r.status)}</td>
                  <td style={{ padding: "16px" }}>
                    {r.status === "PENDING" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleApprove(r.refundId)}
                          disabled={busyAction}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                        >
                          <CheckCircle size={14} /> Duyệt
                        </button>
                        <button
                          onClick={() => openRejectModal(r.refundId)}
                          disabled={busyAction}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                        >
                          <XCircle size={14} /> Từ chối
                        </button>
                      </div>
                    )}
                    {(r.status === "COMPLETED" || r.status === "REJECTED") && (
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        Người xử lý: <b>{r.approvedByName || "—"}</b>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {data?.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
            >
              Trang trước
            </button>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Trang {page + 1} / {data.totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={data.last}
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: data.last ? "default" : "pointer", opacity: data.last ? 0.5 : 1 }}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>

      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
        busy={busyAction}
      />
    </div>
  );
}
