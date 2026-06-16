import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pill, ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { getPrescriptionById } from "../../services/prescriptionService";
import { useAuth } from "../../context/useAuth";
import PageHeader from "../../components/PageHeader";

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
  const { user } = useAuth();
  const isPatientMode = user?.roles?.includes("PATIENT");
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
    <div className="max-w-[1400px] w-[95%] mx-auto">
      <div className={`${isPatientMode ? "patient-glass-card" : "light-glass-card"} p-6 md:p-8 w-full mb-10`}>
      {/* Header */}
      <PageHeader
        title="Chi tiết đơn thuốc"
        icon={Pill}
        iconColor="text-white"
        onBack={() => navigate(-1)}
        rightContent={<StatusBadge status={prescription.status} />}
      />

      {/* Thông tin đơn */}
      <div className={isPatientMode ? "patient-glass-subcard" : "light-glass-subcard"} style={{
        padding: "16px 20px", marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
      }}>
        <div>
          <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: 12, color: isPatientMode ? undefined : "#6b7280", fontWeight: 650 }}>Mã đơn thuốc</div>
          <div className={isPatientMode ? "patient-data" : ""} style={{ fontWeight: 700, color: isPatientMode ? undefined : "#7c3aed" }}>{prescription.prescriptionCode}</div>
        </div>
        <div>
          <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: 12, color: isPatientMode ? undefined : "#6b7280", fontWeight: 650 }}>Ngày tạo</div>
          <div className={isPatientMode ? "patient-data" : ""} style={{ fontWeight: 600, color: isPatientMode ? undefined : "#1e293b" }}>
            {new Date(prescription.createdAt).toLocaleDateString("vi-VN", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </div>
        <div>
          <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: 12, color: isPatientMode ? undefined : "#6b7280", fontWeight: 650 }}>Kiểm tra tương tác</div>
          <div className={isPatientMode ? "patient-data" : ""} style={{ fontWeight: 600 }}>
            {prescription.drugInteractionChecked
              ? <span className={isPatientMode ? "text-teal-700" : "text-emerald-600"}>✓ Đã kiểm tra</span>
              : <span className={isPatientMode ? "text-slate-400" : "text-slate-500"}>Chưa kiểm tra</span>}
          </div>
        </div>
      </div>

      {/* Cảnh báo tương tác thuốc */}
      {prescription.interactionWarning && (
        <div style={{
          background: prescription.interactionWarning.includes("No dangerous")
            ? "rgba(209, 250, 229, 0.6)" : "rgba(254, 243, 199, 0.6)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${prescription.interactionWarning.includes("No dangerous") ? "rgba(52, 211, 153, 0.6)" : "rgba(251, 191, 36, 0.6)"}`,
          borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13,
          color: prescription.interactionWarning.includes("No dangerous") ? "#065f46" : "#92400e"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            {prescription.interactionWarning.includes("No dangerous")
              ? <ShieldCheck size={16} color="#059669" />
              : <AlertTriangle size={16} color="#d97706" />}
            <strong style={{ fontWeight: 700 }}>
              {prescription.interactionWarning.includes("No dangerous")
                ? "Không phát hiện tương tác nguy hiểm"
                : "Cảnh báo tương tác thuốc"}
            </strong>
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontWeight: 500 }}>
            {prescription.interactionWarning}
          </pre>
        </div>
      )}

      {/* Danh sách thuốc */}
      <div className={isPatientMode ? "patient-glass-subcard" : "light-glass-subcard"} style={{ padding: 16, marginBottom: 20 }}>
        <h3 className={isPatientMode ? "patient-section-title" : ""} style={{ margin: "0 0 12px 0", fontSize: 15, color: isPatientMode ? undefined : "#6d28d9", display: "flex", alignItems: "center", gap: 6 }}>
          <Pill size={15} /> Danh sách thuốc ({prescription.items?.length || 0} loại)
        </h3>

        <div className="table-wrapper">
          <table className="data-table fixed-table" style={{ fontSize: 13, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "28%", whiteSpace: "normal" }}>Tên thuốc</th>
                <th style={{ width: "14%", whiteSpace: "normal" }}>Dạng bào chế</th>
                <th style={{ width: "12%", whiteSpace: "normal" }}>Hàm lượng</th>
                <th style={{ width: "8%", textAlign: "center", whiteSpace: "normal" }}>SL</th>
                <th style={{ width: "16%", whiteSpace: "normal" }}>Liều dùng</th>
                <th style={{ width: "12%", whiteSpace: "normal" }}>Tần suất</th>
                <th style={{ width: "10%", whiteSpace: "normal" }}>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items?.map((item) => (
                <tr key={item.prescriptionItemId}>
                  <td style={{ whiteSpace: "normal" }}>
                    <div style={{ fontWeight: 700 }} className="patient-data">{item.medicineName}</div>
                    <div style={{ fontSize: 11 }} className="patient-label">{item.medicineCode}</div>
                  </td>
                  <td className="patient-data" style={{ whiteSpace: "normal" }}>{item.dosageForm || "—"}</td>
                  <td className="patient-data" style={{ whiteSpace: "normal" }}>{item.strength || "—"}</td>
                  <td style={{ textAlign: "center", whiteSpace: "normal" }} className="patient-data">
                    {item.quantity} {item.unit || ""}
                  </td>
                  <td className="patient-data" style={{ whiteSpace: "normal" }}>{item.dosage || "—"}</td>
                  <td className="patient-data" style={{ whiteSpace: "normal" }}>{item.frequency || "—"}</td>
                  <td className="patient-data" style={{ whiteSpace: "normal" }}>{item.duration || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lịch uống thuốc */}
      {hasDoseSchedule && (
        <div className={isPatientMode ? "patient-glass-subcard" : "light-glass-subcard"} style={{ padding: 16, marginBottom: 20 }}>
          <h3 className={isPatientMode ? "patient-section-title" : ""} style={{ margin: "0 0 12px 0", fontSize: 15, color: isPatientMode ? undefined : "#6d28d9" }}>Lịch uống thuốc</h3>
          <div className="table-wrapper">
            <table className="data-table fixed-table" style={{ fontSize: 13, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "40%", whiteSpace: "normal" }}>Thuốc</th>
                  <th style={{ width: "15%", textAlign: "center", whiteSpace: "normal" }}>Sáng</th>
                  <th style={{ width: "15%", textAlign: "center", whiteSpace: "normal" }}>Trưa</th>
                  <th style={{ width: "15%", textAlign: "center", whiteSpace: "normal" }}>Chiều</th>
                  <th style={{ width: "15%", textAlign: "center", whiteSpace: "normal" }}>Tối</th>
                </tr>
              </thead>
              <tbody>
                {prescription.items
                  ?.filter((i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose)
                  .map((item) => (
                    <tr key={item.prescriptionItemId}>
                      <td className="patient-data" style={{ fontWeight: 700, whiteSpace: "normal" }}>{item.medicineName}</td>
                      <td style={{ textAlign: "center", whiteSpace: "normal" }} className="patient-data">{item.morningDose || "—"}</td>
                      <td style={{ textAlign: "center", whiteSpace: "normal" }} className="patient-data">{item.noonDose || "—"}</td>
                      <td style={{ textAlign: "center", whiteSpace: "normal" }} className="patient-data">{item.eveningDose || "—"}</td>
                      <td style={{ textAlign: "center", whiteSpace: "normal" }} className="patient-data">{item.nightDose || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lời dặn */}
      {prescription.doctorNote && (
        <div className={isPatientMode ? "patient-glass-subcard" : "light-glass-subcard"} style={{ padding: "16px 20px" }}>
          <strong className={isPatientMode ? "patient-section-title" : ""} style={{ fontSize: 14, display: "block", marginBottom: 6, color: isPatientMode ? undefined : "#0f766e" }}>Lời dặn của bác sĩ:</strong>
          <p className={isPatientMode ? "patient-data" : ""} style={{ margin: 0, fontSize: 13, color: isPatientMode ? undefined : "#374151", lineHeight: 1.5 }}>{prescription.doctorNote}</p>
        </div>
      )}
    </div>
    </div>
  );
}
