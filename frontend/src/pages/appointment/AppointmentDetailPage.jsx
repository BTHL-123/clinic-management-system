import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, ArrowLeft, XCircle, RefreshCw } from "lucide-react";
import appointmentService from "../../services/appointmentService";
import RescheduleModal from "./RescheduleModal";
import { useToast } from "../../context/useToast.js";
import { useAuth } from "../../context/useAuth.js";

// Reuse CancelModal
function CancelModal({ isOpen, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(13, 76, 70, 0.25)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifycontent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)",
        padding: "28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.5)",
        width: "90%", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.12)"
      }}>
        <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: "1.2rem", fontWeight: 800 }}>Xác nhận hủy lịch</h3>
        <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "14px", fontWeight: 500 }}>
          Vui lòng nhập lý do hủy lịch hẹn này. Thao tác này không thể hoàn tác.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do hủy..."
          rows={3}
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.6)", background: "rgba(255,255,255,0.4)",
            outline: "none", resize: "none",
            marginBottom: "16px", fontFamily: "inherit", fontSize: "14px",
            boxSizing: "border-box"
          }}
        />
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.6)",
              background: "rgba(255, 255, 255, 0.6)", cursor: "pointer", fontWeight: 600, color: "#475569"
            }}
          >
            Đóng
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy || !reason.trim()}
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "none",
              background: (busy || !reason.trim()) ? "#fca5a5" : "#dc2626",
              color: "#fff", cursor: (busy || !reason.trim()) ? "not-allowed" : "pointer",
              fontWeight: 600
            }}
          >
            {busy ? "Đang xử lý..." : "Hủy lịch"}
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

  const handleCancel = async (reason) => {
    setCancelling(true);
    try {
      await appointmentService.cancelAppointment(id, reason);
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
      <div className="w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px]">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          <button 
            onClick={() => navigate(-1)}
            className={isPatientMode 
              ? "bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
              : "inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 hover:bg-white text-teal-900 font-extrabold border border-white shadow-md rounded-full hover:shadow-lg hover:-translate-x-0.5 transition-all duration-300 group mb-6"}
          >
            {isPatientMode ? (
              <ArrowLeft size={18} />
            ) : (
              <div className="bg-teal-100/80 p-1.5 rounded-full text-teal-700 group-hover:bg-teal-200 transition-colors">
                <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
              </div>
            )}
            Quay lại
          </button>
        </div>
        <div className="flex flex-col items-center text-center mt-2 px-4">
          <h1 className={isPatientMode 
            ? "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4"
            : "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4"}
          >
            <CalendarDays size={32} className={isPatientMode ? "text-teal-400 drop-shadow-md" : "text-teal-300 drop-shadow-md"} />
            <span className="drop-shadow-md">Chi tiết lịch hẹn</span>
          </h1>
        </div>
      </div>

      <div className={`${isPatientMode ? "patient-glass-card" : "light-glass-card"} p-6 md:p-8 w-full max-w-[600px] mx-auto`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: isPatientMode ? "white" : "#1e293b", fontWeight: 800 }}>Chi tiết lịch hẹn</h2>
          <span style={{ padding: "4px 12px", borderRadius: "20px", background: appt.status === "CANCELLED" ? "#fee2e2" : "#e0f2fe", color: appt.status === "CANCELLED" ? "#991b1b" : "#0284c7", fontSize: "12px", fontWeight: 600 }}>
            {appt.status}
          </span>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", color: isPatientMode ? "rgba(255,255,255,0.6)" : "#64748b", fontWeight: 600 }}>MÃ LỊCH HẸN</div>
            <div style={{ fontSize: "15px", color: isPatientMode ? "white" : "#0f172a", fontWeight: 500 }}>{appt.appointmentCode}</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: isPatientMode ? "rgba(255,255,255,0.6)" : "#64748b", fontWeight: 600 }}>BỆNH NHÂN</div>
            <div style={{ fontSize: "15px", color: isPatientMode ? "white" : "#0f172a" }}>{appt.patientName}</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: isPatientMode ? "rgba(255,255,255,0.6)" : "#64748b", fontWeight: 600 }}>BÁC SĨ</div>
            <div style={{ fontSize: "15px", color: isPatientMode ? "white" : "#0f172a" }}>{appt.doctorName} - {appt.departmentName}</div>
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <div>
              <div style={{ fontSize: "12px", color: isPatientMode ? "rgba(255,255,255,0.6)" : "#64748b", fontWeight: 600 }}>NGÀY KHÁM</div>
              <div style={{ fontSize: "15px", color: isPatientMode ? "white" : "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}><CalendarDays size={16}/> {appt.appointmentDate}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: isPatientMode ? "rgba(255,255,255,0.6)" : "#64748b", fontWeight: 600 }}>GIỜ KHÁM</div>
              <div style={{ fontSize: "15px", color: isPatientMode ? "white" : "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}><Clock size={16}/> {appt.startTime?.substring(0,5)} - {appt.endTime?.substring(0,5)}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: isPatientMode ? "rgba(255,255,255,0.6)" : "#64748b", fontWeight: 600 }}>LÝ DO KHÁM</div>
            <div style={{ fontSize: "15px", color: isPatientMode ? "rgba(255,255,255,0.9)" : "#0f172a" }}>{appt.reasonForVisit || "—"}</div>
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
