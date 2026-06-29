import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, ArrowLeft, ShieldCheck, Clock, RefreshCw, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getActiveAlerts, resolveAlert } from "../../services/inventoryService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

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

export default function AlertsDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getActiveAlerts();
      setAlerts(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Set default selection
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const exists = alerts.some(a => a.alertId === selectedAlertId);
      if (!exists) {
        setSelectedAlertId(alerts[0].alertId);
      }
    } else {
      setSelectedAlertId(null);
    }
  }, [alerts, selectedAlertId]);

  const selectedAlert = useMemo(() => {
    return alerts.find(a => a.alertId === selectedAlertId) || null;
  }, [alerts, selectedAlertId]);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      toast.success("Đã đánh dấu cảnh báo là đã xử lý.");
      setSelectedAlertId(null);
      await fetchAlerts();
    } catch (err) {
      toast.error(err, "Không thể đánh dấu xử lý");
    }
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-1 relative text-slate-800 pb-8">
      
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shadow-sm">
              <AlertTriangle size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cảnh Báo Tồn Kho</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">
            Danh sách cảnh báo các lô thuốc hết hạn, cận ngày sử dụng hoặc tồn kho xuống thấp dưới mức tối thiểu.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] justify-between items-center">
        <span className="text-xs font-bold text-slate-500 pl-2">
          Hiện tại ghi nhận: <strong className="text-[#1DB896]">{alerts.length}</strong> cảnh báo cần kiểm tra.
        </span>
        <button
          onClick={fetchAlerts}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-bold hover:bg-slate-50 transition-all text-xs shadow-sm cursor-pointer whitespace-nowrap"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: List (5/12 width) */}
          <div className="lg:col-span-5 flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
            {loading && alerts.length === 0 ? (
              <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex items-center justify-center shadow-sm">
                  <ShieldCheck size={26} />
                </div>
                <div className="text-sm font-black text-slate-800">Kho hàng an toàn!</div>
                <div className="text-xs text-[#4A5D59] font-semibold">Hiện tại không ghi nhận cảnh báo tồn kho hay hết hạn nào.</div>
              </div>
            ) : (
              alerts.map((al) => {
                const isSelected = al.alertId === selectedAlertId;
                return (
                  <button
                    key={al.alertId}
                    onClick={() => setSelectedAlertId(al.alertId)}
                    className={`w-full text-left bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                      isSelected 
                        ? "border-[#1DB896] shadow-md ring-1 ring-[#1DB896]/20 bg-teal-50/5" 
                        : "border-slate-200/80 hover:border-slate-350 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1DB896]"></div>
                    )}
                    
                    {/* Top Row: Date & Alert Type */}
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <Clock size={13} className="text-slate-400" />
                        <span>
                          {formatDateTime(al.createdAt)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                        al.alertType === "EXPIRED" ? "bg-rose-50 text-rose-700 border-rose-150"
                        : al.alertType === "NEAR_EXPIRY" ? "bg-orange-50 text-orange-700 border-orange-150"
                        : "bg-indigo-50 text-indigo-700 border-indigo-150"
                      }`}>
                        {al.alertType === "EXPIRED" ? "Hết hạn" 
                        : al.alertType === "NEAR_EXPIRY" ? "Cận hạn"
                        : "Sắp hết"}
                      </span>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Medicine details */}
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-1">
                        {al.medicineName}
                      </h4>
                      {al.batchNumber && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Lô: <span className="font-mono font-bold text-slate-655 bg-slate-50 border border-slate-200 px-1 rounded">{al.batchNumber}</span>
                        </p>
                      )}
                    </div>

                    <div className="h-px bg-slate-50 w-full"></div>

                    {/* Message snippet */}
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                      {al.message}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Sticky Detail Panel (7/12 width) */}
          <div className="lg:col-span-7 sticky top-6">
            {selectedAlert ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 animate-[fadeIn_0.25s_ease]">
                
                {/* Detail Header */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Theo dõi cảnh báo hệ thống</span>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                      <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                      <span>{selectedAlert.medicineName}</span>
                    </h2>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                    selectedAlert.alertType === 'EXPIRED' 
                      ? 'bg-rose-50 text-rose-700 border-rose-100' 
                      : selectedAlert.alertType === 'NEAR_EXPIRY' 
                        ? 'bg-orange-50 text-orange-700 border-orange-100' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  }`}>
                    {selectedAlert.alertType === 'EXPIRED' ? 'Đã hết hạn sử dụng' 
                    : selectedAlert.alertType === 'NEAR_EXPIRY' ? 'Sắp hết hạn sử dụng' 
                    : 'Số lượng tồn kho thấp'}
                  </span>
                </div>

                {/* Details Card */}
                <div className="flex flex-col gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-450 font-bold block mb-0.5">Dược phẩm</span>
                      <strong className="text-slate-850 font-bold text-xs block">{selectedAlert.medicineName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 font-bold block mb-0.5">Lô thuốc liên quan</span>
                      <strong className="text-slate-800 font-mono text-xs block">
                        {selectedAlert.batchNumber ? `Lô: ${selectedAlert.batchNumber}` : "Không có thông tin số lô"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-450 font-bold block mb-0.5">Thời gian ghi nhận</span>
                      <strong className="text-slate-800 font-bold text-xs block">
                        {formatDateTime(selectedAlert.createdAt)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-450 font-bold block mb-0.5">Phân loại cảnh báo</span>
                      <strong className="text-slate-800 font-bold text-xs block">
                        {selectedAlert.alertType === 'EXPIRED' ? 'Đã hết hạn' : selectedAlert.alertType === 'NEAR_EXPIRY' ? 'Cận hạn dùng' : 'Tồn kho thấp'}
                      </strong>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200/60 my-1"></div>

                  <div>
                    <span className="text-slate-450 font-bold block mb-1">Nội dung thông báo</span>
                    <p className="text-slate-700 text-xs font-semibold leading-relaxed bg-white border border-slate-150/50 rounded-xl p-3.5 mt-1 min-h-[60px]">
                      {selectedAlert.message}
                    </p>
                  </div>
                </div>

                {/* Resolve Action Footer */}
                <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => handleResolve(selectedAlert.alertId)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-[#F0F9F7] text-[#1DB896] font-black hover:bg-[#1DB896]/20 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle size={14} /> Xác nhận đã xử lý
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold flex flex-col items-center gap-3">
                <Info size={40} className="text-slate-300" />
                Chọn một cảnh báo ở danh sách bên trái để kiểm tra chi tiết và đánh dấu xử lý.
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
