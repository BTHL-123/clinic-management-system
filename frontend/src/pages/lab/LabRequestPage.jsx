import { useEffect, useState, useCallback } from "react";
import { FlaskConical, RefreshCw, CheckCircle, ClipboardEdit, X, FileText } from "lucide-react";
import { getAllLabRequests, acceptLabRequest } from "../../services/labRequestService";
import { createLabResult } from "../../services/labResultService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

const STATUS_MAP = {
  REQUESTED: { label: "Chờ tiếp nhận", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  IN_PROGRESS: { label: "Đang xử lý", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  COMPLETED: { label: "Hoàn thành", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
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
  const [actionLoading, setActionLoading] = useState(null);

  // Modal nhập kết quả
  const [resultModal, setResultModal] = useState(null); // { req, item }
  const [resultForm, setResultForm] = useState(EMPTY_RESULT);
  const [savingResult, setSavingResult] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllLabRequests({ status: filterStatus || undefined, size: 50 });
      setRequests(res.data?.content || []);
      setError("");
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phiếu xét nghiệm.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

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

  const waitingCount = requests.filter((r) => r.status === "REQUESTED").length;
  const inProgressCount = requests.filter((r) => r.status === "IN_PROGRESS").length;

  return (
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10 px-4 sm:px-6">

      {/* Header */}
      <PageHeader
        title="Phòng Xét Nghiệm"
        icon={FlaskConical}
        iconColor="text-teal-500"
        subtitle="Quản lý, tiếp nhận và cập nhật kết quả xét nghiệm của bệnh nhân."
      />

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-[800px] mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex justify-between items-center group hover:-translate-y-1 hover:shadow-md hover:border-teal-100 transition-all duration-300">
          <div>
            <p className="font-extrabold uppercase tracking-wider text-[11px] text-slate-400 mb-1">Chờ tiếp nhận</p>
            <h3 className="text-3xl font-black text-slate-800">{waitingCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500 border border-amber-100/50 group-hover:scale-105 transition-transform duration-300">
            <FileText size={22} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex justify-between items-center group hover:-translate-y-1 hover:shadow-md hover:border-teal-100 transition-all duration-300">
          <div>
            <p className="font-extrabold uppercase tracking-wider text-[11px] text-slate-400 mb-1">Đang xử lý</p>
            <h3 className="text-3xl font-black text-slate-800">{inProgressCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500 border border-blue-100/50 group-hover:scale-105 transition-transform duration-300">
            <RefreshCw size={22} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 w-full flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <label className="text-slate-500 font-extrabold uppercase tracking-wider text-[11px] whitespace-nowrap">Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all"
          >
            <option value="">Tất cả</option>
            <option value="REQUESTED">Chờ tiếp nhận</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
        </div>
        <button
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl px-4 py-2.5 transition-all flex items-center gap-2 shadow-sm text-sm"
          onClick={fetchRequests}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/75 border-b border-slate-100">
              <tr>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] pl-6 w-32">Mã phiếu</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] w-48">Bệnh nhân</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Các xét nghiệm</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] w-40">Thời gian</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] text-center w-36">Trạng thái</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] text-center pr-6 w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Đang tải dữ liệu...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Không có phiếu xét nghiệm nào phù hợp.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.labRequestId} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors duration-200">
                    <td className="p-4 pl-6 font-bold text-[#1DB896]">{req.requestCode}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">ID: {req.patientId}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 min-w-[280px]">
                        {req.items?.map((item) => (
                          <div key={item.labRequestItemId} className="flex items-center justify-between gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 shadow-sm hover:border-teal-100/50 transition-all duration-300">
                            <span className="font-semibold text-slate-700 text-xs">
                              {item.testName} <span className="text-slate-400 font-medium text-[11px]">({item.testCode})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              {item.labResult ? (
                                <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                  <CheckCircle size={12} /> Đã có KQ
                                </span>
                              ) : req.status === "IN_PROGRESS" ? (
                                <button
                                  onClick={() => openResultModal(req, item)}
                                  className="bg-teal-50 hover:bg-teal-100 text-[#1DB896] border border-teal-200/50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                                >
                                  <ClipboardEdit size={14} /> Nhập KQ
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-500">
                      {new Date(req.requestedAt).toLocaleString("vi-VN", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-4 pr-6 text-center">
                      {req.status === "REQUESTED" && (
                         <button
                           disabled={actionLoading === req.labRequestId}
                           onClick={() => handleAccept(req.labRequestId)}
                           className={`bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold rounded-xl px-4 py-2 transition-all shadow-md shadow-teal-500/10 text-xs flex items-center gap-1.5 mx-auto ${actionLoading === req.labRequestId ? "opacity-50 cursor-not-allowed" : ""
                             }`}
                         >
                           <CheckCircle size={14} />
                           {actionLoading === req.labRequestId ? "Đang xử lý..." : "Tiếp nhận"}
                         </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nhập kết quả */}
      {resultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 transition-all duration-300" onClick={() => setResultModal(null)}>
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl relative border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-teal-600">
                  <ClipboardEdit size={16} />
                </div>
                Nhập kết quả xét nghiệm
              </h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setResultModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-sm font-bold text-slate-700">Xét nghiệm: {resultModal.item.testName}</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Mã: {resultModal.item.testCode}</p>
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
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={resultForm[f.key]}
                    onChange={(e) => setResultForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold transition-all text-sm"
                onClick={() => setResultModal(null)}
              >
                Hủy
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 text-sm"
                onClick={handleSaveResult}
                disabled={savingResult}
              >
                {savingResult && <RefreshCw size={16} className="animate-spin" />}
                {savingResult ? "Đang lưu..." : "Lưu kết quả"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
