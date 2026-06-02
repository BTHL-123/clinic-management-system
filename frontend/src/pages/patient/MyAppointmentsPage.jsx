import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Star, MessageSquarePlus } from "lucide-react";
import appointmentService from "../../services/appointmentService.js";
import { createReview } from "../../services/reviewService.js";
import { useAuth } from "../../context/useAuth.js";
import RescheduleModal from "../appointment/RescheduleModal.jsx";

// Modal Component for Cancelling Appointment
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

// Modal Component for Writing Review
function ReviewModal({ isOpen, onClose, onConfirm, busy }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

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
        <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: "1.2rem" }}>Đánh giá dịch vụ</h3>
        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "14px" }}>
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
      borderRadius: "20px", background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}22`,
    }}>
      {cfg.label}
    </span>
  );
}

function AppointmentCard({ appt, onCancelRequest, onRescheduleRequest, onReviewRequest, currentUserFullName }) {
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
    <div style={{
      background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px",
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)", transition: "box-shadow 0.18s",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.05)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
            {appt.appointmentCode}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
            Mã lịch hẹn
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div style={{ height: "1px", background: "#f1f5f9" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>NGÀY KHÁM</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{date}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>GIỜ KHÁM</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{time} – {endTime}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>LÝ DO KHÁM</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>{appt.reasonForVisit || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>HÌNH THỨC</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>{appt.bookingType === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}</div>
        </div>
        <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>BỆNH NHÂN</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{appt.patientName || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>BÁC SĨ</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{appt.doctorName || "—"}</div>
          </div>
        </div>
        {appt.status === "CANCELLED" && appt.cancellationReason && (
          <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>LÝ DO HỦY</div>
            <div style={{ fontSize: "13px", color: "#dc2626" }}>{appt.cancellationReason}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px", gap: "8px" }}>
        <button
          onClick={() => navigate(`/dashboard/appointments/${appt.appointmentId}`)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 14px", borderRadius: "6px", border: "1px solid #cbd5e1",
            background: "#fff", color: "#475569", cursor: "pointer",
            fontSize: "13px", fontWeight: 600, transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
        >
          Xem chi tiết
        </button>

        {(appt.status === "CONFIRMED" || appt.status === "PENDING_PAYMENT") && (
          <>
            {!isPastStartTime ? (
              <>
                <button
                  onClick={() => onRescheduleRequest(appt)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 14px", borderRadius: "6px", border: "1px solid #cbd5e1",
                    background: "#fff", color: "#0ea5e9", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600, transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f0f9ff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  <RefreshCw size={14} />
                  Dời lịch
                </button>
                <button
                  onClick={() => onCancelRequest(appt.appointmentId)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 14px", borderRadius: "6px", border: "1px solid #fecaca",
                    background: "#fff", color: "#dc2626", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600, transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  <XCircle size={14} />
                  Hủy lịch
                </button>
              </>
            ) : (
              <span style={{ fontSize: "12px", color: "#b45309", fontStyle: "italic", display: "flex", alignItems: "center", padding: "6px 0" }}>
                Đã qua giờ khám
              </span>
            )}
          </>
        )}

        {appt.status === "COMPLETED" && appt.patientName === currentUserFullName && (
          <button
            onClick={() => onReviewRequest(appt.appointmentId)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 14px", borderRadius: "6px", border: "1px solid #eab308",
              background: "#fff", color: "#ca8a04", cursor: "pointer",
              fontSize: "13px", fontWeight: 600, transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fefce8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
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
    ? <CalendarDays size={44} style={{ color: "#cbd5e1" }} />
    : <Clock size={44} style={{ color: "#cbd5e1" }} />;
  const msg = tab === "upcoming"
    ? "Bạn chưa có lịch hẹn sắp tới."
    : "Bạn chưa có lịch sử khám bệnh.";

  return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: "#94a3b8" }}>
      {icon}
      <div style={{ marginTop: "14px", fontSize: "14px" }}>{msg}</div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
          Lịch hẹn của tôi
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
          Xem lịch hẹn sắp tới và tra cứu lịch sử khám bệnh của bạn.
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", border: "1.5px solid",
              transition: "all 0.15s",
              background: tab === t.key ? "#0f766e" : "#ffffff",
              color: tab === t.key ? "#ffffff" : "#475569",
              borderColor: tab === t.key ? "#0f766e" : "#e2e8f0",
            }}
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
                <AppointmentCard key={appt.appointmentId} appt={appt} onCancelRequest={handleCancelRequest} onRescheduleRequest={handleRescheduleRequest} onReviewRequest={handleReviewRequest} currentUserFullName={user?.fullName} />
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

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => { if (!submittingReview) setReviewModalOpen(false); }}
        onConfirm={handleConfirmReview}
        busy={submittingReview}
      />
    </div>
  );
}
