import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, RefreshCw, CheckCircle, Eye, AlertTriangle, ShieldCheck, ArrowLeft } from "lucide-react";
import { getPrescriptions, dispensePrescription } from "../../services/prescriptionService";
import { useToast } from "../../context/useToast.js";

const STATUS_MAP = {
  CREATED: { label: "Chờ cấp phát", color: "#d97706", bg: "#fef3c7" },
  CHECKED: { label: "Đã kiểm tra", color: "#2563eb", bg: "#dbeafe" },
  DISPENSED: { label: "Đã cấp phát", color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status };

  let badgeClass = "bg-white/10 text-white/50 border-white/20"; // default
  if (status === "CREATED") badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";
  if (status === "CHECKED") badgeClass = "bg-sky-500/20 text-sky-300 border-sky-500/30";
  if (status === "DISPENSED") badgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (status === "CANCELLED") badgeClass = "bg-rose-500/20 text-rose-300 border-rose-500/30";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${badgeClass}`}>
      {s.label}
    </span>
  );
}

export default function PharmacistPrescriptionPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("CREATED");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dispensingId, setDispensingId] = useState(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPrescriptions({
        status: filterStatus || undefined,
        page,
        size: 10,
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

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full relative flex flex-col items-center mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><Pill size={28} /></span>
            Quản lý cấp phát thuốc
          </h1>
          <p className="text-white/70 font-medium mt-3 text-center drop-shadow-sm">Kiểm tra và cấp phát thuốc theo đơn của bác sĩ.</p>
        </div>
      </div>

      {error && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl mb-6 w-full">{error}</div>}

      {/* Main Content Box */}
      <div className="patient-glass-panel patient-glass-panel-clear rounded-[3rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] border-0 w-full">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900/10 border border-slate-900/10 text-slate-900 font-bold text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors [&>option]:bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="CREATED">Chờ cấp phát</option>
            <option value="CHECKED">Đã kiểm tra</option>
            <option value="DISPENSED">Đã cấp phát</option>
          </select>
          <button
            className="px-4 py-2.5 rounded-xl border border-slate-900/10 bg-slate-900/5 hover:bg-slate-900/10 text-slate-900 transition-colors flex items-center gap-2 font-bold"
            onClick={fetchData}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/10 text-white text-sm">
                <th className="p-4 font-bold pb-3">Mã đơn thuốc</th>
                <th className="p-4 font-bold pb-3 w-[140px]">Trạng thái</th>
                <th className="p-4 font-bold pb-3 w-[100px] text-center">Số thuốc</th>
                <th className="p-4 font-bold pb-3 w-[160px]">Tương tác thuốc</th>
                <th className="p-4 font-bold pb-3 w-[180px]">Ngày tạo</th>
                <th className="p-4 font-bold pb-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-slate-900">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-800 font-bold">Đang tải...</td></tr>
              ) : prescriptions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-900 font-bold">Không có đơn thuốc nào.</td></tr>
              ) : (
                prescriptions.map((rx) => {
                  const isDispensing = dispensingId === rx.prescriptionId;
                  return (
                    <tr key={rx.prescriptionId} className="border-b border-slate-900/5 hover:bg-slate-900/5 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-violet-700">{rx.prescriptionCode}</div>
                        <div className="text-xs text-slate-600 mt-1 font-bold">Ca khám #{rx.consultationId}</div>
                      </td>
                      <td className="p-4"><StatusBadge status={rx.status} /></td>
                      <td className="p-4 text-center font-medium">{rx.items?.length || 0}</td>
                      <td className="p-4">
                        {rx.drugInteractionChecked ? (
                          rx.interactionWarning && !rx.interactionWarning.includes("No dangerous") ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-bold bg-amber-500/20 px-2 py-1 rounded-md border border-amber-500/30">
                              <AlertTriangle size={14} /> Có cảnh báo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/30">
                              <ShieldCheck size={14} /> An toàn
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 font-bold text-xs italic">Chưa kiểm tra</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-800 font-bold text-sm">
                        {new Date(rx.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          {/* Xem chi tiết */}
                          <button
                            onClick={() => navigate(`/dashboard/prescriptions/${rx.prescriptionId}`)}
                            title="Xem chi tiết"
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-2 text-xs font-semibold"
                          >
                            <Eye size={14} /> Xem
                          </button>

                          {/* Cấp phát */}
                          {(rx.status === "CREATED" || rx.status === "CHECKED") && (
                            <button
                              onClick={() => handleDispense(rx.prescriptionId, rx.prescriptionCode)}
                              disabled={isDispensing}
                              title="Cấp phát thuốc"
                              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold ${isDispensing ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-wait" : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"}`}
                            >
                              <CheckCircle size={14} />
                              {isDispensing ? "Đang xử lý..." : "Cấp phát"}
                            </button>
                          )}

                          {rx.status === "DISPENSED" && (
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                              ✓ Đã cấp
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors disabled:opacity-30 text-sm font-medium"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Trước
            </button>
            <span className="text-white/60 text-sm font-medium bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              Trang <span className="text-white font-bold">{page + 1}</span> / {totalPages}
            </span>
            <button
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors disabled:opacity-30 text-sm font-medium"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Tiếp →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
