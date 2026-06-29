import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, ArrowLeft } from "lucide-react";
import doctorLeaveRequestService from "../../services/doctorLeaveRequestService.js";
import { useToast } from "../../context/useToast.js";
import { toLocalDateString } from "../../lib/utils";
import PageHeader from "../../components/PageHeader";

const STATUS_BADGE = {
  PENDING: { label: "Chờ duyệt", color: "text-amber-800", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  APPROVED: { label: "Đã duyệt", color: "text-emerald-800", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  REJECTED: { label: "Bị từ chối", color: "text-rose-800", bg: "bg-rose-500/20", border: "border-rose-500/30" },
};

const TYPE_LABEL = {
  LEAVE: "Xin nghỉ",
  CHANGE_SCHEDULE: "Thay đổi lịch",
};

// Status display helpers for the conflicting-appointment table
const CONFLICT_STATUS_LABEL = {
  SCHEDULED: "Chờ khám",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã check-in",
};
const CONFLICT_STATUS_BG = {
  SCHEDULED: "bg-amber-500/20",
  CONFIRMED: "bg-blue-500/20",
  CHECKED_IN: "bg-emerald-500/20",
};
const CONFLICT_STATUS_COLOR = {
  SCHEDULED: "text-amber-800",
  CONFIRMED: "text-blue-800",
  CHECKED_IN: "text-emerald-800",
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || { label: status, color: "text-slate-300", bg: "bg-slate-500/20", border: "border-slate-500/30" };
  return (
    <span className={`${cfg.bg} ${cfg.color} border ${cfg.border} px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap`}>
      {cfg.label}
    </span>
  );
}

export default function DoctorLeaveRequestPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const today = toLocalDateString(new Date());
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

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

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
      // If the backend returned structured conflict data, display the table
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
      toast.success("Đã hủy yêu cầu.");
    } catch (err) {
      toast.error(err, "Hủy yêu cầu thất bại");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <PageHeader
        title="Yêu cầu nghỉ / Thay đổi lịch"
        icon={ClipboardList}
        iconColor="text-white"
        subtitle="Gửi và theo dõi các yêu cầu nghỉ phép hoặc đổi lịch trực."
        onBack={() => navigate("/dashboard")}
      />

      {/* ─── Form ─── */}
      <div className="patient-glass-panel rounded-[3rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] border-0 w-full mb-6 text-slate-900">
        <h2 className="text-lg font-extrabold mb-6 patient-card-title">
          Gửi yêu cầu mới
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold patient-label mb-2">Loại yêu cầu</label>
              <select
                name="requestType"
                value={form.requestType}
                onChange={handleChange}
                className="w-full patient-glass-input text-slate-900 font-bold px-4 py-3 outline-none focus:border-teal-500/50 transition-all [&>option]:bg-white [&>option]:text-slate-900"
              >
                <option value="LEAVE">Xin nghỉ</option>
                <option value="CHANGE_SCHEDULE">Thay đổi lịch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold patient-label mb-2">Ngày</label>
              <input
                type="date"
                name="leaveDate"
                min={today}
                value={form.leaveDate}
                onChange={handleChange}
                required
                className="w-full patient-glass-input text-slate-900 font-bold px-4 py-3 outline-none focus:border-teal-500/50 transition-all [color-scheme:light]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold patient-label mb-2">Giờ bắt đầu</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  required
                  className="w-full patient-glass-input text-slate-900 font-bold px-4 py-3 outline-none focus:border-teal-500/50 transition-all [color-scheme:light]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold patient-label mb-2">Giờ kết thúc</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  required
                  className="w-full patient-glass-input text-slate-900 font-bold px-4 py-3 outline-none focus:border-teal-500/50 transition-all [color-scheme:light]"
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold patient-label mb-2">Lý do</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={3}
                required
                placeholder="Nhập lý do xin nghỉ hoặc thay đổi lịch..."
                className="w-full patient-glass-input text-slate-900 font-bold px-4 py-3 outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-500/50 resize-y"
              />
            </div>
          </div>

          {formError && (
            <div className="bg-rose-500/20 border border-rose-500/30 text-rose-800 p-3 rounded-xl text-sm font-medium">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-sm font-medium">
              {formSuccess}
            </div>
          )}

          {conflictingAppointments.length > 0 && (
            <div className="mt-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-rose-800 mb-4">
                Danh sách lịch hẹn bị trùng
              </h3>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                  <thead className="bg-rose-500/20 text-rose-800">
                    <tr>
                      {["Mã lịch hẹn", "Bệnh nhân", "Số điện thoại", "Ngày khám", "Giờ khám", "Trạng thái"].map((h) => (
                        <th key={h} className="p-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {conflictingAppointments.map((appt) => (
                      <tr key={appt.appointmentId} className="border-b border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-rose-700">{appt.appointmentCode}</td>
                        <td className="p-3 font-bold text-slate-900">{appt.patientName}</td>
                        <td className="p-3 text-slate-700 font-medium">{appt.patientPhone || "—"}</td>
                        <td className="p-3 text-slate-800 font-semibold">{appt.appointmentDate}</td>
                        <td className="p-3 font-semibold text-slate-800">{appt.startTime?.slice(0, 5)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${CONFLICT_STATUS_BG[appt.status] || "bg-slate-900/10"} ${CONFLICT_STATUS_COLOR[appt.status] || "text-slate-700"} border-current/30`}>
                            {CONFLICT_STATUS_LABEL[appt.status] || appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center ${submitting
                  ? "bg-teal-500/40 text-teal-200 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5"
                }`}
            >
              {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Table ─── */}
      <div className="flex-1 patient-glass-panel rounded-[3rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] border-0 w-full flex flex-col min-h-0 overflow-hidden text-slate-900">
        <h2 className="text-lg font-bold mb-6 patient-card-title">
          Danh sách yêu cầu của tôi
        </h2>

        {loading ? (
          <div className="text-center text-slate-500 p-8 font-medium">Đang tải...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-slate-500 p-8 font-medium">Chưa có yêu cầu nào.</div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar -mx-8 px-8">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-white/5 border-b border-slate-900/10 text-[#0f766e] text-sm sticky top-0 backdrop-blur-md z-10">
                <tr>
                  {["Loại", "Ngày", "Giờ", "Lý do", "Trạng thái", "Ghi chú admin", "Hành động"].map((h) => (
                    <th key={h} className="p-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-900/10 hover:bg-white/30 transition-colors">
                    <td className="p-4 font-extrabold text-slate-900">{TYPE_LABEL[r.requestType] ?? r.requestType}</td>
                    <td className="p-4 font-bold text-slate-900">{r.leaveDate}</td>
                    <td className="p-4 text-slate-800 font-semibold">{r.startTime?.slice(0, 5)} – {r.endTime?.slice(0, 5)}</td>
                    <td className="p-4 text-slate-700 max-w-[200px] truncate font-medium" title={r.reason}>{r.reason}</td>
                    <td className="p-4"><StatusBadge status={r.status} /></td>
                    <td className={`p-4 ${r.adminComment ? "text-slate-700 font-semibold" : "text-slate-400 italic"}`}>
                      {r.adminComment || "—"}
                    </td>
                    <td className="p-4">
                      {r.status === "PENDING" ? (
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancellingId === r.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${cancellingId === r.id
                              ? "bg-rose-500/20 text-rose-800 border-rose-500/30 cursor-not-allowed opacity-60"
                              : "bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                        >
                          {cancellingId === r.id ? "Đang hủy..." : "Hủy"}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
