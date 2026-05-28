import { useEffect, useState } from "react";
import { getLabRequestsByConsultationId } from "../services/labRequestService";

export default function LabResultView({ consultationId }) {
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!consultationId) return;
    setLoading(true);
    getLabRequestsByConsultationId(consultationId)
      .then((res) => {
        setLabRequests(res.data || []);
        setError("");
      })
      .catch((err) => setError(err.message || "Không thể tải kết quả xét nghiệm."))
      .finally(() => setLoading(false));
  }, [consultationId]);

  if (loading) return <p style={{ color: "#6b7280", fontSize: 14 }}>Đang tải kết quả xét nghiệm...</p>;
  if (error) return <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>;
  if (!labRequests.length) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>🔬 Kết quả xét nghiệm</h4>

      {labRequests.map((req) => (
        <div key={req.labRequestId} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
            <span>
              Phiếu: <strong>{req.requestCode}</strong>
              {" · "}
              <StatusBadge status={req.status} />
            </span>
            <span style={{ color: "#6b7280" }}>
              {new Date(req.requestedAt).toLocaleDateString("vi-VN")}
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={thStyle}>Tên xét nghiệm</th>
                <th style={thStyle}>Mã</th>
                <th style={thStyle}>Kết quả</th>
                <th style={thStyle}>Đơn vị</th>
                <th style={thStyle}>Khoảng bình thường</th>
                <th style={thStyle}>Kết luận</th>
                <th style={thStyle}>File</th>
              </tr>
            </thead>
            <tbody>
              {req.items.map((item) => (
                <tr key={item.labRequestItemId} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{item.testName}</div>
                  </td>
                  <td style={tdStyle}>{item.testCode}</td>
                  {item.labResult ? (
                    <>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.labResult.resultValue || "—"}</td>
                      <td style={tdStyle}>{item.labResult.resultUnit || "—"}</td>
                      <td style={tdStyle}>{item.labResult.normalRange || "—"}</td>
                      <td style={tdStyle}>{item.labResult.conclusion || "—"}</td>
                      <td style={tdStyle}>
                        {item.labResult.resultFileUrl ? (
                          <a
                            href={item.labResult.resultFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#2563eb", textDecoration: "underline" }}
                          >
                            Xem file
                          </a>
                        ) : "—"}
                      </td>
                    </>
                  ) : (
                    <td colSpan={5} style={{ ...tdStyle, color: "#9ca3af", fontStyle: "italic" }}>
                      Chưa có kết quả
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {req.note && (
            <div style={{ marginTop: 6, fontSize: 13, color: "#374151" }}>
              <strong>Ghi chú:</strong> {req.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    REQUESTED: { label: "Chờ xử lý", color: "#d97706", bg: "#fef3c7" },
    IN_PROGRESS: { label: "Đang thực hiện", color: "#2563eb", bg: "#dbeafe" },
    COMPLETED: { label: "Hoàn thành", color: "#16a34a", bg: "#dcfce7" },
    CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
  };
  const s = map[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "1px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600
    }}>
      {s.label}
    </span>
  );
}

const thStyle = {
  padding: "6px 10px",
  textAlign: "left",
  fontWeight: 600,
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle = {
  padding: "6px 10px",
  verticalAlign: "top",
};
