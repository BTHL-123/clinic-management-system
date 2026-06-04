import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, RefreshCw, CheckCircle, Eye, AlertTriangle, ShieldCheck } from "lucide-react";
import { getPrescriptions, dispensePrescription } from "../../services/prescriptionService";

const STATUS_MAP = {
  CREATED:   { label: "Chờ cấp phát", color: "#d97706", bg: "#fef3c7" },
  CHECKED:   { label: "Đã kiểm tra",  color: "#2563eb", bg: "#dbeafe" },
  DISPENSED: { label: "Đã cấp phát",  color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Đã hủy",       color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

export default function PharmacistPrescriptionPage() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("CREATED");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dispensingId, setDispensingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPrescriptions({
        status: filterStatus || undefined,
        page,
        size: 10,
      });
      setPrescriptions(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách đơn thuốc.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => {
    setPage(0);
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDispense = async (prescriptionId, prescriptionCode) => {
    if (!window.confirm(`Xác nhận cấp phát đơn thuốc ${prescriptionCode}?\nThao tác này sẽ xuất kho tự động.`)) return;
    setDispensingId(prescriptionId);
    try {
      await dispensePrescription(prescriptionId);
      showToast(`Đã cấp phát đơn thuốc ${prescriptionCode} thành công.`);
      fetchData();
    } catch (err) {
      showToast(err.message || "Không thể cấp phát đơn thuốc.", "error");
    } finally {
      setDispensingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Pill size={22} color="#7c3aed" />
        <h2 style={{ margin: 0, fontSize: 20 }}>Quản lý cấp phát thuốc</h2>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
          color: toast.type === "error" ? "#991b1b" : "#166534",
          border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
          padding: "10px 14px", borderRadius: 8, fontSize: 14,
          fontWeight: 500, marginBottom: 16,
        }}>
          {toast.message}
        </div>
      )}

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="CREATED">Chờ cấp phát</option>
          <option value="CHECKED">Đã kiểm tra</option>
          <option value="DISPENSED">Đã cấp phát</option>
        </select>
        <button
          className="secondary-button"
          onClick={fetchData}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn thuốc</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ width: 90, textAlign: "center" }}>Số thuốc</th>
              <th style={{ width: 140 }}>Tương tác thuốc</th>
              <th style={{ width: 160 }}>Ngày tạo</th>
              <th style={{ textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="empty-row">Đang tải...</td></tr>
            ) : prescriptions.length === 0 ? (
              <tr><td colSpan={6} className="empty-row">Không có đơn thuốc nào.</td></tr>
            ) : (
              prescriptions.map((rx) => {
                const isDispensing = dispensingId === rx.prescriptionId;
                return (
                  <tr key={rx.prescriptionId}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#7c3aed" }}>{rx.prescriptionCode}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Ca khám #{rx.consultationId}
                      </div>
                    </td>
                    <td><StatusBadge status={rx.status} /></td>
                    <td style={{ textAlign: "center" }}>{rx.items?.length || 0}</td>
                    <td>
                      {rx.drugInteractionChecked ? (
                        rx.interactionWarning && !rx.interactionWarning.includes("No dangerous") ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#d97706", fontSize: 12, fontWeight: 600 }}>
                            <AlertTriangle size={13} /> Có cảnh báo
                          </span>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
                            <ShieldCheck size={13} /> An toàn
                          </span>
                        )
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>Chưa kiểm tra</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: "#6b7280" }}>
                      {new Date(rx.createdAt).toLocaleString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        {/* Xem chi tiết */}
                        <button
                          onClick={() => navigate(`/dashboard/prescriptions/${rx.prescriptionId}`)}
                          title="Xem chi tiết"
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "4px 10px", borderRadius: 6, border: "none",
                            background: "#f3f4f6", color: "#374151",
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                          }}
                        >
                          <Eye size={13} /> Xem
                        </button>

                        {/* Cấp phát */}
                        {(rx.status === "CREATED" || rx.status === "CHECKED") && (
                          <button
                            onClick={() => handleDispense(rx.prescriptionId, rx.prescriptionCode)}
                            disabled={isDispensing}
                            title="Cấp phát thuốc"
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "4px 10px", borderRadius: 6, border: "none",
                              background: isDispensing ? "#d1fae5" : "#16a34a",
                              color: "#fff", cursor: isDispensing ? "not-allowed" : "pointer",
                              fontSize: 12, fontWeight: 600, opacity: isDispensing ? 0.7 : 1,
                            }}
                          >
                            <CheckCircle size={13} />
                            {isDispensing ? "Đang xử lý..." : "Cấp phát"}
                          </button>
                        )}

                        {rx.status === "DISPENSED" && (
                          <span style={{
                            fontSize: 12, color: "#16a34a", fontWeight: 600,
                            padding: "4px 8px", background: "#dcfce7", borderRadius: 6,
                          }}>
                            ✓ Đã cấp phát
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button
            className="secondary-button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span style={{ padding: "6px 12px", fontSize: 13, color: "#6b7280" }}>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            className="secondary-button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
}
