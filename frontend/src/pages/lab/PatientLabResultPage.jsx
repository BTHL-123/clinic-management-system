import { useEffect, useState, useCallback } from "react";
import { FlaskConical, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { getMyLabRequests } from "../../services/labRequestService";

const STATUS_MAP = {
  REQUESTED:   { label: "Chờ xử lý",       color: "#d97706", bg: "#fef3c7" },
  IN_PROGRESS: { label: "Đang thực hiện",   color: "#2563eb", bg: "#dbeafe" },
  COMPLETED:   { label: "Hoàn thành",       color: "#16a34a", bg: "#dcfce7" },
  CANCELLED:   { label: "Đã hủy",           color: "#dc2626", bg: "#fee2e2" },
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

function ResultValueCell({ value }) {
  if (!value) return <span style={{ color: "#9ca3af" }}>—</span>;
  return <strong>{value}</strong>;
}

function LabRequestRow({ req }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 12,
      overflow: "hidden",
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", background: "#f9fafb",
          cursor: "pointer", userSelect: "none",
        }}
      >
        <FlaskConical size={16} color="#2563eb" />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, color: "#1d4ed8" }}>{req.requestCode}</span>
          <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 10 }}>
            {new Date(req.requestedAt).toLocaleDateString("vi-VN", {
              day: "2-digit", month: "2-digit", year: "numeric",
            })}
          </span>
        </div>
        <StatusBadge status={req.status} />
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {req.items?.length || 0} xét nghiệm
        </span>
        {expanded ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 16px 16px 16px" }}>
          {req.note && (
            <p style={{ fontSize: 13, color: "#6b7280", margin: "10px 0 8px" }}>
              <strong>Ghi chú:</strong> {req.note}
            </p>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#eff6ff" }}>
                  {["Tên xét nghiệm", "Mã XN", "Kết quả", "Đơn vị", "Khoảng bình thường", "Kết luận", "Trạng thái"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #bfdbfe" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {req.items?.map((item) => (
                  <tr key={item.labRequestItemId} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{item.testName}</td>
                    <td style={{ padding: "8px 10px", color: "#6b7280" }}>{item.testCode}</td>
                    {item.labResult ? (
                      <>
                        <td style={{ padding: "8px 10px" }}>
                          <ResultValueCell value={item.labResult.resultValue} />
                        </td>
                        <td style={{ padding: "8px 10px" }}>{item.labResult.resultUnit || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>{item.labResult.normalRange || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>{item.labResult.conclusion || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <StatusBadge status={item.status} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td colSpan={4} style={{ padding: "8px 10px", color: "#9ca3af", fontStyle: "italic" }}>
                          Chưa có kết quả
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <StatusBadge status={item.status} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientLabResultPage() {
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyLabRequests({ page, size: 10 });
      setLabRequests(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch (err) {
      setError(err.message || "Không thể tải kết quả xét nghiệm.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FlaskConical size={24} color="#2563eb" />
            Kết quả xét nghiệm
          </h1>
          <p className="muted">Xem toàn bộ phiếu xét nghiệm và kết quả của bạn.</p>
        </div>
        <button
          className="secondary-button"
          onClick={fetchData}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 32, color: "#6b7280", textAlign: "center" }}>
          Đang tải kết quả xét nghiệm...
        </div>
      ) : labRequests.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 24px", color: "#9ca3af",
          background: "#f9fafb", borderRadius: 12, border: "1px dashed #d1d5db",
        }}>
          <FlaskConical size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Bạn chưa có phiếu xét nghiệm nào.</p>
        </div>
      ) : (
        <>
          {labRequests.map((req) => (
            <LabRequestRow key={req.labRequestId} req={req} />
          ))}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button
                className="secondary-button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <ChevronLeft size={15} /> Trước
              </button>
              <span style={{ padding: "6px 12px", fontSize: 13, color: "#6b7280" }}>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="secondary-button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                Tiếp <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
