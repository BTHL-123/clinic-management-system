import { useEffect, useState } from "react";
import { ClipboardList, X, FileText } from "lucide-react";
import { getPatientMedicalHistory } from "../services/medicalRecordService";

export default function MedicalHistory({ patientId, onClose, inline = false }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  const renderList = () => (
    <div className="table-wrapper" style={{ marginTop: 16 }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Ngày khám</th>
            <th>Triệu chứng</th>
            <th>Chẩn đoán</th>
            <th>Bác sĩ</th>
            <th>Chuyên khoa</th>
            <th style={{ textAlign: "center" }}>Chi tiết</th>
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
        className="secondary-button" 
        onClick={() => setSelectedRecord(null)}
        style={{ marginBottom: 16 }}
      >
        &larr; Quay lại danh sách
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8 }}>
          <h4 style={{ marginBottom: 12, borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}>Thông tin khám</h4>
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

        <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8 }}>
          <h4 style={{ marginBottom: 12, borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}>Chẩn đoán & Điều trị</h4>
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
            <div style={{ marginTop: 12, background: "#ecfdf5", padding: 12, borderRadius: 6, border: "1px solid #d1fae5" }}>
              <strong>Tái khám:</strong>
              {selectedRecord.followUpDate && <p style={{ marginTop: 4 }}>Ngày: {new Date(selectedRecord.followUpDate).toLocaleDateString("vi-VN")}</p>}
              {selectedRecord.followUpNote && <p style={{ marginTop: 4 }}>Ghi chú: {selectedRecord.followUpNote}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
       * PLACEHOLDER: Khu vực dành cho Component của Người 4.
       * Sau khi Người 4 hoàn thành Task 47 (Đơn thuốc) và Task 44 (Xét nghiệm),
       * import và nhúng Component vào đây:
       *
       *   import PrescriptionDetailView from './PrescriptionDetailView';
       *   import LabResultView from './LabResultView';
       *
       *   {selectedRecord.hasPrescription && (
       *     <PrescriptionDetailView consultationId={selectedRecord.consultationId} />
       *   )}
       *   {selectedRecord.hasLabResult && (
       *     <LabResultView consultationId={selectedRecord.consultationId} />
       *   )}
       * ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fefce8", padding: 16, borderRadius: 8, border: "1px dashed #ca8a04", textAlign: "center" }}>
          <p style={{ color: "#92400e", fontSize: 13 }}>💊 Đơn thuốc</p>
          <p style={{ color: "#a16207", fontSize: 12, marginTop: 4 }}>Chờ tích hợp từ Người 4 (Task 47)</p>
        </div>
        <div style={{ background: "#fefce8", padding: 16, borderRadius: 8, border: "1px dashed #ca8a04", textAlign: "center" }}>
          <p style={{ color: "#92400e", fontSize: 13 }}>🔬 Kết quả xét nghiệm</p>
          <p style={{ color: "#a16207", fontSize: 12, marginTop: 4 }}>Chờ tích hợp từ Người 4 (Task 80)</p>
        </div>
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
    return <div style={{ padding: "0 16px 16px 16px" }}>{content}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: "800px", maxWidth: "95vw" }}>
        {content}
      </div>
    </div>
  );
}
