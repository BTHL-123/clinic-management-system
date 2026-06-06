import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Star, MessageSquarePlus, ArrowLeft } from "lucide-react";
import appointmentService from "../../services/appointmentService.js";
import { createReview } from "../../services/reviewService.js";
import { useAuth } from "../../context/useAuth.js";
import RescheduleModal from "../appointment/RescheduleModal.jsx";
import { getPayments } from "../../services/paymentService.js";
import { getRefunds } from "../../services/refundService.js";
import RefundRequestModal from "./RefundRequestModal.jsx";

// Modal Component for Cancelling Appointment
function CancelModal({ isOpen, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(13, 76, 70, 0.25)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
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

// Modal Component for Writing Review
function ReviewModal({ isOpen, onClose, onConfirm, busy }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(13, 76, 70, 0.25)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(20px)",
        padding: "28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.5)",
        width: "90%", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.12)"
      }}>
        <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: "1.2rem", fontWeight: 800 }}>Đánh giá dịch vụ</h3>
        <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "14px", fontWeight: 500 }}>
          Đánh giá trải nghiệm khám bệnh của bạn. Phản hồi này giúp chúng tôi cải thiện dịch vụ tốt hơn.
        </p>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "16px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={32}
              fill={star <= rating ? "#eab308" : "transparent"}
              color={star <= rating ? "#eab308" : "#cbd5e1"}
              style={{ cursor: "pointer", transition: "transform 0.1s" }}
              onClick={() => setRating(star)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            />
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét của bạn (không bắt buộc)..."
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
            onClick={() => onConfirm(rating, comment)}
            disabled={busy}
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "none",
              background: busy ? "#94a3b8" : "#0f766e",
              color: "#fff", cursor: busy ? "not-allowed" : "pointer",
              fontWeight: 600
            }}
          >
            {busy ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  CONFIRMED:       { label: "Đã xác nhận",  color: "#0f766e", bg: "#f0fdf9" },
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "#b45309", bg: "#fffbeb" },
  CHECKED_IN:      { label: "Đã check-in",  color: "#1d4ed8", bg: "#eff6ff" },
  COMPLETED:       { label: "Hoàn thành",   color: "#16a34a", bg: "#f0fdf4" },
  CANCELLED:       { label: "Đã hủy",       color: "#dc2626", bg: "#fef2f2" },
  NO_SHOW:         { label: "Vắng mặt",     color: "#7c3aed", bg: "#f5f3ff" },
  RESCHEDULED:     { label: "Đổi lịch",     color: "#0369a1", bg: "#f0f9ff" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#64748b", bg: "#f8fafc" };
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, padding: "3px 10px",
      borderRadius: "20px", background: cfg.bg, color: cfg.color
    }}>
      {cfg.label}
    </span>
  );
}

