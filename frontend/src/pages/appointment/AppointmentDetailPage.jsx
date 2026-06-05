import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, ArrowLeft, XCircle, RefreshCw } from "lucide-react";
import appointmentService from "../../services/appointmentService";
import RescheduleModal from "./RescheduleModal";
import { useToast } from "../../context/useToast.js";

// Reuse CancelModal
function CancelModal({ isOpen, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", padding: "24px", borderRadius: "12px",
        width: "90%", maxWidth: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
      }}>
        <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: "1.2rem" }}>Xác nhận hủy lịch</h3>
        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "14px" }}>
          Vui lòng nhập lý do hủy lịch hẹn này. Thao tác này không thể hoàn tác.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do hủy..."
          rows={3}
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: "1px solid #cbd5e1", outline: "none", resize: "none",
            marginBottom: "16px", fontFamily: "inherit", fontSize: "14px",
            boxSizing: "border-box"
          }}
        />
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1",
              background: "#fff", cursor: "pointer", fontWeight: 600, color: "#475569"
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
    <div style={{ maxWidth: "600px" }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "#64748b", marginBottom: "24px" }}
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Chi tiết lịch hẹn</h2>
          <span style={{ padding: "4px 12px", borderRadius: "20px", background: appt.status === "CANCELLED" ? "#fee2e2" : "#e0f2fe", color: appt.status === "CANCELLED" ? "#991b1b" : "#0284c7", fontSize: "12px", fontWeight: 600 }}>
            {appt.status}
          </span>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>MÃ LỊCH HẸN</div>
            <div style={{ fontSize: "15px", color: "#0f172a", fontWeight: 500 }}>{appt.appointmentCode}</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>BỆNH NHÂN</div>
            <div style={{ fontSize: "15px", color: "#0f172a" }}>{appt.patientName}</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>BÁC SĨ</div>
            <div style={{ fontSize: "15px", color: "#0f172a" }}>{appt.doctorName} - {appt.departmentName}</div>
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>NGÀY KHÁM</div>
              <div style={{ fontSize: "15px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}><CalendarDays size={16}/> {appt.appointmentDate}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>GIỜ KHÁM</div>
              <div style={{ fontSize: "15px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}><Clock size={16}/> {appt.startTime?.substring(0,5)} - {appt.endTime?.substring(0,5)}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>LÝ DO KHÁM</div>
            <div style={{ fontSize: "15px", color: "#0f172a" }}>{appt.reasonForVisit || "—"}</div>
          </div>
          {appt.status === "CANCELLED" && (
            <div style={{ background: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca" }}>
              <div style={{ fontSize: "12px", color: "#991b1b", fontWeight: 600 }}>LÝ DO HỦY</div>
              <div style={{ fontSize: "14px", color: "#dc2626", marginTop: "4px" }}>{appt.cancellationReason}</div>
              {appt.cancelledAt && <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>Hủy lúc: {new Date(appt.cancelledAt).toLocaleString('vi-VN')}</div>}
            </div>
          )}
        </div>

        {(appt.status === "CONFIRMED" || appt.status === "PENDING_PAYMENT") && (
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
            {!isPastStartTime ? (
              <>
                <button
                  onClick={() => setRescheduleModalOpen(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
                    borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#0ea5e9",
                    fontWeight: 600, cursor: "pointer"
                  }}
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
