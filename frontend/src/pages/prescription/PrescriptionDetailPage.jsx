import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pill, ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { getPrescriptionById } from "../../services/prescriptionService";

const STATUS_MAP = {
  CREATED:   { label: "Mới tạo",       color: "#d97706", bg: "#fef3c7" },
  CHECKED:   { label: "Đã kiểm tra",   color: "#2563eb", bg: "#dbeafe" },
  DISPENSED: { label: "Đã cấp phát",   color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Đã hủy",        color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

export default function PrescriptionDetailPage() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!prescriptionId) return;
    setLoading(true);
    getPrescriptionById(prescriptionId)
      .then((res) => {
        setPrescription(res.data);
        setError("");
      })
      .catch((err) => setError(err.message || "Không thể tải đơn thuốc."))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  if (loading) return <div style={{ padding: 32, color: "#6b7280" }}>Đang tải đơn thuốc...</div>;
  if (error) return <div style={{ padding: 32, color: "#dc2626" }}>{error}</div>;
  if (!prescription) return null;

  const hasDoseSchedule = prescription.items?.some(
    (i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 4px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button className="icon-button" onClick={() => navigate(-1)} title="Quay lại">
          <ArrowLeft size={18} />
        </button>
        <Pill size={20} color="#7c3aed" />
        <h2 style={{ margin: 0, fontSize: 20 }}>Chi tiết đơn thuốc</h2>
        <StatusBadge status={prescription.status} />
      </div>

      {/* Thông tin đơn */}
      <div style={{
        background: "#f9fafb", borderRadius: 8, padding: "14px 18px",
        marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Mã đơn thuốc</div>
          <div style={{ fontWeight: 700, color: "#7c3aed" }}>{prescription.prescriptionCode}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Ngày tạo</div>
          <div style={{ fontWeight: 600 }}>
            {new Date(prescription.createdAt).toLocaleDateString("vi-VN", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Kiểm tra tương tác</div>
          <div style={{ fontWeight: 600 }}>
            {prescription.drugInteractionChecked
              ? <span style={{ color: "#16a34a" }}>✓ Đã kiểm tra</span>
              : <span style={{ color: "#6b7280" }}>Chưa kiểm tra</span>}
          </div>
        </div>
      </div>

      {/* Cảnh báo tương tác thuốc */}
      {prescription.interactionWarning && (
        <div style={{
          background: prescription.interactionWarning.includes("No dangerous")
            ? "#f0fdf4" : "#fef3c7",
          border: `1px solid ${prescription.interactionWarning.includes("No dangerous") ? "#86efac" : "#fcd34d"}`,
          borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            {prescription.interactionWarning.includes("No dangerous")
              ? <ShieldCheck size={16} color="#16a34a" />
              : <AlertTriangle size={16} color="#d97706" />}
            <strong>
              {prescription.interactionWarning.includes("No dangerous")
                ? "Không phát hiện tương tác nguy hiểm"
                : "Cảnh báo tương tác thuốc"}
            </strong>
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {prescription.interactionWarning}
          </pre>
        </div>
      )}

      {/* Danh sách thuốc */}
      <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: 15, color: "#6d28d9", display: "flex", alignItems: "center", gap: 6 }}>
          <Pill size={15} /> Danh sách thuốc ({prescription.items?.length || 0} loại)
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f5f3ff" }}>
                {["Tên thuốc", "Dạng bào chế", "Hàm lượng", "SL", "Liều dùng", "Tần suất", "Thời gian"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prescription.items?.map((item) => (
                <tr key={item.prescriptionItemId} style={{ borderBottom: "1px solid #e9d5ff" }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{item.medicineName}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{item.medicineCode}</div>
                  </td>
                  <td style={tdStyle}>{item.dosageForm || "—"}</td>
                  <td style={tdStyle}>{item.strength || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {item.quantity} {item.unit || ""}
                  </td>
                  <td style={tdStyle}>{item.dosage || "—"}</td>
                  <td style={tdStyle}>{item.frequency || "—"}</td>
                  <td style={tdStyle}>{item.duration || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lịch uống thuốc */}
      {hasDoseSchedule && (
        <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 15, color: "#6d28d9" }}>Lịch uống thuốc</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f5f3ff" }}>
                {["Thuốc", "Sáng", "Trưa", "Chiều", "Tối"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prescription.items
                ?.filter((i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose)
                .map((item) => (
                  <tr key={item.prescriptionItemId} style={{ borderBottom: "1px solid #e9d5ff" }}>
                    <td style={tdStyle}><strong>{item.medicineName}</strong></td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{item.morningDose || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{item.noonDose || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{item.eveningDose || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{item.nightDose || "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lời dặn */}
      {prescription.doctorNote && (
        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 16px" }}>
          <strong style={{ fontSize: 13 }}>Lời dặn của bác sĩ:</strong>
          <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#374151" }}>{prescription.doctorNote}</p>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "8px 10px", textAlign: "left",
  fontWeight: 600, borderBottom: "1px solid #e9d5ff",
};
const tdStyle = { padding: "8px 10px", verticalAlign: "top" };
