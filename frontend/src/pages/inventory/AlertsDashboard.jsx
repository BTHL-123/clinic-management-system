import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getActiveAlerts, resolveAlert } from "../../services/inventoryService";
import { useToast } from "../../context/useToast.js";

export default function AlertsDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      toast.success("Đã đánh dấu cảnh báo là đã xử lý.");
      await fetchAlerts();
    } catch (err) {
      toast.error(err, "Không thể đánh dấu xử lý");
    }
  };

  return (
    <>
    <div className="w-full flex flex-col items-center">
      <div className="relative flex flex-col items-center w-full mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 active:scale-95 text-white p-2 rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <h1 className="flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
          <span className="text-white"><AlertTriangle size={26} /></span>
          <span className="text-white text-2xl font-bold tracking-wide">Cảnh Báo Tồn Kho</span>
        </h1>
        <p className="text-white/70 font-medium mt-3 text-center drop-shadow-sm">Danh sách thuốc sắp hết hạn hoặc hết số lượng.</p>
      </div>

      <div className="patient-glass-panel patient-glass-panel-clear rounded-[3rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] border-0 w-full">
      {error && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl mb-6">{error}</div>}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-900/10 text-slate-900 text-sm">
              <th className="p-4 font-bold pb-3">Loại Cảnh Báo</th>
              <th className="p-4 font-bold pb-3">Thuốc</th>
              <th className="p-4 font-bold pb-3">Lô thuốc</th>
              <th className="p-4 font-bold pb-3 w-1/3">Nội dung cảnh báo</th>
              <th className="p-4 font-bold pb-3">Ngày tạo</th>
              <th className="p-4 font-bold pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-slate-900">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-800 font-bold">Đang tải dữ liệu...</td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-700 mb-2">
                      <CheckCircle size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900">Mọi thứ đều ổn!</p>
                    <p className="text-slate-600 font-bold text-sm">Không có cảnh báo nào ở thời điểm hiện tại.</p>
                  </div>
                </td>
              </tr>
            ) : (
              alerts.map((al) => (
                <tr key={al.alertId} className="border-b border-slate-900/10 hover:bg-slate-900/5 transition-colors group">
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      al.alertType === "EXPIRED" ? "bg-rose-500/20 text-rose-700 border-rose-500/30"
                      : al.alertType === "NEAR_EXPIRY" ? "bg-amber-500/20 text-amber-700 border-amber-500/30"
                      : "bg-indigo-500/20 text-indigo-700 border-indigo-500/30"
                    }`}>
                      {al.alertType === "EXPIRED" ? "Đã Hết Hạn" 
                      : al.alertType === "NEAR_EXPIRY" ? "Sắp Hết Hạn"
                      : al.alertType === "LOW_STOCK" ? "Sắp Hết Hàng"
                      : al.alertType}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{al.medicineName}</td>
                  <td className="p-4 font-bold">{al.batchNumber || "—"}</td>
                  <td className="p-4 font-bold">{al.message}</td>
                  <td className="p-4 font-bold text-slate-800">{new Date(al.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="p-4 text-center">
                    <button 
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors inline-flex items-center gap-2 font-medium text-sm" 
                      onClick={() => handleResolve(al.alertId)}
                    >
                      <CheckCircle size={16} />
                      Đã xử lý
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
    </>
  );
}
