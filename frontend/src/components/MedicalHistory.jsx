import { useEffect, useState } from "react";
import { ClipboardList, X, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPatientMedicalHistory } from "../services/medicalRecordService";
import PrescriptionDetailView from "./PrescriptionDetailView";
import LabResultView from "./LabResultView";
import { getPrescriptionByConsultationId } from "../services/prescriptionService";

export default function MedicalHistory({ patientId, onClose, inline = false }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  // Map consultationId → prescriptionId (fetched lazily)
  const [prescriptionIdMap, setPrescriptionIdMap] = useState({});

  useEffect(() => {
    if (!patientId) return;
    
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await getPatientMedicalHistory(patientId);
        setRecords(res.data || []);
        setError("");
      } catch (err) {
        setError(err.message || "Không thể tải lịch sử khám bệnh.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [patientId]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  };

  // Khi chọn một bệnh án có đơn thuốc, lấy prescriptionId để navigate
  useEffect(() => {
    if (!selectedRecord?.hasPrescription) return;
    const cid = selectedRecord.consultationId;
    if (prescriptionIdMap[cid]) return; // Đã có rồi
    getPrescriptionByConsultationId(cid)
      .then((res) => {
        const pid = res.data?.prescriptionId;
        if (pid) {
          setPrescriptionIdMap((prev) => ({ ...prev, [cid]: pid }));
        }
      })
      .catch(() => {}); // Fail silently — inline view vẫn hiển thị
  }, [selectedRecord]);

  const renderList = () => (
    <div className="table-wrapper" style={{ marginTop: 16, width: "100%", minWidth: "100%", display: "block" }}>
      <table className="data-table" style={{ width: "100%", minWidth: "100%", display: "table", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ width: "160px" }}>Ngày khám</th>
            <th>Triệu chứng</th>
            <th>Chẩn đoán</th>
            <th>Bác sĩ</th>
            <th>Chuyên khoa</th>
            <th style={{ textAlign: "center", width: "100px" }}>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="empty-row">Đang tải lịch sử bệnh án...</td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-row">Chưa có lịch sử bệnh án.</td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.medicalRecordId}>
                <td>{formatDate(record.createdAt)}</td>
                <td>{record.symptoms || "—"}</td>
                <td><strong>{record.diagnosis || "—"}</strong></td>
                <td>{record.doctorName || "—"}</td>
                <td>{record.departmentName || "—"}</td>
                <td style={{ textAlign: "center" }}>
                  <button 
                    className="icon-button" 
                    title="Xem chi tiết"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <FileText size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderDetail = () => (
    <div style={{ marginTop: 16 }}>
      <button 
        onClick={() => setSelectedRecord(null)}
        style={{
          marginBottom: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)",
          color: "#0f766e",
          fontWeight: 800,
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.9)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.7)"}
      >
        &larr; Quay lại danh sách
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.45)", padding: 16, borderRadius: "16px" }}>
          <h4 style={{ marginBottom: 12, borderBottom: "1px solid rgba(255, 255, 255, 0.3)", paddingBottom: 8, fontWeight: 700, color: "#1e293b" }}>Thông tin khám</h4>
          <p><strong>Ngày khám:</strong> {formatDate(selectedRecord.createdAt)}</p>
          <p><strong>Bác sĩ:</strong> {selectedRecord.doctorName || "—"}</p>
          <p><strong>Chuyên khoa:</strong> {selectedRecord.departmentName || "—"}</p>
          <div style={{ marginTop: 12 }}>
            <strong>Triệu chứng:</strong>
            <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedRecord.symptoms || "—"}</p>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Khám lâm sàng:</strong>
            <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedRecord.clinicalFindings || "—"}</p>
          </div>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.45)", padding: 16, borderRadius: "16px" }}>
          <h4 style={{ marginBottom: 12, borderBottom: "1px solid rgba(255, 255, 255, 0.3)", paddingBottom: 8, fontWeight: 700, color: "#1e293b" }}>Chẩn đoán & Điều trị</h4>
          <div>
            <strong>Chẩn đoán:</strong>
            <p style={{ marginTop: 4, color: "#b91c1c", fontWeight: "bold" }}>{selectedRecord.diagnosis || "—"}</p>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Hướng điều trị:</strong>
            <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedRecord.treatmentPlan || "—"}</p>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Lời dặn của bác sĩ:</strong>
            <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedRecord.doctorNote || "—"}</p>
          </div>
          {(selectedRecord.followUpDate || selectedRecord.followUpNote) && (
            <div style={{ marginTop: 12, background: "rgba(236, 253, 245, 0.5)", backdropFilter: "blur(4px)", padding: 12, borderRadius: "12px", border: "1px solid rgba(209, 250, 229, 0.6)" }}>
              <strong>Tái khám:</strong>
              {selectedRecord.followUpDate && <p style={{ marginTop: 4 }}>Ngày: {new Date(selectedRecord.followUpDate).toLocaleDateString("vi-VN")}</p>}
              {selectedRecord.followUpNote && <p style={{ marginTop: 4 }}>Ghi chú: {selectedRecord.followUpNote}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
       * Đơn thuốc và Kết quả xét nghiệm - Task 47 & Task 80
       * ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 16 }}>
        {selectedRecord.hasLabResult && (
          <div style={{ background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.45)", padding: 16, borderRadius: "16px", marginBottom: 12 }}>
            <LabResultView consultationId={selectedRecord.consultationId} />
          </div>
        )}
        {selectedRecord.hasPrescription && (
          <div style={{ background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.45)", padding: 16, borderRadius: "16px" }}>
            <div style={{ display: "flex", justifycontent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>💊 Đơn thuốc</span>
              {prescriptionIdMap[selectedRecord.consultationId] && (
                <button
                  onClick={() => navigate(`/dashboard/prescriptions/${prescriptionIdMap[selectedRecord.consultationId]}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 12px", borderRadius: 6, border: "1px solid #e9d5ff",
                    background: "#fdf4ff", color: "#7c3aed", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  <ExternalLink size={12} /> Xem đơn thuốc đầy đủ
                </button>
              )}
            </div>
            <PrescriptionDetailView consultationId={selectedRecord.consultationId} />
          </div>
        )}
      </div>
    </div>
  );

  const content = (
    <>
      {!inline && (
        <div className="modal-header">
          <h2>
            <ClipboardList size={22} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
            Lịch sử bệnh án
          </h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
      )}
      
      {error && <div className="error-box" style={{ marginTop: inline ? 0 : 16 }}>{error}</div>}
      
      {selectedRecord ? renderDetail() : renderList()}
    </>
  );

  if (inline) {
    return <div className="w-full" style={{ padding: "0 16px 16px 16px", width: "100%", minWidth: "100%", display: "block" }}>{content}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backgroundColor: "rgba(13, 76, 70, 0.25)", backdropFilter: "blur(8px)" }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: "800px", maxWidth: "95vw", background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 10px 40px rgba(0,0,0,0.12)" }}>
        {content}
      </div>
    </div>
  );
}
