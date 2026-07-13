import { useEffect, useState } from "react";
import { ClipboardList, X, FileText, ExternalLink, Activity, ChevronDown, ChevronUp, CheckCircle2, User, Stethoscope, ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPatientMedicalHistory } from "../services/medicalRecordService";
import PrescriptionDetailView from "./PrescriptionDetailView";
import LabResultView from "./LabResultView";
import { getPrescriptionByConsultationId } from "../services/prescriptionService";
import { useAuth } from "../context/useAuth.js";

export default function MedicalHistory({ patientId, onClose, inline = false, isPatientView = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const roles = (user?.roles || []).map((r) => (typeof r === "string" ? r : r.roleName).replace(/^ROLE_/, ""));
  const isReceptionistOnly = roles.includes("RECEPTIONIST") && !roles.includes("ADMIN");
  
  // State for tracking pagination
  const [visibleCount, setVisibleCount] = useState(3);

  // Map consultationId → prescriptionId (fetched lazily)
  const [prescriptionIdMap, setPrescriptionIdMap] = useState({});
  // Map consultationId → prescription details (for items count and inline view)
  const [prescriptionsMap, setPrescriptionsMap] = useState({});

  // Map consultationId → toggled expanded states
  const [expandedPrescriptions, setExpandedPrescriptions] = useState({});
  const [expandedLabs, setExpandedLabs] = useState({});

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

  // Pre-fetch prescription details for visible records to show item count
  useEffect(() => {
    const visibleRecords = records.slice(0, visibleCount);
    visibleRecords.forEach((record) => {
      if (record.hasPrescription && !prescriptionsMap[record.consultationId]) {
        getPrescriptionByConsultationId(record.consultationId)
          .then((res) => {
            if (res.data) {
              setPrescriptionsMap((prev) => ({
                ...prev,
                [record.consultationId]: res.data,
              }));
              const pid = res.data.prescriptionId;
              if (pid) {
                setPrescriptionIdMap((prev) => ({
                  ...prev,
                  [record.consultationId]: pid,
                }));
              }
            }
          })
          .catch(() => {});
      }
    });
  }, [records, visibleCount, prescriptionsMap]);

  // Fetch prescription dynamically if user clicks and it hasn't loaded yet
  const togglePrescription = async (consultationId) => {
    setExpandedPrescriptions((prev) => ({
      ...prev,
      [consultationId]: !prev[consultationId],
    }));

    if (!prescriptionsMap[consultationId]) {
      try {
        const res = await getPrescriptionByConsultationId(consultationId);
        if (res.data) {
          setPrescriptionsMap((prev) => ({
            ...prev,
            [consultationId]: res.data,
          }));
          const pid = res.data.prescriptionId;
          if (pid) {
            setPrescriptionIdMap((prev) => ({
              ...prev,
              [consultationId]: pid,
            }));
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải đơn thuốc:", err);
      }
    }
  };

  const toggleLab = (consultationId) => {
    setExpandedLabs((prev) => ({
      ...prev,
      [consultationId]: !prev[consultationId],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  };

  const getTimelineDate = (dateString) => {
    if (!dateString) return { day: "—", monthYear: "—" };
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, "0");
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return {
      day,
      monthYear: `THÁNG ${month.toString().padStart(2, "0")}, ${year}`,
    };
  };

  const parseDoctorNotes = (noteText) => {
    if (!noteText) return [];
    return noteText
      .split(/\r?\n|\.\s+/)
      .map(s => s.trim().replace(/^[-*•✓\s]+/, "")) // Clean list bullet indicators
      .filter(s => s.length > 3);
  };

  const renderList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB896]"></div>
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="text-center py-16 px-6 text-slate-500 bg-white rounded-3xl border border-slate-200">
          Chưa có lịch sử khám bệnh nào.
        </div>
      );
    }

    return (
      <div className="relative pl-6 md:pl-10 ml-2 md:ml-4 border-l-2 border-teal-100 flex flex-col gap-8 py-4">
        {records.slice(0, visibleCount).map((record, index) => {
          const isLatest = index === 0;
          const { day, monthYear } = getTimelineDate(record.createdAt);
          const isPrescriptionExpanded = !!expandedPrescriptions[record.consultationId];
          const isLabExpanded = !!expandedLabs[record.consultationId];
          const notes = parseDoctorNotes(record.doctorNote);
          const prescriptionData = prescriptionsMap[record.consultationId];

          return (
            <div key={record.medicalRecordId} className="relative group">
              {/* Dot on the timeline */}
              <div 
                className={`absolute -left-[31px] md:-left-[47px] top-6 w-5 h-5 rounded-full border-4 border-white transform translate-x-[1px] md:translate-x-[0px] z-10 transition-all duration-300 ${
                  isLatest 
                    ? "bg-[#0A604E] scale-125 shadow-[0_0_8px_rgba(10,96,78,0.4)]" 
                    : "bg-[#A2C7C0] group-hover:bg-[#1DB896]"
                }`}
              />

              {/* The Timeline Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.035)] transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Date & Specialty Tag */}
                  <div className="lg:col-span-3 xl:col-span-2.5 flex flex-col items-center justify-center">
                    <div className="bg-[#D1F2EB] text-[#0A604E] rounded-2xl p-4 text-center w-full shadow-sm hover:shadow-md transition-shadow">
                      <span className="block text-3xl font-extrabold tracking-tight leading-none mb-1">
                        {day}
                      </span>
                      <span className="block text-[11px] font-extrabold uppercase tracking-wide opacity-85">
                        {monthYear}
                      </span>
                    </div>
                    {record.departmentName && (
                      <span className="mt-3 text-[11px] font-bold text-[#4A5D59] bg-[#E6F4F1] border border-[#D1F2EB] px-3.5 py-1.5 rounded-full text-center tracking-wide block w-full truncate">
                        {record.departmentName}
                      </span>
                    )}
                  </div>

                  {/* Middle Column: Doctor, Diagnosis, Action Links */}
                  <div className="lg:col-span-5 xl:col-span-5.5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                      <span>👤 Bác sĩ:</span>
                      <span className="text-[#0A604E] font-bold">{record.doctorName || "BS. Chưa ghi nhận"}</span>
                    </div>
                    
                    <h4 className="text-xl font-extrabold text-slate-800 leading-tight">
                      Chẩn đoán: {record.diagnosis || "Chưa xác định"}
                    </h4>
                    
                    <p className="text-sm font-medium text-slate-650 leading-relaxed">
                      {!isReceptionistOnly ? (record.symptoms || "Không ghi nhận triệu chứng bất thường.") : "Đã cập nhật"}
                    </p>

                    {/* Action Links */}
                    {!isReceptionistOnly && (
                      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100">
                        {record.hasPrescription && (
                          <button
                            onClick={() => togglePrescription(record.consultationId)}
                            className="flex items-center gap-2 text-sm font-bold text-[#1DB896] hover:text-[#0A604E] transition-colors"
                          >
                            <FileText size={16} />
                            <span>
                              {isPrescriptionExpanded 
                                ? "Ẩn đơn thuốc" 
                                : `Xem đơn thuốc${prescriptionData ? ` (${prescriptionData.items?.length || 0} mục)` : ""}`}
                            </span>
                            {isPrescriptionExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                        
                        {record.hasLabResult && (
                          <button
                            onClick={() => toggleLab(record.consultationId)}
                            className="flex items-center gap-2 text-sm font-bold text-[#1DB896] hover:text-[#0A604E] transition-colors"
                          >
                            <Activity size={16} />
                            <span>{isLabExpanded ? "Ẩn kết quả xét nghiệm" : "Kết quả xét nghiệm"}</span>
                            {isLabExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Doctor Notes checklist & Detail Button */}
                  <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-between h-full min-h-[140px]">
                    {!isReceptionistOnly ? (
                      <div>
                        {notes.length > 0 ? (
                          <>
                            <span className="block text-[11px] font-extrabold text-[#4A5D59]/80 uppercase tracking-widest mb-3">
                              Ghi chú từ bác sĩ
                            </span>
                            <ul className="flex flex-col gap-2">
                              {notes.map((note, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 leading-normal">
                                  <CheckCircle2 size={15} className="text-[#1DB896] shrink-0 mt-0.5" />
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <div className="text-slate-400 italic text-xs font-medium py-2">
                            Không có ghi chú thêm từ bác sĩ.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-xs font-medium py-2">
                        Thông tin được bảo mật
                      </div>
                    )}

                    {!isReceptionistOnly && (
                      <div className="mt-6 lg:mt-auto">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold text-sm transition-all duration-300 shadow-sm shadow-[#0A604E]/15 hover:shadow-md flex items-center justify-center gap-2"
                        >
                          Chi tiết lần khám
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Expanded prescription block inline */}
                {isPrescriptionExpanded && (
                  <div className="mt-6 pt-5 border-t border-slate-150 bg-[#F0F9F7]/40 rounded-2xl p-4 md:p-6 transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-extrabold text-sm text-[#0A604E] flex items-center gap-1.5">
                        Đơn thuốc chi tiết
                      </span>
                      {prescriptionIdMap[record.consultationId] && (
                        <button
                          onClick={() => navigate(`/dashboard/prescriptions/${prescriptionIdMap[record.consultationId]}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-white text-teal-700 hover:bg-teal-50 font-bold text-xs transition-colors shadow-sm"
                        >
                          <ExternalLink size={12} /> Xem đơn thuốc đầy đủ
                        </button>
                      )}
                    </div>
                    <PrescriptionDetailView consultationId={record.consultationId} />
                  </div>
                )}

                {/* Expanded lab result block inline */}
                {isLabExpanded && (
                  <div className="mt-6 pt-5 border-t border-slate-150 bg-[#F0F9F7]/40 rounded-2xl p-4 md:p-6 transition-all duration-300">
                    <LabResultView consultationId={record.consultationId} />
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {records.length > visibleCount && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="px-6 py-2.5 rounded-full border border-teal-250 bg-white text-teal-700 font-bold hover:bg-[#F0F9F7] transition-all text-sm shadow-sm"
            >
              Tải các bản ghi cũ hơn
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderDetail = () => (
    <div className="mt-4 flex flex-col gap-6 w-full">
      <div>
        <button 
          onClick={() => setSelectedRecord(null)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold shadow-sm transition-all hover:bg-slate-50 hover:shadow"
        >
          <ArrowLeft size={16} /> Quay lại danh sách lịch sử
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Card: Thông tin khám */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <h4 className="text-lg font-bold text-[#0A604E] mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Stethoscope size={18} className="text-[#1DB896]" /> Thông tin Khám Lâm sàng
          </h4>
          <div className="flex flex-col gap-4">
            <DetailRow label="Ngày khám" value={formatDate(selectedRecord.createdAt)} icon={<Calendar size={15} />} />
            <DetailRow label="Bác sĩ điều trị" value={selectedRecord.doctorName || "BS. Chưa ghi nhận"} icon={<User size={15} />} />
            <DetailRow label="Chuyên khoa" value={selectedRecord.departmentName || "—"} />
            
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 block mb-1">Triệu chứng của bệnh nhân:</span>
              <p className="p-3.5 bg-slate-50 rounded-xl text-slate-700 text-sm font-semibold whitespace-pre-wrap border border-slate-100">
                {selectedRecord.symptoms || "—"}
              </p>
            </div>
            
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 block mb-1">Kết quả khám lâm sàng:</span>
              <p className="p-3.5 bg-slate-50 rounded-xl text-slate-700 text-sm font-semibold whitespace-pre-wrap border border-slate-100">
                {selectedRecord.clinicalFindings || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Card: Chẩn đoán & Điều trị */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <h4 className="text-lg font-bold text-[#0A604E] mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList size={18} className="text-[#1DB896]" /> Chẩn đoán & Điều trị
          </h4>
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">Chẩn đoán chính:</span>
              <p className="p-4 bg-[#F0F9F7]/70 rounded-xl font-extrabold text-[#0A604E] text-lg border border-[#D1F2EB]">
                {selectedRecord.diagnosis || "—"}
              </p>
            </div>
            
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 block mb-1">Hướng điều trị / Phác đồ:</span>
              <p className="p-3.5 bg-slate-50 rounded-xl text-slate-700 text-sm font-semibold whitespace-pre-wrap border border-slate-100">
                {selectedRecord.treatmentPlan || "—"}
              </p>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 block mb-1">Lời dặn của bác sĩ:</span>
              <p className="p-3.5 bg-slate-50 rounded-xl text-slate-750 text-sm font-semibold whitespace-pre-wrap border border-slate-100">
                {selectedRecord.doctorNote || "—"}
              </p>
            </div>

            {(selectedRecord.followUpDate || selectedRecord.followUpNote) && (
              <div className="mt-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-150 text-[#0A604E]">
                <strong className="text-sm font-bold block mb-1">Lịch tái khám:</strong>
                {selectedRecord.followUpDate && (
                  <p className="text-xs font-bold text-emerald-800">
                    Ngày: {new Date(selectedRecord.followUpDate).toLocaleDateString("vi-VN")}
                  </p>
                )}
                {selectedRecord.followUpNote && (
                  <p className="text-xs font-semibold text-emerald-700 mt-1">
                    Ghi chú tái khám: {selectedRecord.followUpNote}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Đơn thuốc và kết quả xét nghiệm liên kết */}
      <div className="flex flex-col gap-6 w-full mt-4">
        {selectedRecord.hasLabResult && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <LabResultView consultationId={selectedRecord.consultationId} />
          </div>
        )}
        
        {selectedRecord.hasPrescription && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <span className="font-extrabold text-lg text-[#0A604E] flex items-center gap-1.5">
                Đơn thuốc kê đơn
              </span>
              {prescriptionIdMap[selectedRecord.consultationId] && (
                <button
                  onClick={() => navigate(`/dashboard/prescriptions/${prescriptionIdMap[selectedRecord.consultationId]}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-sm transition-colors shadow-sm"
                >
                  <ExternalLink size={16} /> Xem đơn thuốc đầy đủ
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
    <div className="w-full">
      {!inline && (
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-xl font-extrabold text-[#0A604E] flex items-center gap-2">
            <ClipboardList size={22} className="text-[#1DB896]" />
            Lịch sử bệnh án bệnh nhân
          </h2>
          <button className="p-2 text-slate-400 hover:text-slate-655 transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-650 px-5 py-3 rounded-2xl text-sm font-semibold mb-4">
          {error}
        </div>
      )}
      
      {selectedRecord ? renderDetail() : renderList()}
    </div>
  );

  if (inline) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-[#0d4c46]/25 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl border border-white/50 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.12)] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </span>
      <span className="text-sm font-bold text-slate-800">{value || "—"}</span>
    </div>
  );
}
