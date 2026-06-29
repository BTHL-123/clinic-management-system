import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, AlertTriangle, ArrowLeft, Send, Calendar, Clock, CheckCircle2, HelpCircle } from "lucide-react";
import doctorLeaveRequestService from "../../services/doctorLeaveRequestService.js";
import { useToast } from "../../context/useToast.js";

const STATUS_BADGE = {
  PENDING: { label: "Đang chờ duyệt", color: "text-amber-700 bg-amber-50 border-amber-100/60" },
  APPROVED: { label: "Đã chấp thuận", color: "text-emerald-700 bg-emerald-50 border-emerald-100/60" },
  REJECTED: { label: "Bị từ chối", color: "text-rose-700 bg-rose-50 border-rose-100/60" },
};

const TYPE_LABEL = {
  LEAVE: "Nghỉ phép năm",
  CHANGE_SCHEDULE: "Thay đổi lịch trực",
};

const CONFLICT_STATUS_LABEL = {
  SCHEDULED: "Chờ khám",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã check-in",
};
const CONFLICT_STATUS_BG = {
  SCHEDULED: "bg-amber-50 border-amber-100",
  CONFIRMED: "bg-sky-50 border-sky-100",
  CHECKED_IN: "bg-emerald-50 border-emerald-100",
};
const CONFLICT_STATUS_COLOR = {
  SCHEDULED: "text-amber-600",
  CONFIRMED: "text-sky-600",
  CHECKED_IN: "text-emerald-600",
};

