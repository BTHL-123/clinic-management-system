import { useEffect, useState } from "react";
import { ClipboardList, X, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPatientMedicalHistory } from "../services/medicalRecordService";
import PrescriptionDetailView from "./PrescriptionDetailView";
import LabResultView from "./LabResultView";
import { getPrescriptionByConsultationId } from "../services/prescriptionService";

export default function MedicalHistory({ patientId, onClose, inline = false, isPatientView = false }) {
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
    <div className="w-full mt-4 overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead className={isPatientView ? "bg-white/15 border-b border-slate-300 text-sm" : "bg-white/40 border-b border-white/60 text-slate-700 text-sm"}>
          <tr>
            <th className={`p-4 font-bold w-[160px] ${isPatientView ? "patient-label" : ""}`}>Ngày khám</th>
            <th className={`p-4 font-bold ${isPatientView ? "patient-label" : ""}`}>Triệu chứng</th>
            <th className={`p-4 font-bold ${isPatientView ? "patient-label" : ""}`}>Chẩn đoán</th>
            <th className={`p-4 font-bold ${isPatientView ? "patient-label" : ""}`}>Bác sĩ</th>
            <th className={`p-4 font-bold ${isPatientView ? "patient-label" : ""}`}>Chuyên khoa</th>
            <th className={`p-4 font-bold text-center w-[100px] ${isPatientView ? "patient-label" : ""}`}>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className={`p-8 text-center font-bold ${isPatientView ? "text-slate-600" : "text-slate-500"}`}>Đang tải lịch sử bệnh án...</td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td colSpan={6} className={`p-8 text-center font-bold ${isPatientView ? "text-slate-600" : "text-slate-500"}`}>Chưa có lịch sử bệnh án.</td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.medicalRecordId} className={`border-b transition-colors ${isPatientView ? "border-slate-200/60 hover:bg-black/5" : "border-slate-200/50 hover:bg-white/50"}`}>
                <td className={`p-4 ${isPatientView ? "patient-data font-semibold" : "text-slate-600"}`}>{formatDate(record.createdAt)}</td>
                <td className={`p-4 ${isPatientView ? "patient-data font-medium" : "text-slate-700"}`}>{record.symptoms || "—"}</td>
                <td className={`p-4 font-bold ${isPatientView ? "patient-data" : "text-slate-800"}`}>{record.diagnosis || "—"}</td>
                <td className={`p-4 ${isPatientView ? "patient-data font-medium" : "text-slate-600"}`}>{record.doctorName || "—"}</td>
                <td className={`p-4 ${isPatientView ? "patient-data font-medium" : "text-slate-600"}`}>{record.departmentName || "—"}</td>
                <td className="p-4 text-center">
                  <button 
                    className={isPatientView 
                      ? "p-2 bg-black/5 hover:bg-black/10 text-slate-800 border border-slate-300 rounded-xl transition-colors shadow-sm inline-flex justify-center" 
                      : "p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-xl transition-colors shadow-sm inline-flex justify-center"} 
                    title="Xem chi tiết"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <FileText size={18} />
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
    <div className="mt-4 flex flex-col gap-6">
      <div>
        <button 
          onClick={() => setSelectedRecord(null)}
          className={isPatientView 
            ? "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-md border border-slate-300 text-slate-900 font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            : "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-md border border-white/50 text-teal-700 font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5"}
        >
          &larr; Quay lại danh sách
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={isPatientView ? "patient-glass-subcard p-6" : "bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm"}>
          <h4 className={`text-lg font-bold mb-4 pb-2 border-b patient-section-title ${isPatientView ? "border-slate-300" : "text-slate-800 border-slate-200/60"}`}>Thông tin khám</h4>
          <div className="flex flex-col gap-3">
            <p className={isPatientView ? "patient-data" : "text-slate-700"}><strong className="mr-2">Ngày khám:</strong> {formatDate(selectedRecord.createdAt)}</p>
            <p className={isPatientView ? "patient-data" : "text-slate-700"}><strong className="mr-2">Bác sĩ:</strong> {selectedRecord.doctorName || "—"}</p>
            <p className={isPatientView ? "patient-data" : "text-slate-700"}><strong className="mr-2">Chuyên khoa:</strong> {selectedRecord.departmentName || "—"}</p>
            <div className="pt-2">
              <strong className={isPatientView ? "" : "text-slate-800"}>Triệu chứng:</strong>
              <p className={`mt-1.5 whitespace-pre-wrap ${isPatientView ? "patient-data font-medium" : "text-slate-700"}`}>{selectedRecord.symptoms || "—"}</p>
            </div>
            <div className="pt-2">
              <strong className={isPatientView ? "" : "text-slate-800"}>Khám lâm sàng:</strong>
              <p className={`mt-1.5 whitespace-pre-wrap ${isPatientView ? "patient-data font-medium" : "text-slate-700"}`}>{selectedRecord.clinicalFindings || "—"}</p>
            </div>
          </div>
        </div>

        <div className={isPatientView ? "patient-glass-subcard p-6" : "bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm"}>
          <h4 className={`text-lg font-bold mb-4 pb-2 border-b patient-section-title ${isPatientView ? "border-slate-300" : "text-slate-800 border-slate-200/60"}`}>Chẩn đoán & Điều trị</h4>
          <div className="flex flex-col gap-3">
            <div>
              <strong className={isPatientView ? "" : "text-slate-800"}>Chẩn đoán:</strong>
              <p className={`mt-1.5 font-extrabold text-lg ${isPatientView ? "patient-data" : "text-rose-600"}`}>{selectedRecord.diagnosis || "—"}</p>
            </div>
            <div className="pt-2">
              <strong className={isPatientView ? "" : "text-slate-800"}>Hướng điều trị:</strong>
              <p className={`mt-1.5 whitespace-pre-wrap ${isPatientView ? "patient-data font-medium" : "text-slate-700"}`}>{selectedRecord.treatmentPlan || "—"}</p>
            </div>
            <div className="pt-2">
              <strong className={isPatientView ? "" : "text-slate-800"}>Lời dặn của bác sĩ:</strong>
              <p className={`mt-1.5 whitespace-pre-wrap ${isPatientView ? "patient-data font-medium" : "text-slate-700"}`}>{selectedRecord.doctorNote || "—"}</p>
            </div>
            {(selectedRecord.followUpDate || selectedRecord.followUpNote) && (
              <div className={`mt-3 p-4 rounded-2xl border ${isPatientView ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800" : "bg-emerald-50/70 border-emerald-100"}`}>
                <strong className={isPatientView ? "text-emerald-900 font-extrabold" : "text-emerald-800"}>Tái khám:</strong>
                {selectedRecord.followUpDate && <p className={`mt-1.5 ${isPatientView ? "text-emerald-800 font-semibold" : "text-emerald-700"}`}>Ngày: {new Date(selectedRecord.followUpDate).toLocaleDateString("vi-VN")}</p>}
                {selectedRecord.followUpNote && <p className={`mt-1 ${isPatientView ? "text-emerald-800 font-semibold" : "text-emerald-700"}`}>Ghi chú: {selectedRecord.followUpNote}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
       * Đơn thuốc và Kết quả xét nghiệm - Task 47 & Task 80
       * ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        {selectedRecord.hasLabResult && (
          <div className={isPatientView ? "patient-glass-subcard p-6" : "bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm"}>
            <LabResultView consultationId={selectedRecord.consultationId} />
          </div>
        )}
        {selectedRecord.hasPrescription && (
          <div className={isPatientView ? "patient-glass-subcard p-6" : "bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm"}>
            <div className="flex justify-between items-center mb-4">
              <span className={isPatientView ? "patient-card-title text-lg" : "font-bold text-lg text-slate-800"}>💊 Đơn thuốc</span>
              {prescriptionIdMap[selectedRecord.consultationId] && (
                <button
                  onClick={() => navigate(`/dashboard/prescriptions/${prescriptionIdMap[selectedRecord.consultationId]}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-sm transition-colors"
                >
                  <ExternalLink size={16} /> Xem đơn thuốc đầy đủ
                </button>
              )}
            </div>
            <PrescriptionDetailView consultationId={selectedRecord.consultationId} isPatientMode={isPatientView} />
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
