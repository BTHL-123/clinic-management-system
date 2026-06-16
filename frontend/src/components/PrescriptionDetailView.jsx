import { useEffect, useState } from "react";
import { getPrescriptionByConsultationId } from "../services/prescriptionService";

export default function PrescriptionDetailView({ consultationId }) {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!consultationId) return;
    setLoading(true);
    getPrescriptionByConsultationId(consultationId)
      .then((res) => {
        setPrescription(res.data);
        setError("");
      })
      .catch((err) => setError(err.message || "Không thể tải đơn thuốc."))
      .finally(() => setLoading(false));
  }, [consultationId]);

  if (loading) return <p style={{ color: "#6b7280", fontSize: 14 }}>Đang tải đơn thuốc...</p>;
  if (error) return <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>;
  if (!prescription) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {/* Sub-header meta info bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <span style={{ fontSize: 13 }} className="patient-label">
          Mã đơn thuốc: <strong className="patient-data">{prescription.prescriptionCode}</strong>
        </span>
        <span style={{ fontSize: 13 }} className="patient-label">
          Ngày kê: <strong className="patient-data">{new Date(prescription.createdAt).toLocaleDateString("vi-VN")}</strong>
        </span>
      </div>

      {prescription.interactionWarning && (
        <div style={{
          background: "rgba(254, 243, 199, 0.8)", border: "1px solid rgba(252, 211, 77, 0.8)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#b45309",
          display: "flex", gap: "8px", alignItems: "center"
        }}>
          ⚠️ <strong>Cảnh báo tương tác:</strong> {prescription.interactionWarning}
        </div>
      )}

      {/* Main Table wrapper */}
      <div className="table-wrapper" style={{ marginBottom: 16 }}>
        <table className="data-table fixed-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Tên thuốc</th>
              <th style={{ width: "15%" }}>Dạng bào chế</th>
              <th style={{ width: "12%" }}>Hàm lượng</th>
              <th style={{ width: "10%", textAlign: "center" }}>SL</th>
              <th style={{ width: "15%" }}>Liều dùng</th>
              <th style={{ width: "10%" }}>Tần suất</th>
              <th style={{ width: "8%" }}>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {prescription.items.map((item) => (
              <tr key={item.prescriptionItemId}>
                <td>
                  <div style={{ fontWeight: 700 }} className="patient-data">{item.medicineName}</div>
                  <div style={{ fontSize: 11 }} className="patient-label">{item.medicineCode}</div>
                </td>
                <td className="patient-data">{item.dosageForm || "—"}</td>
                <td className="patient-data">{item.strength || "—"}</td>
                <td style={{ textAlign: "center" }} className="patient-data">{item.quantity} {item.unit || ""}</td>
                <td className="patient-data">{item.dosage || "—"}</td>
                <td className="patient-data">{item.frequency || "—"}</td>
                <td className="patient-data">{item.duration || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Medication Schedule */}
      {prescription.items.some(i => i.morningDose || i.noonDose || i.eveningDose || i.nightDose) && (
        <div style={{ marginTop: 16 }}>
          <strong style={{ fontSize: 13, display: "block", marginBottom: 6 }} className="patient-section-title">Lịch uống thuốc:</strong>
          <div className="table-wrapper">
            <table className="data-table fixed-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Thuốc</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Sáng</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Trưa</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Chiều</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Tối</th>
                </tr>
              </thead>
              <tbody>
                {prescription.items
                  .filter(i => i.morningDose || i.noonDose || i.eveningDose || i.nightDose)
                  .map((item) => (
                    <tr key={item.prescriptionItemId}>
                      <td className="patient-data" style={{ fontWeight: 700 }}>{item.medicineName}</td>
                      <td style={{ textAlign: "center" }} className="patient-data">{item.morningDose || "—"}</td>
                      <td style={{ textAlign: "center" }} className="patient-data">{item.noonDose || "—"}</td>
                      <td style={{ textAlign: "center" }} className="patient-data">{item.eveningDose || "—"}</td>
                      <td style={{ textAlign: "center" }} className="patient-data">{item.nightDose || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctor note */}
      {prescription.doctorNote && (
        <div style={{ marginTop: 14, fontSize: 13, padding: "10px 14px", background: "rgba(15, 118, 110, 0.05)", borderRadius: "8px", borderLeft: "4px solid #0f766e" }}>
          <strong className="patient-section-title">Lời dặn:</strong> <span className="patient-data">{prescription.doctorNote}</span>
        </div>
      )}
    </div>
  );
}
