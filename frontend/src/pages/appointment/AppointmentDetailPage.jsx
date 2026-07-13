import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, ArrowLeft, XCircle, RefreshCw } from "lucide-react";
import appointmentService from "../../services/appointmentService";
import RescheduleModal from "./RescheduleModal";
import { useToast } from "../../context/useToast.js";
import { useAuth } from "../../context/useAuth.js";
import PageHeader from "../../components/PageHeader";

// Reuse CancelModal
function CancelModal({ isOpen, onClose, onConfirm, busy, appointment }) {
  const [reason, setReason] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  if (!isOpen) return null;

  const apptDate = new Date(`${appointment?.appointmentDate}T${appointment?.startTime}`);
  const diffHours = (apptDate - new Date()) / (1000 * 60 * 60);
  const isTooClose = diffHours < 2;

  const requiresRefund = appointment?.status === "CONFIRMED" && appointment?.depositAmount > 0 && !isTooClose;
  const showNoRefundWarning = appointment?.status === "CONFIRMED" && appointment?.depositAmount > 0 && isTooClose;

  const isFormValid = reason.trim() && (!requiresRefund || (bankName.trim() && accountNumber.trim() && accountName.trim()));

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-7 w-[90%] max-w-[420px] shadow-2xl border border-slate-100 animate-[fadeIn_0.2s_ease]">
        <h3 className="text-lg font-black text-slate-900 mb-2">Xác nhận hủy lịch khám</h3>
        <p className="text-[#4A5D59] text-xs font-semibold mb-5">
          Vui lòng nhập lý do hủy lịch hẹn này. Thao tác này sẽ giải phóng ca khám và không thể hoàn tác.
        </p>

        {showNoRefundWarning && (
          <div className="mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
            <p className="text-red-800 text-xs font-semibold">
              Cảnh báo: Bạn đang hủy lịch quá sát giờ khám (dưới 2 tiếng). Theo chính sách, bạn sẽ <b>KHÔNG được hoàn lại tiền cọc</b>. Bạn có chắc chắn muốn hủy không?
            </p>
          </div>
        )}

        {requiresRefund && (
          <div className="mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <p className="text-blue-800 text-xs font-semibold mb-3">Lịch hẹn này đã đặt cọc. Vui lòng nhập thông tin ngân hàng để được hoàn tiền theo chính sách.</p>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Ngân hàng (VD: Vietcombank)" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold" />
              <input type="text" placeholder="Số tài khoản" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold" />
              <input type="text" placeholder="Tên chủ tài khoản" value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase" />
            </div>
          </div>
        )}

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do hủy lịch..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] resize-none text-xs font-bold mb-5 placeholder-slate-450 text-slate-800"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-slate-50 transition-colors text-xs cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={() => onConfirm({ cancellationReason: reason, bankName, bankAccountNumber: accountNumber, accountHolderName: accountName.toUpperCase() })}
            disabled={busy || !isFormValid}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs cursor-pointer"
          >
            {busy ? "Đang xử lý..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentDetailPage() {
  const toast = useToast();
  const { user } = useAuth();
  const isPatientMode = user?.roles?.includes("PATIENT");
  const { id } = useParams();
  const navigate = useNavigate();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    appointmentService.getAppointmentById(id)
      .then(res => setAppt(res.data ?? res))
      .catch(err => setError(err.message || "Không thể tải chi tiết lịch hẹn"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCancel = async (payload) => {
    setCancelling(true);
    try {
      await appointmentService.cancelAppointment(id, payload);
      setCancelModalOpen(false);
      toast.success("Đã hủy lịch hẹn.");
      loadData();
    } catch (err) {
      toast.error(err, "Không thể hủy lịch hẹn");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div style={{ padding: "40px" }}>Đang tải...</div>;
  if (error) return <div style={{ padding: "40px", color: "red" }}>{error}</div>;
  if (!appt) return <div style={{ padding: "40px" }}>Không tìm thấy lịch hẹn</div>;

  const now = new Date();
  const isPastStartTime = appt.appointmentDate && appt.startTime 
    ? now >= new Date(`${appt.appointmentDate}T${appt.startTime}`) 
    : false;

  return (
    <div className="max-w-[800px] mx-auto w-full flex flex-col items-center">
      <PageHeader
        title="Chi tiết lịch hẹn"
        icon={CalendarDays}
        iconColor={isPatientMode ? "text-teal-400" : "text-teal-300"}
        onBack={() => navigate(-1)}
      />

      <div className={`${isPatientMode ? "bg-white rounded-2xl border border-slate-200 shadow-sm" : "light-glass-card"} p-6 md:p-8 w-full max-w-[600px] mx-auto`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 className={isPatientMode ? "patient-section-title" : ""} style={{ margin: 0, fontSize: "1.25rem", color: isPatientMode ? undefined : "#0f172a", fontWeight: 800 }}>Chi tiết lịch hẹn</h2>
          <span style={{ padding: "4px 12px", borderRadius: "20px", background: appt.status === "CANCELLED" ? "#fee2e2" : "#e0f2fe", color: appt.status === "CANCELLED" ? "#991b1b" : "#0284c7", fontSize: "12px", fontWeight: 600 }}>
            {appt.status}
          </span>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: "12px", color: isPatientMode ? undefined : "#475569", fontWeight: 600 }}>MÃ LỊCH HẸN</div>
            <div className={isPatientMode ? "patient-data" : ""} style={{ fontSize: "15px", color: isPatientMode ? undefined : "#0f172a", fontWeight: 600 }}>{appt.appointmentCode}</div>
          </div>
          <div>
            <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: "12px", color: isPatientMode ? undefined : "#475569", fontWeight: 600 }}>BỆNH NHÂN</div>
            <div className={isPatientMode ? "patient-data" : ""} style={{ fontSize: "15px", color: isPatientMode ? undefined : "#0f172a", fontWeight: 600 }}>{appt.patientName}</div>
          </div>
          <div>
            <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: "12px", color: isPatientMode ? undefined : "#475569", fontWeight: 600 }}>BÁC SĨ</div>
            <div className={isPatientMode ? "patient-data" : ""} style={{ fontSize: "15px", color: isPatientMode ? undefined : "#0f172a", fontWeight: 600 }}>{appt.doctorName} - {appt.departmentName}</div>
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <div>
              <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: "12px", color: isPatientMode ? undefined : "#475569", fontWeight: 600 }}>NGÀY KHÁM</div>
              <div className={isPatientMode ? "patient-data" : ""} style={{ fontSize: "15px", color: isPatientMode ? undefined : "#0f172a", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}><CalendarDays size={16}/> {appt.appointmentDate}</div>
            </div>
            <div>
              <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: "12px", color: isPatientMode ? undefined : "#475569", fontWeight: 600 }}>GIỜ KHÁM</div>
              <div className={isPatientMode ? "patient-data" : ""} style={{ fontSize: "15px", color: isPatientMode ? undefined : "#0f172a", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}><Clock size={16}/> {appt.startTime?.substring(0,5)} - {appt.endTime?.substring(0,5)}</div>
            </div>
          </div>
          <div>
            <div className={isPatientMode ? "patient-label" : ""} style={{ fontSize: "12px", color: isPatientMode ? undefined : "#475569", fontWeight: 600 }}>LÝ DO KHÁM</div>
            <div className={isPatientMode ? "patient-data" : ""} style={{ fontSize: "15px", color: isPatientMode ? undefined : "#0f172a", fontWeight: 600 }}>{appt.reasonForVisit || "—"}</div>
          </div>
          {appt.status === "CANCELLED" && (
            <div style={{ background: "rgba(254, 242, 242, 0.5)", backdropFilter: "blur(4px)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(254, 202, 202, 0.6)" }}>
              <div style={{ fontSize: "12px", color: "#991b1b", fontWeight: 650 }}>LÝ DO HỦY</div>
              <div style={{ fontSize: "14px", color: "#dc2626", marginTop: "4px", fontWeight: 500 }}>{appt.cancellationReason}</div>
              {appt.cancelledAt && <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>Hủy lúc: {new Date(appt.cancelledAt).toLocaleString('vi-VN')}</div>}
            </div>
          )}
        </div>

        {(appt.status === "CONFIRMED" || appt.status === "PENDING_PAYMENT") && (
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.25)", display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
            {!isPastStartTime ? (
              <>
                <button
                  onClick={() => setRescheduleModalOpen(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
                    borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.5)", background: "rgba(255, 255, 255, 0.6)", color: "#0ea5e9",
                    fontWeight: 600, cursor: "pointer", transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(240, 249, 255, 0.8)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}
                >
                  <RefreshCw size={18} /> Dời lịch hẹn
                </button>
                <button
                  onClick={() => setCancelModalOpen(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
                    borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff",
                    fontWeight: 600, cursor: "pointer"
                  }}
                >
                  <XCircle size={18} /> Hủy lịch hẹn
                </button>
              </>
            ) : (
              <span style={{ fontSize: "14px", color: "#b45309", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={16} /> Đã qua giờ khám, không thể thao tác
              </span>
            )}
          </div>
        )}
      </div>

      <CancelModal
        isOpen={cancelModalOpen}
        onClose={() => { if(!cancelling) setCancelModalOpen(false); }}
        onConfirm={handleCancel}
        busy={cancelling}
        appointment={appt}
      />

      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        onRescheduleSuccess={() => {
          toast.success("Dời lịch hẹn thành công!");
          loadData();
        }}
        appointment={appt}
      />
    </div>
  );
}
