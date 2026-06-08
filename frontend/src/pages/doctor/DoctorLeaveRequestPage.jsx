import { useState, useEffect, useCallback } from "react";
import doctorLeaveRequestService from "../../services/doctorLeaveRequestService.js";
import { useToast } from "../../context/useToast.js";

const STATUS_BADGE = {
  PENDING: { label: "Chờ duyệt", color: "text-amber-300", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  APPROVED: { label: "Đã duyệt", color: "text-emerald-300", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  REJECTED: { label: "Bị từ chối", color: "text-rose-300", bg: "bg-rose-500/20", border: "border-rose-500/30" },
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
  SCHEDULED: "text-amber-300",
  CONFIRMED: "text-blue-300",
  CHECKED_IN: "text-emerald-300",
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
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    requestType: "LEAVE",
    leaveDate: today,
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
    <div className="text-white flex flex-col h-full gap-6 pb-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        📋 Yêu cầu nghỉ / Thay đổi lịch
      </h1>

      {/* ─── Form ─── */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-xl">
        <h2 className="text-lg font-bold mb-6 text-white/90">
          Gửi yêu cầu mới
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-white/60 mb-2">Loại yêu cầu</label>
              <select
                name="requestType"
                value={form.requestType}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-medium appearance-none"
              >
                <option value="LEAVE" className="bg-slate-800">Xin nghỉ</option>
                <option value="CHANGE_SCHEDULE" className="bg-slate-800">Thay đổi lịch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Ngày</label>
              <input
                type="date"
                name="leaveDate"
                min={today}
                value={form.leaveDate}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-medium [color-scheme:dark]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Giờ bắt đầu</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-medium [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Giờ kết thúc</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-medium [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-white/60 mb-2">Lý do</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={3}
                required
                placeholder="Nhập lý do xin nghỉ hoặc thay đổi lịch..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-medium placeholder:text-white/30 resize-y"
              />
            </div>
          </div>

          {formError && (
            <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-sm font-medium">
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
              <h3 className="text-sm font-bold text-rose-400 mb-4">
                Danh sách lịch hẹn bị trùng
              </h3>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                  <thead className="bg-rose-500/20 text-rose-300">
                    <tr>
                      {["Mã lịch hẹn", "Bệnh nhân", "Số điện thoại", "Ngày khám", "Giờ khám", "Trạng thái"].map((h) => (
                        <th key={h} className="p-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {conflictingAppointments.map((appt) => (
                      <tr key={appt.appointmentId} className="border-b border-rose-500/10 hover:bg-rose-500/10 transition-colors">
                        <td className="p-3 font-mono font-bold text-rose-300">{appt.appointmentCode}</td>
                        <td className="p-3 font-medium text-white">{appt.patientName}</td>
                        <td className="p-3 text-white/70">{appt.patientPhone || "—"}</td>
                        <td className="p-3 text-white/90">{appt.appointmentDate}</td>
                        <td className="p-3 font-medium">{appt.startTime?.slice(0, 5)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${CONFLICT_STATUS_BG[appt.status] || "bg-white/10"} ${CONFLICT_STATUS_COLOR[appt.status] || "text-white/70"} border-current/30`}>
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
                  ? "bg-blue-500/40 text-blue-200 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
                }`}
            >
              {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Table ─── */}
      <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-xl flex flex-col min-h-0 overflow-hidden">
        <h2 className="text-lg font-bold mb-6 text-white/90">
          Danh sách yêu cầu của tôi
        </h2>

        {loading ? (
          <div className="text-center text-white/50 p-8 font-medium">Đang tải...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-white/50 p-8 font-medium">Chưa có yêu cầu nào.</div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar -mx-8 px-8">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/10 text-white/70 text-sm sticky top-0 backdrop-blur-md z-10">
                <tr>
                  {["Loại", "Ngày", "Giờ", "Lý do", "Trạng thái", "Ghi chú admin", "Hành động"].map((h) => (
                    <th key={h} className="p-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white/90">{TYPE_LABEL[r.requestType] ?? r.requestType}</td>
                    <td className="p-4 font-medium text-white">{r.leaveDate}</td>
                    <td className="p-4 text-white/80">{r.startTime?.slice(0, 5)} – {r.endTime?.slice(0, 5)}</td>
                    <td className="p-4 text-white/80 max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                    <td className="p-4"><StatusBadge status={r.status} /></td>
                    <td className={`p-4 ${r.adminComment ? "text-white/80" : "text-white/40 italic"}`}>
                      {r.adminComment || "—"}
                    </td>
                    <td className="p-4">
                      {r.status === "PENDING" ? (
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancellingId === r.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${cancellingId === r.id
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30 cursor-not-allowed opacity-60"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                        >
                          {cancellingId === r.id ? "Đang hủy..." : "Hủy"}
                        </button>
                      ) : (
                        <span className="text-white/30 text-sm">—</span>
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