function AppointmentCard({
  appt,
  onCancelRequest,
  onRescheduleRequest,
  onRefundRequest,
  onReviewRequest,
  currentUserFullName
}) {
  const navigate = useNavigate();
  const date = appt.appointmentDate
    ? new Date(appt.appointmentDate).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";
  const time = appt.startTime ? appt.startTime.substring(0, 5) : "—";
  const endTime = appt.endTime ? appt.endTime.substring(0, 5) : "—";

  const now = new Date();
  const isPastStartTime = appt.appointmentDate && appt.startTime
    ? now >= new Date(`${appt.appointmentDate}T${appt.startTime}`)
    : false;

  return (
    <div className="patient-glass-subcard p-5 flex flex-col gap-3 hover:bg-white/10 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-[0.95rem] text-white">
            {appt.appointmentCode}
          </div>
          <div className="text-[12px] text-white/60 mt-0.5">
            Mã lịch hẹn
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="h-px bg-white/10" />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[11px] text-white/50 font-semibold mb-0.5">NGÀY KHÁM</div>
          <div className="text-[13px] font-semibold text-white/90">{date}</div>
        </div>
        <div>
          <div className="text-[11px] text-white/50 font-semibold mb-0.5">GIỜ KHÁM</div>
          <div className="text-[13px] font-semibold text-white/90">{time} – {endTime}</div>
        </div>
        <div>
          <div className="text-[11px] text-white/50 font-semibold mb-0.5">LÝ DO KHÁM</div>
          <div className="text-[13px] text-white/80">{appt.reasonForVisit || "—"}</div>
        </div>
        <div>
          <div className="text-[11px] text-white/50 font-semibold mb-0.5">HÌNH THỨC</div>
          <div className="text-[13px] text-white/80">{appt.bookingType === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}</div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2 mt-1">
          <div>
            <div className="text-[11px] text-white/50 font-semibold mb-0.5">BỆNH NHÂN</div>
            <div className="text-[13px] font-semibold text-white/90">{appt.patientName || "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-white/50 font-semibold mb-0.5">BÁC SĨ</div>
            <div className="text-[13px] font-semibold text-white/90">{appt.doctorName || "—"}</div>
          </div>
        </div>
        {appt.status === "CANCELLED" && appt.cancellationReason && (
          <div className="col-span-2 mt-1">
            <div className="text-[11px] text-white/50 font-semibold mb-0.5">LÝ DO HỦY</div>
            <div className="text-[13px] text-red-400">{appt.cancellationReason}</div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-3 gap-2">
        {appt.status === "CANCELLED" && appt.depositAmount > 0 && (
          <button
            onClick={() => onRefundRequest(appt)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 cursor-pointer text-[13px] font-semibold transition-all"
          >
            Yêu cầu hoàn tiền
          </button>
        )}
        <button
          onClick={() => navigate(`/dashboard/appointments/${appt.appointmentId}`)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-white/30 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white cursor-pointer text-[13px] font-semibold transition-all"
        >
          Xem chi tiết
        </button>

        {(appt.status === "CONFIRMED" || appt.status === "PENDING_PAYMENT") && (
          <>
            {!isPastStartTime ? (
              <>
                <button
                  onClick={() => onRescheduleRequest(appt)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 hover:text-sky-200 cursor-pointer text-[13px] font-semibold transition-all"
                >
                  <RefreshCw size={14} />
                  Dời lịch
                </button>
                <button
                  onClick={() => onCancelRequest(appt.appointmentId)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer text-[13px] font-semibold transition-all"
                >
                  <XCircle size={14} />
                  Hủy lịch
                </button>
              </>
            ) : (
              <span className="text-[12px] text-amber-500/90 italic flex items-center py-1.5">
                Đã qua giờ khám
              </span>
            )}
          </>
        )}

        {appt.status === "COMPLETED" && appt.hasReviewed && (
          <span className="text-[12px] text-emerald-400 font-semibold flex items-center gap-1 py-1.5">
            ✓ Đã đánh giá
          </span>
        )}

        {appt.status === "COMPLETED" && appt.patientName === currentUserFullName && !appt.hasReviewed && (
          <button
            onClick={() => onReviewRequest(appt.appointmentId)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 cursor-pointer text-[13px] font-semibold transition-all"
          >
            <MessageSquarePlus size={14} />
            Viết đánh giá
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  const icon = tab === "upcoming"
    ? <CalendarDays size={44} className="text-white/30 mx-auto" />
    : <Clock size={44} className="text-white/30 mx-auto" />;
  const msg = tab === "upcoming"
    ? "Bạn chưa có lịch hẹn sắp tới."
    : "Bạn chưa có lịch sử khám bệnh.";

  return (
    <div className="text-center py-16 text-white/60">
      {icon}
      <div className="mt-4 text-[14px]">{msg}</div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") === "history" ? "history" : "upcoming";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Cancel logic
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelRequest = (id) => {
    setCancelTargetId(id);
    setCancelModalOpen(true);
  };

  // Refund logic
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundTargetPayment, setRefundTargetPayment] = useState(null);

  const handleRefundRequest = async (appt) => {
    setLoading(true);
    setError(null);
    try {
      const payRes = await getPayments({ appointmentId: appt.appointmentId });
      const payments = payRes.data?.content || payRes.data || [];
      const paidPayment = payments.find(p => p.status === "PAID");

      if (!paidPayment) {
        setError("Không tìm thấy giao dịch đã thanh toán cho lịch hẹn này.");
        return;
      }

      const refundRes = await getRefunds({ paymentId: paidPayment.paymentId });
      const refunds = refundRes.data?.content || refundRes.data || [];
      if (refunds.length > 0) {
        setError(`Đã có yêu cầu hoàn tiền cho lịch này (Trạng thái: ${refunds[0].status}).`);
        return;
      }

      setRefundTargetPayment(paidPayment);
      setRefundModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi kiểm tra thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  // Reschedule logic
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState(null);

  const handleRescheduleRequest = (appt) => {
    setRescheduleTargetAppt(appt);
    setRescheduleModalOpen(true);
  };

  // Review logic
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleReviewRequest = (id) => {
    setReviewTargetId(id);
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async (rating, comment) => {
    if (!reviewTargetId) return;
    setSubmittingReview(true);
    setError(null);
    setSuccessMsg("");
    try {
      await createReview({ appointmentId: reviewTargetId, rating, comment });
      setSuccessMsg("Cảm ơn bạn đã đánh giá!");
      setReviewModalOpen(false);
      setReviewTargetId(null);
      loadData();
    } catch (err) {
      setError(err.message || "Không thể gửi đánh giá.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleConfirmCancel = async (reason) => {
    if (!cancelTargetId) return;
    setCancelling(true);
    setError(null);
    setSuccessMsg("");
    try {
      await appointmentService.cancelAppointment(cancelTargetId, reason);
      setSuccessMsg("Đã hủy lịch khám thành công.");
      setCancelModalOpen(false);
      setCancelTargetId(null);
      // Reload current page
      loadData();
    } catch (err) {
      setError(err.message || "Không thể hủy lịch.");
    } finally {
      setCancelling(false);
    }
  };

  const loadData = () => {
    setLoading(true);
    setError(null);
    const upcoming = tab === "upcoming" ? true : false;
    appointmentService
      .getMyAppointments(upcoming, page, pageSize)
      .then((res) => setData(res.data ?? res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    setPage(0);
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [tab, page]);

  const tabs = [
    { key: "upcoming", label: "Lịch hẹn sắp tới", icon: <CalendarDays size={16} /> },
    { key: "history",  label: "Lịch sử khám bệnh", icon: <Clock size={16} /> },
  ];

  return (
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center">
      <div className="w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px]">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          <button 
            onClick={() => navigate("/dashboard", { state: { activeClusterId: "booking" } })}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
        <div className="flex flex-col items-center text-center mt-2 px-4">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <CalendarDays size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md">Lịch hẹn của tôi</span>
          </h1>
          <p className="text-white/70 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            Xem lịch hẹn sắp tới và tra cứu lịch sử khám bệnh của bạn.
          </p>
        </div>
      </div>

      <div className="patient-glass-card p-6 md:p-8 w-full max-w-[800px] mx-auto mb-10">
        <div className="flex flex-wrap gap-3 mb-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-200 shadow-sm ${
              tab === t.key 
                ? "bg-teal-700/80 backdrop-blur-md text-white border border-teal-800/40" 
                : "bg-white/30 backdrop-blur-sm border border-white/30 text-teal-950 hover:bg-white/50 hover:text-teal-900"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          Đang tải dữ liệu...
        </div>
      )}

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px",
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
          padding: "14px 18px", color: "#dc2626", fontSize: "14px",
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px",
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px",
          padding: "14px 18px", color: "#16a34a", fontSize: "14px",
        }}>
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.content?.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.content.map((appt) => (
<AppointmentCard
  key={appt.appointmentId}
  appt={appt}
  onCancelRequest={handleCancelRequest}
  onRescheduleRequest={handleRescheduleRequest}
  onRefundRequest={handleRefundRequest}
  onReviewRequest={handleReviewRequest}
/>
              ))}
            </div>
          )}

          {data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.page === 0}
                style={{
                  background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px",
                  padding: "6px 10px", cursor: data.page === 0 ? "default" : "pointer",
                  opacity: data.page === 0 ? 0.4 : 1, display: "flex", alignItems: "center",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Trang {data.page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
                style={{
                  background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px",
                  padding: "6px 10px", cursor: data.last ? "default" : "pointer",
                  opacity: data.last ? 0.4 : 1, display: "flex", alignItems: "center",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
      </div>

      <CancelModal
        isOpen={cancelModalOpen}
        onClose={() => { if (!cancelling) setCancelModalOpen(false); }}
        onConfirm={handleConfirmCancel}
        busy={cancelling}
      />

      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        onRescheduleSuccess={() => {
          setSuccessMsg("Đã dời lịch khám thành công.");
          loadData();
        }}
        appointment={rescheduleTargetAppt}
      />

<RefundRequestModal
  isOpen={refundModalOpen}
  onClose={() => setRefundModalOpen(false)}
  payment={refundTargetPayment}
  onSuccess={() => {
    setSuccessMsg("Đã gửi yêu cầu hoàn tiền thành công. Trạng thái: Đang chờ xử lý.");
    setRefundModalOpen(false);
    loadData();
  }}
/>

<ReviewModal
  isOpen={reviewModalOpen}
  onClose={() => { if (!submittingReview) setReviewModalOpen(false); }}
  onConfirm={handleConfirmReview}
  busy={submittingReview}
/>
    </div>
  );
}
