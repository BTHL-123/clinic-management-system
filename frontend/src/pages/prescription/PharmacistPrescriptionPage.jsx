import { useEffect, useState, useCallback, useMemo } from "react";
import { Pill, RefreshCw, CheckCircle, Eye, AlertTriangle, ShieldCheck, Search, X, Info, Clock, AlertCircle } from "lucide-react";
import { getPrescriptions, dispensePrescription } from "../../services/prescriptionService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

const STATUS_MAP = {
  CREATED: { label: "Chờ cấp phát", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  CHECKED: { label: "Đã kiểm tra", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  DISPENSED: { label: "Đã cấp phát", color: "text-emerald-755", bg: "bg-emerald-50", border: "border-emerald-250" },
  CANCELLED: { label: "Đã hủy", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-150" },
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const normalized = dateStr.includes(" ") && !dateStr.includes("T") 
      ? dateStr.replace(" ", "T") 
      : dateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr || "—";
  }
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "text-slate-650", bg: "bg-slate-50", border: "border-slate-200" };
  
  const dotMap = {
    CREATED: "bg-amber-500",
    CHECKED: "bg-blue-500",
    DISPENSED: "bg-emerald-500",
    CANCELLED: "bg-rose-500",
  };
  const dotClass = dotMap[status] || "bg-slate-400";

  return (
    <span className={`${s.bg} ${s.color} ${s.border} border px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
      {s.label}
    </span>
  );
}

export default function PharmacistPrescriptionPage() {
  const toast = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("CREATED");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dispensingId, setDispensingId] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRxId, setSelectedRxId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPrescriptions({
        status: filterStatus || undefined,
        page,
        size: 15,
      });
      setPrescriptions(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách đơn thuốc.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => {
    setPage(0);
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDispense = async (prescriptionId, prescriptionCode) => {
    if (!window.confirm(`Xác nhận cấp phát đơn thuốc ${prescriptionCode}?\nThao tác này sẽ xuất kho tự động.`)) return;
    setDispensingId(prescriptionId);
    try {
      await dispensePrescription(prescriptionId);
      toast.success(`Đã cấp phát đơn thuốc ${prescriptionCode} thành công.`);
      fetchData();
    } catch (err) {
      toast.error(err, "Không thể cấp phát đơn thuốc");
    } finally {
      setDispensingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return prescriptions;
    const term = searchTerm.toLowerCase().trim();
    return prescriptions.filter(
      (rx) =>
        (rx.prescriptionCode?.toLowerCase() || "").includes(term) ||
        `ca-${rx.consultationId}`.includes(term)
    );
  }, [prescriptions, searchTerm]);

  // Set default selection
  useEffect(() => {
    if (filtered && filtered.length > 0) {
      const exists = filtered.some(r => r.prescriptionId === selectedRxId);
      if (!exists) {
        setSelectedRxId(filtered[0].prescriptionId);
      }
    } else {
      setSelectedRxId(null);
    }
  }, [filtered, selectedRxId]);

  const selectedRx = useMemo(() => {
    return prescriptions.find(r => r.prescriptionId === selectedRxId) || null;
  }, [prescriptions, selectedRxId]);

  const hasDoseSchedule = useMemo(() => {
    if (!selectedRx) return false;
    return selectedRx.items?.some(
      (i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose
    );
  }, [selectedRx]);

  const tabs = [
    { key: "CREATED", label: "Chờ cấp phát" },
    { key: "CHECKED", label: "Đã kiểm tra" },
    { key: "DISPENSED", label: "Đã cấp phát" },
    { key: "", label: "Tất cả đơn thuốc" },
  ];

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-1 relative text-slate-800 pb-8">
      
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shadow-sm">
              <Pill size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cấp Phát Thuốc</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">
            Kiểm tra thông tin đơn thuốc bác sĩ kê, đối chiếu cảnh báo tương tác thuốc và xuất kho cấp phát.
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
            placeholder="Tìm theo mã đơn thuốc, mã ca khám..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 font-bold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-slate-400 hover:text-slate-655 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-bold hover:bg-slate-50 transition-all text-xs shadow-sm cursor-pointer whitespace-nowrap"
          onClick={fetchData}
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#1DB896]" : "text-slate-500"} />
          Làm mới dữ liệu
        </button>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Main Content Split Columns */}
      <div className="w-full flex-1 min-h-0">
        {loading && prescriptions.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Pill size={48} className="text-slate-300 mx-auto opacity-40 mb-3" />
            <div className="text-sm text-[#4A5D59] font-bold">Không tìm thấy đơn thuốc nào phù hợp.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: List & Pagination (5/12 width) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex flex-col gap-4 max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar pr-1">
                {filtered.map((rx) => {
                  const isSelected = rx.prescriptionId === selectedRxId;
                  
                  return (
                    <button
                      key={rx.prescriptionId}
                      onClick={() => setSelectedRxId(rx.prescriptionId)}
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
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <Clock size={13} className="text-slate-400" />
                          <span>
                            {formatDateTime(rx.createdAt)}
                          </span>
                        </div>
                        <StatusBadge status={rx.status} />
                      </div>

                      <div className="h-px bg-slate-100 w-full"></div>

                      {/* Code and Case */}
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-teal-700 bg-teal-50/80 border border-teal-200/50 px-2 py-0.5 rounded text-[11px] font-bold self-start mb-1.5 inline-block">
                          {rx.prescriptionCode}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold leading-none">
                          Mã ca khám: <strong className="text-slate-700 font-bold">#Ca-{rx.consultationId}</strong>
                        </span>
                      </div>

                      <div className="h-px bg-slate-50 w-full"></div>

                      {/* Drug interaction warning and drug count */}
                      <div className="flex justify-between items-center text-[10px] text-[#4A5D59] font-bold">
                        <span>{rx.items?.length || 0} loại thuốc</span>
                        <div>
                          {rx.drugInteractionChecked ? (
                            rx.interactionWarning && !rx.interactionWarning.includes("No dangerous") ? (
                              <span className="text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1">
                                <AlertTriangle size={10} /> Có cảnh báo
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1">
                                <ShieldCheck size={10} /> An toàn
                              </span>
                            )
                          ) : (
                            <span className="text-slate-440 font-semibold italic">Chưa kiểm tra</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl shadow-sm">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-default transition-all border border-slate-200 cursor-pointer"
                  >
                    Trước
                  </button>
                  <span className="text-[11px] font-bold text-[#4A5D59] px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-default transition-all border border-slate-200 cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Detail Panel (7/12 width) */}
            <div className="lg:col-span-7 sticky top-6">
              {selectedRx ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar animate-[fadeIn_0.25s_ease]">
                  
                  {/* Title Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết đơn thuốc kê</span>
                        <span className="text-[10px] bg-slate-100 text-slate-550 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200/60">
                          #{selectedRx.prescriptionCode}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                        <Pill size={18} className="text-[#1DB896] shrink-0" />
                        <span>Đơn thuốc và kế hoạch điều trị</span>
                      </h2>
                    </div>
                    <StatusBadge status={selectedRx.status} />
                  </div>

                  {/* General Info Card */}
                  <div className="flex flex-col gap-3 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Ca khám</span>
                        <strong className="text-slate-800 font-bold text-xs block">#Ca-{selectedRx.consultationId}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Ngày tạo đơn</span>
                        <strong className="text-slate-800 font-bold text-xs block">
                          {formatDateTime(selectedRx.createdAt)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Tương tác thuốc</span>
                        <strong className="text-slate-800 font-bold text-xs block">
                          {selectedRx.drugInteractionChecked ? (
                            <span className="text-emerald-700 font-black">Đã kiểm tra</span>
                          ) : (
                            <span className="text-slate-455 italic font-medium">Chưa kiểm tra</span>
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Interaction Warning Panel */}
                  {selectedRx.interactionWarning && (
                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed font-semibold flex flex-col gap-2 ${
                      selectedRx.interactionWarning.includes("No dangerous")
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-amber-50 border-amber-150 text-amber-800"
                    }`}>
                      <div className="flex items-center gap-2">
                        {selectedRx.interactionWarning.includes("No dangerous") ? (
                          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                        )}
                        <strong className="font-black uppercase tracking-wider text-[10px]">
                          {selectedRx.interactionWarning.includes("No dangerous")
                            ? "Không phát hiện tương tác thuốc nguy hiểm"
                            : "Cảnh báo tương tác thuốc phát hiện"}
                        </strong>
                      </div>
                      <p className="text-slate-600 whitespace-pre-wrap pl-6 leading-relaxed">
                        {selectedRx.interactionWarning}
                      </p>
                    </div>
                  )}

                  {/* List of drugs */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                      <Pill size={14} className="text-[#1DB896]" /> Danh sách các loại thuốc chỉ định
                    </h3>
                    
                    <div className="flex flex-col gap-3">
                      {selectedRx.items?.map((item) => (
                        <div key={item.prescriptionItemId} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-800 text-sm block">{item.medicineName}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold block mt-0.5">Mã: {item.medicineCode}</span>
                            </div>
                            <span className="font-black text-slate-800 text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                              Số lượng: {item.quantity} {item.unit || ""}
                            </span>
                          </div>
                          
                          <div className="h-px bg-slate-50 w-full my-1"></div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-500">
                            <div>
                              <span className="text-slate-400 block">Dạng bào chế</span>
                              <strong className="text-slate-700 font-bold">{item.dosageForm || "—"}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Hàm lượng</span>
                              <strong className="text-slate-700 font-bold">{item.strength || "—"}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Liều dùng</span>
                              <strong className="text-slate-700 font-bold">{item.dosage || "—"}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Tần suất</span>
                              <strong className="text-slate-700 font-bold">{item.frequency || "—"}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dosage Schedule */}
                  {hasDoseSchedule && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">
                        Chi tiết lịch uống thuốc
                      </h3>
                      <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="p-3 pl-4">Tên thuốc</th>
                              <th className="p-3 text-center">Sáng</th>
                              <th className="p-3 text-center">Trưa</th>
                              <th className="p-3 text-center">Chiều</th>
                              <th className="p-3 pr-4 text-center">Tối</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-650 font-bold">
                            {selectedRx.items
                              ?.filter((i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose)
                              .map((item) => (
                                <tr key={item.prescriptionItemId} className="border-b border-slate-100 hover:bg-slate-50/50">
                                  <td className="p-3 pl-4 text-slate-800">{item.medicineName}</td>
                                  <td className="p-3 text-center text-slate-755 font-black">{item.morningDose || "—"}</td>
                                  <td className="p-3 text-center text-slate-755 font-black">{item.noonDose || "—"}</td>
                                  <td className="p-3 text-center text-slate-755 font-black">{item.eveningDose || "—"}</td>
                                  <td className="p-3 pr-4 text-center text-slate-755 font-black">{item.nightDose || "—"}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Doctor note */}
                  {selectedRx.doctorNote && (
                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl text-xs">
                      <strong className="text-slate-400 font-black uppercase tracking-wider text-[10px] block mb-1">Lời dặn của bác sĩ</strong>
                      <p className="text-slate-700 font-semibold leading-relaxed leading-normal">{selectedRx.doctorNote}</p>
                    </div>
                  )}

                  {/* Action Dispense Button */}
                  {(selectedRx.status === "CREATED" || selectedRx.status === "CHECKED") && (
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleDispense(selectedRx.prescriptionId, selectedRx.prescriptionCode)}
                        disabled={dispensingId === selectedRx.prescriptionId}
                        className={`bg-gradient-to-r from-[#1DB896] to-emerald-400 hover:from-[#159a7c] hover:to-emerald-500 text-white font-extrabold rounded-2xl px-6 py-3 transition-all duration-300 shadow-md shadow-teal-500/10 text-xs flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${dispensingId === selectedRx.prescriptionId ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
                      >
                        <CheckCircle size={15} />
                        {dispensingId === selectedRx.prescriptionId ? "Đang xử lý..." : "Xác nhận cấp phát và xuất kho"}
                      </button>
                    </div>
                  )}

                  {selectedRx.status === "DISPENSED" && (
                    <div className="flex justify-end pt-4 border-t border-slate-100 text-xs text-emerald-700 font-black flex items-center gap-1.5">
                      <CheckCircle size={16} /> Đã cấp phát thuốc thành công
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold flex flex-col items-center gap-3">
                  <Info size={40} className="text-slate-300" />
                  Chọn một đơn thuốc ở danh sách bên trái để xem đầy đủ chi tiết và thực hiện kiểm tra cấp phát.
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
