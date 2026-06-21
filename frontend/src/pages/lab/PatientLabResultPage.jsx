import { useEffect, useState, useCallback } from "react";
import { FlaskConical, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyLabRequests } from "../../services/labRequestService";
import PageHeader from "../../components/PageHeader";

const STATUS_MAP = {
  REQUESTED:   { label: "Chờ xử lý",       color: "#d97706", bg: "#fef3c7" },
  IN_PROGRESS: { label: "Đang thực hiện",   color: "#2563eb", bg: "#dbeafe" },
  COMPLETED:   { label: "Hoàn thành",       color: "#16a34a", bg: "#dcfce7" },
  CANCELLED:   { label: "Đã hủy",           color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

function ResultValueCell({ value }) {
  if (!value) return <span className="patient-data opacity-60">—</span>;
  return <strong className="patient-data font-bold">{value}</strong>;
}

function LabRequestRow({ req }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="patient-clean-subcard mb-3 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Header row */}
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 px-4 py-3.5 bg-black/5 cursor-pointer select-none hover:bg-black/10 transition-colors"
      >
        <FlaskConical size={16} className="text-teal-700" />
        <div className="flex-1">
          <span className="font-extrabold patient-data">{req.requestCode}</span>
          <span className="text-[12px] patient-data font-semibold ml-2.5">
            {new Date(req.requestedAt).toLocaleDateString("vi-VN", {
              day: "2-digit", month: "2-digit", year: "numeric",
            })}
          </span>
        </div>
        <StatusBadge status={req.status} />
        <span className="text-[12px] text-slate-600 font-semibold ml-2">
          {req.items?.length || 0} xét nghiệm
        </span>
        {expanded ? <ChevronUp size={16} className="text-slate-600 ml-2" /> : <ChevronDown size={16} className="text-slate-600 ml-2" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4">
          {req.note && (
            <p className="text-[13px] text-slate-700 my-2.5">
              <strong className="text-slate-900">Ghi chú:</strong> {req.note}
            </p>
          )}
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse text-[13px] text-left">
              <thead>
                <tr className="bg-black/5 border-b border-slate-300">
                  {["Tên xét nghiệm", "Mã XN", "Kết quả", "Đơn vị", "Khoảng bình thường", "Kết luận", "Đính kèm", "Trạng thái"].map((h) => (
                    <th key={h} className="p-2.5 font-bold patient-label whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {req.items?.map((item) => (
                  <tr key={item.labRequestItemId} className="border-b border-slate-200/60 hover:bg-black/5 transition-colors">
                    <td className="p-2.5 font-bold patient-data">{item.testName}</td>
                    <td className="p-2.5 patient-data font-medium">{item.testCode}</td>
                    {item.labResult ? (
                      <>
                        <td className="p-2.5">
                          <ResultValueCell value={item.labResult.resultValue} />
                        </td>
                        <td className="p-2.5 text-slate-700 font-medium">{item.labResult.resultUnit || "—"}</td>
                        <td className="p-2.5 text-slate-700 font-medium">{item.labResult.normalRange || "—"}</td>
                        <td className="p-2.5 text-slate-700 font-medium">{item.labResult.conclusion || "—"}</td>
                        <td className="p-2.5">
                          {item.labResult.resultFileUrl ? (
                            <a href={item.labResult.resultFileUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 flex items-center gap-1 font-bold text-[11px] bg-teal-50 px-2 py-1.5 rounded-lg border border-teal-100 w-max transition-colors">
                              <ExternalLink size={12} /> Xem ảnh
                            </a>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <StatusBadge status={item.status} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td colSpan={5} className="p-2.5 text-slate-500 italic">
                          Chưa có kết quả
                        </td>
                        <td className="p-2.5">
                          <StatusBadge status={item.status} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientLabResultPage() {
  const navigate = useNavigate();
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyLabRequests({ page, size: 10 });
      setLabRequests(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch (err) {
      setError(err.message || "Không thể tải kết quả xét nghiệm.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="w-full min-h-full p-6 flex flex-col gap-6 patient-clean-page">
      <PageHeader
        title="Kết quả xét nghiệm"
        icon={FlaskConical}
        iconColor="text-teal-400"
        subtitle="Xem chi tiết toàn bộ các kết quả xét nghiệm lâm sàng của bạn."
        onBack={() => navigate("/dashboard", { state: { activeClusterId: "records" } })}
      />

      <div className="patient-clean-card p-6 md:p-8 w-full max-w-[800px] mx-auto mb-10">
        <div className="flex justify-end mb-5">
          <button
            className="flex items-center gap-1.5 px-4 py-2 bg-black/5 hover:bg-black/10 text-slate-900 font-bold rounded-xl transition-colors border border-slate-300"
            onClick={fetchData}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error && error.length > 120 ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau." : error}</div>}

      {loading ? (
        <div className="p-8 text-slate-600 text-center font-bold">
          Đang tải kết quả xét nghiệm...
        </div>
      ) : labRequests.length === 0 ? (
        <div className="text-center py-16 px-6 text-slate-700 bg-black/5 rounded-2xl border border-dashed border-slate-300">
          <FlaskConical size={40} className="mx-auto mb-3 opacity-40 text-slate-900" />
          <p className="m-0 font-bold">Bạn chưa có phiếu xét nghiệm nào.</p>
        </div>
      ) : (
        <>
          {labRequests.map((req) => (
            <LabRequestRow key={req.labRequestId} req={req} />
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-black/5 text-slate-800 hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} /> Trước
              </button>
              <span className="px-3 py-1.5 text-[13px] text-slate-600 font-bold">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-black/5 text-slate-800 hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Tiếp <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}
