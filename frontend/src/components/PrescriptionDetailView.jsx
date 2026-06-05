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
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: 15 }}>💊 Đơn thuốc</h4>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Mã: <strong>{prescription.prescriptionCode}</strong>
          {" · "}
          {new Date(prescription.createdAt).toLocaleDateString("vi-VN")}
        </span>
      </div>

      {prescription.interactionWarning && (
        <div style={{
          background: "#fef3c7", border: "1px solid #fcd34d",
          borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 13
        }}>
          ⚠️ <strong>Cảnh báo tương tác thuốc:</strong> {prescription.interactionWarning}
        </div>
      )}

      <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "rgba(255, 255, 255, 0.3)" }}>
            <th style={{ ...thStyle, width: "30%" }}>Tên thuốc</th>
            <th style={{ ...thStyle, width: "15%" }}>Dạng bào chế</th>
            <th style={{ ...thStyle, width: "12%" }}>Hàm lượng</th>
            <th style={{ ...thStyle, width: "8%" }}>SL</th>
            <th style={{ ...thStyle, width: "15%" }}>Liều dùng</th>
            <th style={{ ...thStyle, width: "10%" }}>Tần suất</th>
            <th style={{ ...thStyle, width: "10%" }}>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {prescription.items.map((item) => (
            <tr key={item.prescriptionItemId} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.3)" }}>
              <td style={tdStyle}>
                <div style={{ fontWeight: 600 }}>{item.medicineName}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>{item.medicineCode}</div>
              </td>
              <td style={tdStyle}>{item.dosageForm || "—"}</td>
              <td style={tdStyle}>{item.strength || "—"}</td>
              <td style={{ ...tdStyle, textAlign: "center" }}>{item.quantity} {item.unit || ""}</td>
              <td style={tdStyle}>{item.dosage || "—"}</td>
              <td style={tdStyle}>{item.frequency || "—"}</td>
              <td style={tdStyle}>{item.duration || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(item => item)(prescription.items.some(i => i.morningDose || i.noonDose || i.eveningDose || i.nightDose)) && (
        <div style={{ marginTop: 10 }}>
          <strong style={{ fontSize: 13 }}>Lịch uống thuốc:</strong>
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 13, marginTop: 4 }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.3)" }}>
                <th style={{ ...thStyle, width: "40%" }}>Thuốc</th>
                <th style={{ ...thStyle, width: "15%", textAlign: "center" }}>Sáng</th>
                <th style={{ ...thStyle, width: "15%", textAlign: "center" }}>Trưa</th>
                <th style={{ ...thStyle, width: "15%", textAlign: "center" }}>Chiều</th>
                <th style={{ ...thStyle, width: "15%", textAlign: "center" }}>Tối</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items
                .filter(i => i.morningDose || i.noonDose || i.eveningDose || i.nightDose)
                .map((item) => (
                  <tr key={item.prescriptionItemId} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.3)" }}>
                    <td style={tdStyle}>{item.medicineName}</td>
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

      {prescription.doctorNote && (
        <div style={{ marginTop: 10, fontSize: 13 }}>
          <strong>Lời dặn:</strong> {prescription.doctorNote}
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "6px 10px",
  textAlign: "left",
  fontWeight: 600,
  borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
};

const tdStyle = {
  padding: "6px 10px",
  verticalAlign: "top",
};
