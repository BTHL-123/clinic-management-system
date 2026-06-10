import { useEffect, useState, useCallback } from "react";
import { FlaskConical, RefreshCw, CheckCircle, ClipboardEdit, X, FileText } from "lucide-react";
import { getAllLabRequests, acceptLabRequest } from "../../services/labRequestService";
import { createLabResult } from "../../services/labResultService";
import { useToast } from "../../context/useToast.js";

const STATUS_MAP = {
  REQUESTED: { label: "Chờ tiếp nhận", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  IN_PROGRESS: { label: "Đang xử lý", color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200" },
  COMPLETED: { label: "Hoàn thành", color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200" },
  CANCELLED: { label: "Đã hủy", color: "text-rose-700", bg: "bg-rose-100", border: "border-rose-200" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" };
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
  const [filterStatus, setFilterStatus] = useState("IN_PROGRESS");
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
    if (!resultForm.resultValue.trim()) {
      toast.error("Vui lòng nhập giá trị kết quả.", "Thiếu thông tin");
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
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10">

      {/* Header */}
      <div className="w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px] mt-4">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          {/* Dashboard Home usually acts as the root, so no back button here unless they came from somewhere, but let's leave it without a back button or add a small one */}
        </div>
        <div className="flex flex-col items-center text-center mt-2 px-4">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <FlaskConical size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md">Phòng Xét Nghiệm</span>
          </h1>
          <p className="text-white/80 font-bold drop-shadow-sm text-[16px] max-w-[600px]">
            Quản lý, tiếp nhận và cập nhật kết quả xét nghiệm của bệnh nhân.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-100/80 border border-rose-300 text-rose-800 p-4 rounded-2xl shadow-sm font-semibold">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[800px] mb-8">
        <div className="patient-glass-panel p-5 rounded-[2rem] flex justify-between items-center group hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all">
          <div>
            <p className="patient-label text-sm uppercase tracking-wider mb-1 font-bold text-[#0f766e]">Chờ tiếp nhận</p>
            <h3 className="text-3xl font-black text-amber-600 drop-shadow-sm">{waitingCount}</h3>
          </div>
          <div className="bg-amber-100 text-amber-600 p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-sm border border-amber-200">
            <FileText size={24} />
          </div>
        </div>
        <div className="patient-glass-panel p-5 rounded-[2rem] flex justify-between items-center group hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all">
          <div>
            <p className="patient-label text-sm uppercase tracking-wider mb-1 font-bold text-[#0f766e]">Đang xử lý</p>
            <h3 className="text-3xl font-black text-blue-600 drop-shadow-sm">{inProgressCount}</h3>
          </div>
          <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-sm border border-blue-200">
            <RefreshCw size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="patient-glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-sm w-full mb-6">
        <div className="flex items-center gap-3">
          <label className="text-[#0f766e] font-bold text-sm whitespace-nowrap">Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/60 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold transition-all"
          >
            <option value="">Tất cả</option>
            <option value="REQUESTED">Chờ tiếp nhận</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
        </div>
        <button
          className="bg-white/80 hover:bg-teal-50 text-[#0f766e] border border-teal-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          onClick={fetchRequests}
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Data Table */}
      <div className="patient-glass-panel rounded-[2rem] overflow-hidden flex flex-col shadow-sm w-full">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-slate-900/10">
              <tr>
                <th className="p-4 font-extrabold text-[#0f766e] pl-6">Mã phiếu</th>
                <th className="p-4 font-extrabold text-[#0f766e]">Bệnh nhân</th>
                <th className="p-4 font-extrabold text-[#0f766e]">Các xét nghiệm</th>
                <th className="p-4 font-extrabold text-[#0f766e]">Thời gian</th>
                <th className="p-4 font-extrabold text-[#0f766e] text-center w-32">Trạng thái</th>
                <th className="p-4 font-extrabold text-[#0f766e] text-center pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[#0f172a]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Không có phiếu xét nghiệm nào phù hợp.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.labRequestId} className="border-b border-slate-900/10 hover:bg-white/30 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800">{req.requestCode}</td>
                    <td className="p-4 font-medium text-slate-600">ID: {req.patientId}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {req.items?.map((item) => (
                          <div key={item.labRequestItemId} className="flex items-center justify-between gap-4 patient-glass-subcard bg-white/40 p-2 rounded-xl border border-white/60 shadow-sm">
                            <span className="font-semibold text-slate-700">
                              • {item.testName} <span className="text-slate-500 font-medium text-xs">({item.testCode})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              {item.labResult ? (
                                <span className="text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-emerald-200">
                                  <CheckCircle size={12} /> Đã có KQ
                                </span>
                              ) : req.status === "IN_PROGRESS" ? (
                                <button
                                  onClick={() => openResultModal(req, item)}
                                  className="bg-violet-100 hover:bg-violet-200 text-violet-700 border border-violet-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                  <ClipboardEdit size={14} /> Nhập KQ
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
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
                          className={`bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm mx-auto ${actionLoading === req.labRequestId ? "opacity-50 cursor-not-allowed" : ""
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="patient-glass-panel bg-white/90 p-6 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative border border-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#0f766e]">
                Nhập kết quả xét nghiệm
              </h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                onClick={() => setResultModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3 patient-glass-subcard bg-teal-50/50 border border-teal-100/50 rounded-xl">
              <p className="text-sm font-bold text-[#0f766e]">Xét nghiệm: {resultModal.item.testName}</p>
              <p className="text-xs font-semibold text-teal-600">Mã: {resultModal.item.testCode}</p>
            </div>

            <div className="grid gap-4 mb-6">
              {[
                { key: "resultValue", label: "Giá trị kết quả *", placeholder: "VD: 5.2" },
                { key: "resultUnit", label: "Đơn vị", placeholder: "VD: mmol/L" },
                { key: "normalRange", label: "Khoảng bình thường", placeholder: "VD: 3.9 - 6.1" },
                { key: "conclusion", label: "Kết luận", placeholder: "Bình thường / Bất thường..." },
                { key: "resultFileUrl", label: "Link file kết quả (nếu có)", placeholder: "https://..." },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-bold text-[#0f766e] mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={resultForm[f.key]}
                    onChange={(e) => setResultForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-white/60 border border-slate-200 text-[#0f172a] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium transition-all placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0f172a] font-bold transition-all"
                onClick={() => setResultModal(null)}
              >
                Hủy
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-[0_4px_14px_rgba(13,148,136,0.4)] transition-all flex items-center gap-2"
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
