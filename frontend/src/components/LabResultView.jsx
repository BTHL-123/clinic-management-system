import { useEffect, useState } from "react";
import { getLabRequestsByConsultationId } from "../services/labRequestService";
import { FlaskConical, ExternalLink, Calendar, Info } from "lucide-react";

export default function LabResultView({ consultationId }) {
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!consultationId) return;
    setLoading(true);
    getLabRequestsByConsultationId(consultationId)
      .then((res) => {
        setLabRequests(res.data || []);
        setError("");
      })
      .catch((err) => setError(err.message || "Không thể tải kết quả xét nghiệm."))
      .finally(() => setLoading(false));
  }, [consultationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1DB896]"></div>
        <span>Đang tải kết quả xét nghiệm...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-650 px-4 py-2.5 rounded-xl text-xs font-semibold">
        {error}
      </div>
    );
  }

  if (!labRequests.length) return null;

  return (
    <div className="w-full flex flex-col gap-6">
      <h5 className="text-sm font-extrabold text-[#0A604E] flex items-center gap-2 pb-2 border-b border-slate-200/60">
        <FlaskConical size={16} className="text-[#1DB896]" />
        Chi tiết kết quả Xét nghiệm Lâm sàng
      </h5>

      {labRequests.map((req) => (
        <div key={req.labRequestId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Req Header */}
          <div className="bg-slate-50 px-4 py-3.5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Phiếu xét nghiệm:</span>
              <strong className="text-sm font-extrabold text-slate-800 tracking-tight">{req.requestCode}</strong>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <StatusBadge status={req.status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-550">
              <Calendar size={13} className="text-slate-400" />
              <span>Yêu cầu ngày: {new Date(req.requestedAt).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[#4A5D59] font-bold">
                  <th className="p-3.5 font-bold w-[25%]">Tên xét nghiệm</th>
                  <th className="p-3.5 font-bold w-[12%]">Mã</th>
                  <th className="p-3.5 font-bold w-[15%]">Kết quả</th>
                  <th className="p-3.5 font-bold w-[10%]">Đơn vị</th>
                  <th className="p-3.5 font-bold w-[18%]">Chỉ số bình thường</th>
                  <th className="p-3.5 font-bold w-[15%]">Kết luận</th>
                  <th className="p-3.5 font-bold w-[10%] text-center">Đính kèm</th>
                </tr>
              </thead>
              <tbody>
                {req.items.map((item) => {
                  const hasResult = !!item.labResult;
                  return (
                    <tr key={item.labRequestItemId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800">{item.testName}</td>
                      <td className="p-3.5 font-semibold text-slate-500">{item.testCode}</td>
                      
                      {hasResult ? (
                        <>
                          <td className="p-3.5 font-extrabold text-[#0A604E]">{item.labResult.resultValue || "—"}</td>
                          <td className="p-3.5 font-bold text-slate-600">{item.labResult.resultUnit || "—"}</td>
                          <td className="p-3.5 font-semibold text-slate-500 bg-slate-50/40">{item.labResult.normalRange || "—"}</td>
                          <td className="p-3.5 font-bold text-slate-700">{item.labResult.conclusion || "—"}</td>
                          <td className="p-3.5 text-center">
                            {item.labResult.resultFileUrl ? (
                              <a
                                href={item.labResult.resultFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1DB896] hover:text-[#0A604E] transition-colors bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-100"
                              >
                                <ExternalLink size={12} />
                                <span>Xem file</span>
                              </a>
                            ) : (
                              <span className="text-slate-450 font-medium">—</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="p-3.5 text-slate-400 italic font-semibold">
                          Chưa có kết quả xét nghiệm
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {req.note && (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs font-semibold text-slate-700 flex items-start gap-2">
              <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
              <p className="m-0 leading-normal">
                <span className="text-slate-500 font-bold mr-1">Ghi chú yêu cầu:</span>
                {req.note}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    REQUESTED: { label: "Chờ xử lý", border: "border-amber-200", color: "text-amber-800", bg: "bg-amber-50" },
    IN_PROGRESS: { label: "Đang thực hiện", border: "border-blue-200", color: "text-blue-800", bg: "bg-blue-50" },
    COMPLETED: { label: "Hoàn thành", border: "border-emerald-250", color: "text-emerald-800", bg: "bg-emerald-50" },
    CANCELLED: { label: "Đã hủy", border: "border-red-200", color: "text-red-800", bg: "bg-red-50" },
  };
  const s = map[status] || { label: status, border: "border-slate-200", color: "text-slate-700", bg: "bg-slate-100" };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.border} ${s.color} ${s.bg}`}>
      {s.label}
    </span>
  );
}
