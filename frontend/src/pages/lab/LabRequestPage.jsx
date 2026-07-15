import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  FlaskConical, RefreshCw, CheckCircle, ClipboardEdit, X, FileText, 
  Search, Filter, Calendar, Clock, User, ClipboardList, Info, AlertCircle 
} from "lucide-react";
import { getAllLabRequests, acceptLabRequest } from "../../services/labRequestService";
import { createLabResult } from "../../services/labResultService";
import { getPatients } from "../../services/patientService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

const STATUS_MAP = {
  REQUESTED: { label: "Chờ tiếp nhận", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  IN_PROGRESS: { label: "Đang xử lý", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  COMPLETED: { label: "Hoàn thành", color: "text-emerald-750", bg: "bg-emerald-50", border: "border-emerald-200" },
  CANCELLED: { label: "Đã hủy", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-150" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "text-slate-650", bg: "bg-slate-50", border: "border-slate-200" };
  
  const dotMap = {
    REQUESTED: "bg-amber-500",
    IN_PROGRESS: "bg-blue-500",
    COMPLETED: "bg-emerald-500",
    CANCELLED: "bg-rose-500",
  };
  const dotClass = dotMap[status] || "bg-slate-400";

  return (
    <span className={`${s.bg} ${s.color} ${s.border} border px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm uppercase tracking-wider`}>
      <span className={`w-1 h-1 rounded-full ${dotClass}`}></span>
      {s.label}
    </span>
  );
}

const EMPTY_RESULT = {
  resultValue: "",
  normalRange: "",
  resultUnit: "",
  conclusion: "",
  resultFileUrl: "",
};

export default function LabRequestPage() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("REQUESTED");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [patientsMap, setPatientsMap] = useState({});
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Modal nhập kết quả
  const [resultModal, setResultModal] = useState(null); // { req, item }
  const [resultForm, setResultForm] = useState(EMPTY_RESULT);
  const [savingResult, setSavingResult] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await getPatients({ size: 1000 });
      const map = {};
      res.data?.content?.forEach((p) => {
        map[p.patientId] = p;
      });
      setPatientsMap(map);
    } catch (err) {
      console.error("Failed to load patients for mapping", err);
    }
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllLabRequests({ status: filterStatus || undefined, size: 100 });
      setRequests(res.data?.content || []);
      setError("");
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phiếu xét nghiệm.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => { 
    fetchRequests(); 
  }, [fetchRequests]);

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      const res = await acceptLabRequest(id);
      setRequests((prev) => prev.map((r) => r.labRequestId === id ? res.data : r));
      toast.success("Đã tiếp nhận phiếu xét nghiệm.");
    } catch (err) {
      toast.error(err, "Không thể tiếp nhận phiếu");
    } finally {
      setActionLoading(null);
    }
  };

  const openResultModal = (req, item) => {
    setResultModal({ req, item });
    setResultForm(EMPTY_RESULT);
  };

  const handleSaveResult = async () => {
    if (!resultForm.resultValue.trim() && !resultForm.conclusion.trim() && !resultForm.resultFileUrl.trim()) {
      toast.error("Vui lòng nhập Giá trị kết quả, Kết luận, hoặc đính kèm file.", "Thiếu thông tin");
      return;
    }
    setSavingResult(true);
    try {
      await createLabResult({
        labRequestItemId: resultModal.item.labRequestItemId,
        resultValue: resultForm.resultValue,
        normalRange: resultForm.normalRange || null,
        resultUnit: resultForm.resultUnit || null,
        conclusion: resultForm.conclusion || null,
        resultFileUrl: resultForm.resultFileUrl || null,
      });
      toast.success(`Đã nhập kết quả cho "${resultModal.item.testName}".`);
      setResultModal(null);
      await fetchRequests();
    } catch (err) {
      toast.error(err, "Không thể lưu kết quả");
    } finally {
      setSavingResult(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) return requests;
    const term = searchTerm.toLowerCase().trim();
    return requests.filter((req) => {
      const patient = patientsMap[req.patientId];
      const matchRequestCode = req.requestCode?.toLowerCase().includes(term);
      const matchPatientName = patient?.fullName?.toLowerCase().includes(term);
      const matchPatientCode = patient?.patientCode?.toLowerCase().includes(term);
      return matchRequestCode || matchPatientName || matchPatientCode;
    });
  }, [requests, searchTerm, patientsMap]);

  // Set default selection when data changes
  useEffect(() => {
    if (filteredRequests && filteredRequests.length > 0) {
      const exists = filteredRequests.some(r => r.labRequestId === selectedRequestId);
      if (!exists) {
        setSelectedRequestId(filteredRequests[0].labRequestId);
      }
    } else {
      setSelectedRequestId(null);
    }
  }, [filteredRequests, selectedRequestId]);

  const selectedRequest = useMemo(() => {
    return requests.find(r => r.labRequestId === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  const selectedPatient = useMemo(() => {
    if (!selectedRequest) return null;
    return patientsMap[selectedRequest.patientId] || null;
  }, [selectedRequest, patientsMap]);

  const tabs = [
    { key: "REQUESTED", label: "Chờ tiếp nhận" },
    { key: "IN_PROGRESS", label: "Đang xử lý" },
    { key: "COMPLETED", label: "Hoàn thành" },
    { key: "", label: "Tất cả" },
  ];

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-1 relative text-slate-800 pb-8">
      
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shadow-sm">
              <FlaskConical size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Phòng Xét Nghiệm</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">
            Quản lý tiếp nhận phiếu chỉ định và cập nhật kết quả cận lâm sàng của bệnh nhân.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterStatus(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === t.key 
                ? "bg-[#0A604E] text-white shadow-[0_4px_12px_rgba(10,96,78,0.15)]" 
                : "bg-white border border-slate-200 text-[#4A5D59] hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo mã phiếu, tên/mã bệnh nhân..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 font-bold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-bold hover:bg-slate-50 transition-all text-xs shadow-sm cursor-pointer whitespace-nowrap"
          onClick={fetchRequests}
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#1DB896]" : "text-slate-500"} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Main Content Split Columns */}
      <div className="w-full flex-1 min-h-0">
        {loading && requests.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <ClipboardList size={48} className="text-slate-300 mx-auto opacity-40 mb-3" />
            <div className="text-sm text-[#4A5D59] font-bold">Không có phiếu xét nghiệm nào phù hợp.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Vouchers List (7/12 width) */}
            <div className="lg:col-span-7 flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
              {filteredRequests.map((req) => {
                const isSelected = req.labRequestId === selectedRequestId;
                const patient = patientsMap[req.patientId];
                
                return (
                  <button
                    key={req.labRequestId}
                    onClick={() => setSelectedRequestId(req.labRequestId)}
                    className={`w-full text-left bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                      isSelected 
                        ? "border-[#1DB896] shadow-md ring-1 ring-[#1DB896]/20 bg-teal-50/5" 
                        : "border-slate-200/80 hover:border-slate-350 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1DB896]"></div>
                    )}
                    
                    {/* Top Row: Date & Status */}
                    <div className="flex justify-between items-center gap-2 flex-wrap w-full">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <Clock size={13} className="text-slate-400" />
                        <span>
                          {new Date(req.requestedAt).toLocaleString("vi-VN", {
                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Voucher / Patient Details */}
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-teal-700 bg-teal-50/80 border border-teal-200/50 px-2 py-0.5 rounded text-[11px] font-bold self-start mb-1">
                        {req.requestCode}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shrink-0">
                          <User size={13} className="text-[#1DB896]" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800">{patient?.fullName || `Bệnh nhân #${req.patientId}`}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block leading-none mt-0.5">Mã BN: {patient?.patientCode || `ID_${req.patientId}`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-50 w-full"></div>

                    {/* Tests summary */}
                    <div className="flex justify-between items-center text-[10px] text-[#4A5D59] font-bold">
                      <span>{req.items?.length || 0} chỉ định xét nghiệm</span>
                      <span className="text-slate-450 font-semibold text-right">
                        {req.items?.filter(i => i.labResult).length || 0}/{req.items?.length || 0} đã có KQ
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Sticky Detail Panel (5/12 width) */}
            <div className="lg:col-span-5 sticky top-6">
              {selectedRequest ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 animate-[fadeIn_0.25s_ease]">
                  
                  {/* Title & Status Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết phiếu chỉ định</span>
                        <span className="text-[10px] bg-slate-100 text-slate-550 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200/60">
                          #{selectedRequest.requestCode}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                        <FlaskConical size={18} className="text-[#1DB896] shrink-0" />
                        <span>Phiếu xét nghiệm cận lâm sàng</span>
                      </h2>
                    </div>
                    <StatusBadge status={selectedRequest.status} />
                  </div>

                  {/* Patient Info Card */}
                  <div className="flex flex-col gap-3 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <User size={13} className="text-[#1DB896]" /> Thông tin bệnh nhân
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#4A5D59] font-bold block mb-0.5">Họ và tên</span>
                        <strong className="text-slate-800 font-black text-xs block">{selectedPatient?.fullName || `Bệnh nhân #${selectedRequest.patientId}`}</strong>
                      </div>
                      <div>
                        <span className="text-[#4A5D59] font-bold block mb-0.5">Mã bệnh nhân</span>
                        <strong className="text-slate-800 font-mono text-xs block">{selectedPatient?.patientCode || `ID_${selectedRequest.patientId}`}</strong>
                      </div>
                      <div>
                        <span className="text-[#4A5D59] font-bold block mb-0.5">Số điện thoại</span>
                        <strong className="text-slate-800 font-bold text-xs block">{selectedPatient?.phone || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-[#4A5D59] font-bold block mb-0.5">Giới tính</span>
                        <strong className="text-slate-800 font-bold text-xs block">
                          {selectedPatient?.gender === "MALE" ? "Nam" : selectedPatient?.gender === "FEMALE" ? "Nữ" : "Khác"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#4A5D59] font-bold block mb-0.5">Ngày sinh</span>
                        <strong className="text-slate-800 font-bold text-xs block">
                          {selectedPatient?.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString("vi-VN") : "—"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#4A5D59] font-bold block mb-0.5">Yêu cầu lúc</span>
                        <strong className="text-slate-800 font-bold text-xs block">
                          {new Date(selectedRequest.requestedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} {new Date(selectedRequest.requestedAt).toLocaleDateString("vi-VN")}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* List of Test Items */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-[#1DB896]" /> Danh sách xét nghiệm được chỉ định
                    </h3>
                    
                    <div className="flex flex-col gap-3">
                      {selectedRequest.items?.map((item) => (
                        <div key={item.labRequestItemId} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-3">
                          
                          {/* Item header */}
                          <div className="flex justify-between items-center w-full">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm">{item.testName}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold mt-0.5">Mã: {item.testCode}</span>
                            </div>
                            
                            <div>
                              {item.labResult ? (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                                  <CheckCircle size={11} /> Đã có kết quả
                                </span>
                              ) : selectedRequest.status === "IN_PROGRESS" ? (
                                <button
                                  onClick={() => openResultModal(selectedRequest, item)}
                                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:shadow-md"
                                >
                                  <ClipboardEdit size={13} /> Nhập kết quả
                                </button>
                              ) : (
                                <span className="text-slate-450 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[10px] font-bold inline-flex items-center gap-1.5">
                                  Chờ tiếp nhận
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Result values detail (If result is present) */}
                          {item.labResult && (
                            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 mt-1 grid grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                              <div>
                                <span className="text-slate-400 font-bold block mb-0.5">Giá trị kết quả</span>
                                <strong className="text-slate-800 font-black text-sm">{item.labResult.resultValue}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold block mb-0.5">Đơn vị</span>
                                <strong className="text-slate-700 font-bold text-xs">{item.labResult.resultUnit || "—"}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold block mb-0.5">Khoảng bình thường</span>
                                <strong className="text-slate-700 font-bold text-xs">{item.labResult.normalRange || "—"}</strong>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 font-bold block mb-0.5">Kết luận</span>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-block mt-0.5 ${
                                  item.labResult.conclusion?.toLowerCase().includes("bất thường") || item.labResult.conclusion?.toLowerCase().includes("abnormal")
                                    ? "bg-rose-50 border border-rose-100 text-rose-600" 
                                    : "bg-emerald-50 border border-emerald-100 text-emerald-700"
                                }`}>
                                  {item.labResult.conclusion || "Chưa có kết luận"}
                                </span>
                              </div>
                              {item.labResult.resultFileUrl && (
                                <div>
                                  <span className="text-slate-400 font-bold block mb-1">Tệp kết quả</span>
                                  <a 
                                    href={item.labResult.resultFileUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-teal-650 hover:text-teal-700 font-extrabold flex items-center gap-1 hover:underline"
                                  >
                                    <FileText size={13} /> Xem tệp đính kèm
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  {selectedRequest.status === "REQUESTED" && (
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        disabled={actionLoading === selectedRequest.labRequestId}
                        onClick={() => handleAccept(selectedRequest.labRequestId)}
                        className={`bg-gradient-to-r from-[#1DB896] to-emerald-400 hover:from-[#159a7c] hover:to-emerald-500 text-white font-extrabold rounded-2xl px-6 py-3 transition-all duration-300 shadow-md shadow-teal-500/10 text-xs flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${actionLoading === selectedRequest.labRequestId ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
                      >
                        <CheckCircle size={15} />
                        {actionLoading === selectedRequest.labRequestId ? "Đang tiếp nhận..." : "Tiếp nhận thực hiện xét nghiệm"}
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold flex flex-col items-center gap-3">
                  <Info size={40} className="text-slate-300" />
                  Chọn một phiếu xét nghiệm ở danh sách bên trái để xem đầy đủ chi tiết và thực hiện cập nhật kết quả.
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modal nhập kết quả */}
      {resultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all duration-300" onClick={() => setResultModal(null)}>
          <div className="bg-white p-7 rounded-[2rem] w-full max-w-lg shadow-2xl relative border border-slate-100 animate-[fadeIn_0.2s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F0F9F7] text-[#1DB896] border border-[#1DB896]/20">
                  <ClipboardEdit size={18} />
                </div>
                Nhập kết quả xét nghiệm
              </h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                onClick={() => setResultModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-1">
              <p className="text-sm font-black text-slate-800">Xét nghiệm: {resultModal.item.testName}</p>
              <p className="text-xs font-semibold text-slate-400">Mã: <span className="font-mono bg-slate-200/50 border border-slate-300/40 px-1.5 py-0.5 rounded text-[10px] text-slate-600">{resultModal.item.testCode}</span></p>
            </div>

            <div className="grid gap-4 mb-6">
              {[
                { key: "resultValue", label: "Giá trị kết quả", placeholder: "VD: 5.2" },
                { key: "resultUnit", label: "Đơn vị", placeholder: "VD: mmol/L" },
                { key: "normalRange", label: "Khoảng bình thường", placeholder: "VD: 3.9 - 6.1" },
                { key: "conclusion", label: "Kết luận", placeholder: "Bình thường / Bất thường..." },
                { key: "resultFileUrl", label: "Link file kết quả (nếu có)", placeholder: "https://..." },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#4A5D59] mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={resultForm[f.key]}
                    onChange={(e) => setResultForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                onClick={() => setResultModal(null)}
              >
                Hủy
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-[#0A604E] hover:bg-[#084f40] text-white font-black hover:shadow-md transition-colors disabled:opacity-50 text-xs flex items-center gap-2 cursor-pointer"
                onClick={handleSaveResult}
                disabled={savingResult}
              >
                {savingResult && <RefreshCw size={14} className="animate-spin" />}
                {savingResult ? "Đang lưu..." : "Lưu kết quả"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