export default function DoctorLeaveRequestPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().split("T")[0];
  const prefillDate = location.state?.prefillDate || today;

  const [form, setForm] = useState({
    requestType: "LEAVE",
    leaveDate: prefillDate,
    startTime: "08:00",
    endTime: "17:00",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [conflictingAppointments, setConflictingAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, PENDING, RESOLVED

  const getDurationStr = (start, end) => {
    if (!start || !end) return "—";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMinutes <= 0) return "—";
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours >= 8) return "1 ngày";
    return `${diffHours} giờ`;
  };

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorLeaveRequestService.getMyLeaveRequests();
      setRequests(res?.data ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "leaveDate" || e.target.name === "startTime" || e.target.name === "endTime") {
      setConflictingAppointments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (form.startTime >= form.endTime) {
      setFormError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }
    if (!form.reason.trim()) {
      setFormError("Lý do không được để trống.");
      return;
    }

    setSubmitting(true);
    try {
      await doctorLeaveRequestService.createLeaveRequest({
        requestType: form.requestType,
        leaveDate: form.leaveDate,
        startTime: form.startTime + ":00",
        endTime: form.endTime + ":00",
        reason: form.reason.trim(),
      });
      setFormSuccess("Gửi yêu cầu thành công!");
      setForm({ requestType: "LEAVE", leaveDate: today, startTime: "08:00", endTime: "17:00", reason: "" });
      setConflictingAppointments([]);
      fetchMyRequests();
    } catch (err) {
      const msg = err.message || "Gửi yêu cầu thất bại.";
      setFormError(msg);
      if (err.conflictingAppointments && err.conflictingAppointments.length > 0) {
        setConflictingAppointments(err.conflictingAppointments);
      } else {
        setConflictingAppointments([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy yêu cầu này không?")) return;
    setCancellingId(id);
    try {
      await doctorLeaveRequestService.cancelLeaveRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast?.success("Đã hủy yêu cầu.");
    } catch (err) {
      toast?.error(err, "Hủy yêu cầu thất bại");
    } finally {
      setCancellingId(null);
    }
  };

  const approvedCount = requests.filter(r => r.status === "APPROVED" && r.requestType === "LEAVE").length;
  const pendingCount = requests.filter(r => r.status === "PENDING").length;
  const remainingDays = Math.max(0, 15 - approvedCount);

  const approvedCountStr = approvedCount < 10 ? `0${approvedCount}` : approvedCount.toString();
  const pendingCountStr = pendingCount < 10 ? `0${pendingCount}` : pendingCount.toString();
  const remainingDaysStr = remainingDays < 10 ? `0${remainingDays}` : remainingDays.toString();

  const filteredRequests = requests.filter((r) => {
    if (activeTab === "PENDING") return r.status === "PENDING";
    if (activeTab === "RESOLVED") return r.status === "APPROVED" || r.status === "REJECTED";
    return true;
  });

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 relative pb-8">

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm group active:scale-95"
            title="Trở về Trang chủ"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ClipboardList size={14} className="stroke-[2.5]" />
              </span>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Quản lý nghỉ phép</h1>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-0.5">Theo dõi và gửi yêu cầu nghỉ phép của bạn.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-[100px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">NGÀY PHÉP CÒN LẠI</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600">{remainingDaysStr}</span>
            <span className="text-xs font-bold text-slate-400">/ 15 ngày</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-[100px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border-l-4 border-l-amber-500">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ĐƠN ĐANG CHỜ DUYỆT</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold text-amber-500">{pendingCountStr}</span>
            <span className="text-xs font-bold text-slate-400">yêu cầu</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-[100px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border-l-4 border-l-[#0A604E]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ĐÃ NGHĨ NĂM NAY</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold text-teal-800">{approvedCountStr}</span>
            <span className="text-xs font-bold text-slate-400">ngày</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-[100px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border-l-4 border-l-blue-500">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ĐIỂM CHUYÊN CẦN</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold text-blue-600">98</span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">

        {/* Left Column: Form (Gửi đơn mới) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-black text-[#0A604E] tracking-tight mb-6">Gửi đơn mới</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Type */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Loại nghỉ phép</label>
                <select
                  name="requestType"
                  value={form.requestType}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200/80 text-slate-700 font-bold px-4 py-3 rounded-xl outline-none focus:border-teal-500/50 transition-all [&>option]:bg-white [&>option]:text-slate-800 text-xs"
                >
                  <option value="LEAVE">Nghỉ phép năm</option>
                  <option value="CHANGE_SCHEDULE">Thay đổi lịch trực</option>
                </select>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Ngày</label>
                <input
                  type="date"
                  name="leaveDate"
                  min={today}
                  value={form.leaveDate}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200/80 text-slate-700 font-bold px-4 py-3 rounded-xl outline-none focus:border-teal-500/50 transition-all text-xs [color-scheme:light]"
                />
              </div>

              {/* Time inputs side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Từ giờ</label>
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200/80 text-slate-700 font-bold px-4 py-3 rounded-xl outline-none focus:border-teal-500/50 transition-all text-xs [color-scheme:light]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Đến giờ</label>
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200/80 text-slate-700 font-bold px-4 py-3 rounded-xl outline-none focus:border-teal-500/50 transition-all text-xs [color-scheme:light]"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Lý do nghỉ</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows={4}
                  required
                  placeholder="Nhập chi tiết lý do..."
                  className="w-full bg-slate-50 border border-slate-200/80 text-slate-700 font-medium px-4 py-3 rounded-xl outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-400 resize-none text-xs leading-relaxed"
                />
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={15} />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl text-xs font-bold">
                  {formSuccess}
                </div>
              )}

              {/* Conflicting Appointments */}
              {conflictingAppointments.length > 0 && (
                <div className="mt-2 bg-rose-50/50 border border-rose-100/60 rounded-2xl p-4 flex flex-col gap-3 animate-fadeIn">
                  <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Danh sách lịch hẹn bị trùng
                  </h3>
                  <div className="overflow-x-auto custom-scrollbar flex flex-col gap-2 max-h-[160px]">
                    {conflictingAppointments.map((appt) => (
                      <div key={appt.appointmentId} className="bg-white border border-rose-100 p-2.5 rounded-xl text-xs font-semibold flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-rose-600 font-black">{appt.appointmentCode}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${CONFLICT_STATUS_BG[appt.status] || "bg-slate-50 border-slate-100"} ${CONFLICT_STATUS_COLOR[appt.status] || "text-slate-500"}`}>
                            {CONFLICT_STATUS_LABEL[appt.status] || appt.status}
                          </span>
                        </div>
                        <div className="text-slate-800 font-extrabold">{appt.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{appt.appointmentDate} • {appt.startTime?.slice(0, 5)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-xl font-extrabold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${submitting
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-[#0A604E] hover:bg-[#084e40] text-white shadow-teal-500/10 active:scale-98"
                  }`}
              >
                <Send size={12} />
                {submitting ? "ĐANG GỬI..." : "GỬI ĐƠN NGHỈ PHÉP"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List (Lịch sử nghỉ phép) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[400px] flex flex-col">

            {/* List Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50 mb-6">
              <h2 className="text-base font-black text-[#0A604E] tracking-tight">Lịch sử nghỉ phép</h2>

              {/* Tabs */}
              <div className="flex border border-slate-200/60 rounded-xl overflow-hidden p-0.5 bg-slate-100/50 self-start sm:self-auto">
                {[
                  { id: "ALL", label: "Tất cả" },
                  { id: "PENDING", label: "Chờ duyệt" },
                  { id: "RESOLVED", label: "Đã duyệt" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                        ? "bg-[#0A604E] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-400 font-bold text-xs">Đang tải...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-400 font-bold text-xs">Không tìm thấy yêu cầu nào.</div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50/30 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="p-4 font-black">LOẠI ĐƠN</th>
                      <th className="p-4 font-black">THỜI GIAN</th>
                      <th className="p-4 font-black text-center">SỐ GIỜ</th>
                      <th className="p-4 font-black">TRẠNG THÁI</th>
                      <th className="p-4 font-black text-center">HÀNH ĐỘNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 text-xs">
                    {filteredRequests.map((r) => {
                      const badge = STATUS_BADGE[r.status] || { label: r.status, color: "text-slate-500 bg-slate-50 border-slate-100" };
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* LOẠI ĐƠN */}
                          <td className="p-4">
                            <div className="font-extrabold text-slate-800">{TYPE_LABEL[r.requestType] ?? r.requestType}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-0.5 max-w-[220px] truncate" title={r.reason}>
                              {r.reason}
                            </div>
                          </td>
                          {/* THỜI GIAN */}
                          <td className="p-4 font-bold text-slate-700">
                            <div>{r.leaveDate}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                              {r.startTime?.slice(0, 5)} – {r.endTime?.slice(0, 5)}
                            </div>
                          </td>
                          {/* SỐ GIỜ */}
                          <td className="p-4 text-center font-bold text-slate-700">
                            {getDurationStr(r.startTime, r.endTime)}
                          </td>
                          {/* TRẠNG THÁI */}
                          <td className="p-4">
                            <span className={`${badge.color} border px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase whitespace-nowrap`}>
                              {badge.label}
                            </span>
                            {r.adminComment && (
                              <div className="text-[10px] text-rose-500 font-bold italic mt-1.5 max-w-[150px] truncate" title={r.adminComment}>
                                Phản hồi: {r.adminComment}
                              </div>
                            )}
                          </td>
                          {/* HÀNH ĐỘNG */}
                          <td className="p-4 text-center">
                            {r.status === "PENDING" ? (
                              <button
                                onClick={() => handleCancel(r.id)}
                                disabled={cancellingId === r.id}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${cancellingId === r.id
                                    ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100/60 active:scale-95"
                                  }`}
                              >
                                {cancellingId === r.id ? "Đang hủy..." : "Hủy đơn"}
                              </button>
                            ) : (
                              <span className="text-slate-300 font-bold text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Info Rule Banner */}
            <div className="mt-6 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0">
                  <HelpCircle size={15} className="text-emerald-700" />
                </span>
                <p className="text-xs text-[#0A604E] font-bold">
                  Bạn cần gửi đơn trước ít nhất 3 ngày đối với các kỳ nghỉ trên 2 ngày.
                </p>
              </div>
              <a href="#rules" className="text-xs font-black text-[#0A604E] hover:underline shrink-0">Xem quy định</a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
