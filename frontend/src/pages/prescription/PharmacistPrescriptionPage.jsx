import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, RefreshCw, CheckCircle, Eye, AlertTriangle, ShieldCheck, ArrowLeft } from "lucide-react";
import { getPrescriptions, dispensePrescription } from "../../services/prescriptionService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

const STATUS_MAP = {
  CREATED: { label: "Chờ cấp phát", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  CHECKED: { label: "Đã kiểm tra", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  DISPENSED: { label: "Đã cấp phát", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  CANCELLED: { label: "Đã hủy", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" };

  return (
    <span className={`${s.bg} ${s.color} ${s.border} border px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-sm`}>
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
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10 px-4 sm:px-6">
      {/* Header */}
      <PageHeader
        title="Quản lý cấp phát thuốc"
        icon={Pill}
        iconColor="text-teal-500"
        subtitle="Kiểm tra và cấp phát thuốc theo đơn của bác sĩ."
        onBack={() => navigate("/dashboard")}
      />

      {error && <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">{error}</div>}

      {/* Main Content Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 w-full">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <label className="text-slate-500 font-extrabold uppercase tracking-wider text-[11px] whitespace-nowrap">Trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="CREATED">Chờ cấp phát</option>
              <option value="CHECKED">Đã kiểm tra</option>
              <option value="DISPENSED">Đã cấp phát</option>
            </select>
          </div>
          <button
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl px-4 py-2.5 transition-all flex items-center gap-2 shadow-sm text-sm"
            onClick={fetchData}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/75 border-b border-slate-100">
              <tr>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] pl-6 w-48">Mã đơn thuốc</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] w-36">Trạng thái</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] w-24 text-center">Số thuốc</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] w-48">Tương tác thuốc</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] w-44">Ngày tạo</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] text-center pr-6 w-48">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 font-medium">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Đang tải...</td></tr>
              ) : prescriptions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Không có đơn thuốc nào.</td></tr>
              ) : (
                prescriptions.map((rx) => {
                  const isDispensing = dispensingId === rx.prescriptionId;
                  return (
                    <tr key={rx.prescriptionId} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors duration-200">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-[#1DB896]">{rx.prescriptionCode}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Ca khám #{rx.consultationId}</div>
                      </td>
                      <td className="p-4"><StatusBadge status={rx.status} /></td>
                      <td className="p-4 text-center font-semibold text-slate-700">{rx.items?.length || 0}</td>
                      <td className="p-4">
                        {rx.drugInteractionChecked ? (
                          rx.interactionWarning && !rx.interactionWarning.includes("No dangerous") ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-600 text-[11px] font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 shadow-sm">
                              <AlertTriangle size={12} /> Có cảnh báo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm">
                              <ShieldCheck size={12} /> An toàn
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 font-semibold text-xs italic">Chưa kiểm tra</span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-500">
                        {new Date(rx.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex gap-2 justify-center">
                          {/* Xem chi tiết */}
                          <button
                            onClick={() => navigate(`/dashboard/prescriptions/${rx.prescriptionId}`)}
                            title="Xem chi tiết"
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl px-3 py-1.5 transition-all flex items-center gap-1.5 text-xs shadow-sm cursor-pointer"
                          >
                            <Eye size={14} /> Xem
                          </button>

                          {/* Cấp phát */}
                          {(rx.status === "CREATED" || rx.status === "CHECKED") && (
                            <button
                              onClick={() => handleDispense(rx.prescriptionId, rx.prescriptionCode)}
                              disabled={isDispensing}
                              title="Cấp phát thuốc"
                              className={`bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold rounded-xl px-3 py-1.5 transition-all shadow-md shadow-teal-500/10 text-xs flex items-center gap-1.5 cursor-pointer ${isDispensing ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <CheckCircle size={14} />
                              {isDispensing ? "Đang xử lý..." : "Cấp phát"}
                            </button>
                          )}

                          {rx.status === "DISPENSED" && (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold flex items-center gap-1">
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
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold transition-all disabled:opacity-30 disabled:pointer-events-none text-xs shadow-sm cursor-pointer"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Trước
            </button>
            <span className="text-slate-500 text-xs font-semibold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              Trang <span className="text-slate-800 font-bold">{page + 1}</span> / {totalPages}
            </span>
            <button
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold transition-all disabled:opacity-30 disabled:pointer-events-none text-xs shadow-sm cursor-pointer"
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
