import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  CalendarDays, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, 
  ChevronLeft, ChevronRight, Star, MessageSquarePlus, ArrowLeft, Search, 
  Filter, Calendar, MapPin, Coins, User, ShieldAlert, X, ShieldCheck, GraduationCap, Activity, ThumbsUp
} from "lucide-react";
import appointmentService from "../../services/appointmentService.js";
import { createReview } from "../../services/reviewService.js";
import { useAuth } from "../../context/useAuth.js";
import RescheduleModal from "../appointment/RescheduleModal.jsx";
import { getPayments, createOnlinePaymentUrl, verifySePayTransaction } from "../../services/paymentService.js";
import { getRefunds } from "../../services/refundService.js";
import { getDoctors } from "../../services/doctorService.js";
import { getActiveDepartments } from "../../services/departmentService.js";
import RefundRequestModal from "./RefundRequestModal.jsx";

// Modal Component for Cancelling Appointment
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

// Modal Component for Writing Review
function ReviewModal({ isOpen, onClose, onConfirm, busy }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-7 w-[90%] max-w-[420px] shadow-2xl border border-slate-100 animate-[fadeIn_0.2s_ease]">
        <h3 className="text-lg font-black text-slate-900 mb-2">Đánh giá dịch vụ khám</h3>
        <p className="text-[#4A5D59] text-xs font-semibold mb-5">
          Đánh giá trải nghiệm khám bệnh của bạn. Phản hồi này giúp chúng tôi cải thiện chất lượng phục vụ tốt hơn.
        </p>

        <div className="flex gap-2 justify-center mb-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={32}
              fill={star <= rating ? "#eab308" : "transparent"}
              color={star <= rating ? "#eab308" : "#cbd5e1"}
              className="cursor-pointer hover:scale-110 transition-transform"
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét của bạn (không bắt buộc)..."
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
            onClick={() => onConfirm(rating, comment)}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-[#0A604E] text-white font-black hover:bg-[#084f40] transition-colors disabled:opacity-50 text-xs cursor-pointer"
          >
            {busy ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ isOpen, onClose, paymentData, onPaymentSuccess }) {
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !paymentData) return null;

  const handleVerify = async () => {
    setError("");
    setVerifying(true);
    try {
      await verifySePayTransaction(paymentData.paymentId);
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Xác thực thanh toán thất bại.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-[420px] shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-md font-black text-slate-800">Thanh toán cọc giữ ca khám</h3>
          <button onClick={onClose} disabled={verifying} className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 hover:bg-slate-100 rounded-full cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center overflow-y-auto">
          {success ? (
            <div className="text-center py-8 flex flex-col items-center animate-in fade-in zoom-in-95">
              <CheckCircle size={60} className="text-emerald-600 mb-4" strokeWidth={1.5} />
              <h4 className="text-lg font-black mb-1">Thanh toán thành công!</h4>
              <p className="text-xs text-slate-500 max-w-[280px]">
                Giao dịch của bạn đã được xác thực thành công. Lịch khám đã được xác nhận.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="mb-4 bg-teal-50 text-teal-800 border-teal-100 px-4 py-2.5 rounded-xl border text-center text-xs font-semibold">
                Vui lòng quét mã QR dưới đây để thực hiện thanh toán cọc.
              </div>

              <div className="p-2 border border-slate-200 rounded-2xl bg-white shadow-sm inline-block mb-4">
                <img 
                  src={paymentData.paymentUrl} 
                  alt="QR Code thanh toán" 
                  className="w-48 h-48 rounded-xl object-contain"
                />
              </div>

              <div className="text-center mb-6">
                <p className="text-sm font-black text-slate-800">Số tiền: {paymentData.amount?.toLocaleString("vi-VN")} đ</p>
                <p className="text-xs font-bold text-rose-500 mt-1">Mã đơn: {paymentData.paymentCode}</p>
              </div>

              {error && (
                <div className="w-full mb-4 bg-rose-50 border border-rose-250 text-rose-700 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex-1 bg-[#1DB896] hover:bg-[#159f80] text-white font-black text-xs py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {verifying ? "Đang xác thực..." : "Đã thanh toán (Xác thực)"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={verifying}
                  className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs py-3 rounded-xl transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  CONFIRMED:       { label: "Đã xác nhận",  color: "text-[#0A604E]", bg: "bg-[#D1F2EB]", border: "border-[#1DB896]/20" },
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  CHECKED_IN:      { label: "Đã check-in",  color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  COMPLETED:       { label: "Hoàn thành",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  CANCELLED:       { label: "Đã hủy",       color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100" },
  NO_SHOW:         { label: "Vắng mặt",     color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" },
  RESCHEDULED:     { label: "Đổi lịch",     color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
  return (
    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} border uppercase tracking-wider`}>
      {cfg.label}
    </span>
  );
}

function EmptyState({ tab }) {
  const icon = tab === "upcoming"
    ? <CalendarDays size={48} className="text-slate-350 mx-auto opacity-40" />
    : <Clock size={48} className="text-slate-350 mx-auto opacity-40" />;
  const msg = tab === "upcoming"
    ? "Bạn chưa có lịch hẹn khám sắp tới."
    : "Bạn chưa có lịch sử khám bệnh nào.";

  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
      {icon}
      <div className="mt-4 text-sm text-[#4A5D59] font-bold">{msg}</div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = ["history", "calendar"].includes(searchParams.get("tab")) ? searchParams.get("tab") : "upcoming";
  
  const [data, setData] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const [keyword, setKeyword] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Master-Detail Selection State
  const [selectedApptId, setSelectedApptId] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const docRes = await getDoctors({ size: 100, status: "ACTIVE" });
        setDoctors(docRes.data?.content || docRes.data || []);
        const depRes = await getActiveDepartments();
        setSpecialties(depRes.data || []);
      } catch (e) {}
    };
    fetchOptions();
  }, []);

  // Cancel logic
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelTargetAppt, setCancelTargetAppt] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelRequest = (appt) => {
    setCancelTargetId(appt.appointmentId);
    setCancelTargetAppt(appt);
    setCancelModalOpen(true);
  };

  // Online Payment resume logic
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentData, setActivePaymentData] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const handleStartOnlinePayment = async (appt) => {
    setLoadingPayment(true);
    setError(null);
    try {
      const res = await createOnlinePaymentUrl({ appointmentId: appt.appointmentId });
      const paymentData = res.data ?? res;
      setActivePaymentData(paymentData);
      setPaymentModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể khởi tạo thanh toán.");
    } finally {
      setLoadingPayment(false);
    }
  };

  // Refund logic
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundTargetPayment, setRefundTargetPayment] = useState(null);
  const [refundTargetAppt, setRefundTargetAppt] = useState(null);

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
      setRefundTargetAppt(appt);
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
      setSuccessMsg("Cảm ơn bạn đã đánh giá dịch vụ!");
      setReviewModalOpen(false);
      setReviewTargetId(null);
      loadData();
    } catch (err) {
      setError(err.message || "Không thể gửi đánh giá.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleConfirmCancel = async (payload) => {
    if (!cancelTargetId) return;
    setCancelling(true);
    setError(null);
    setSuccessMsg("");
    try {
      await appointmentService.cancelAppointment(cancelTargetId, payload);
      setSuccessMsg("Đã hủy lịch khám thành công.");
      setCancelModalOpen(false);
      setCancelTargetId(null);
      setCancelTargetAppt(null);
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
    const filters = {};
    if (keyword) filters.keyword = keyword;
    if (selectedDoctorId) filters.doctorId = selectedDoctorId;
    if (selectedSpecialtyId) filters.departmentId = selectedSpecialtyId;

    if (tab === "calendar") {
      appointmentService
        .getMyAppointments(null, 0, 1000, filters)
        .then((res) => {
          setCalendarData(res.data?.content || res.data || []);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      const upcoming = tab === "upcoming";
      appointmentService
        .getMyAppointments(upcoming, page, pageSize, filters)
        .then((res) => {
          const content = res.data ?? res;
          setData(content);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    setPage(0);
  }, [tab, keyword, selectedDoctorId, selectedSpecialtyId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, page, keyword, selectedDoctorId, selectedSpecialtyId]);

  // Set default selection when data changes
  useEffect(() => {
    if (data?.content && data.content.length > 0) {
      const exists = data.content.some(a => a.appointmentId === selectedApptId);
      if (!exists) {
        setSelectedApptId(data.content[0].appointmentId);
      }
    } else {
      setSelectedApptId(null);
    }
  }, [data, selectedApptId]);

  // Selected appointment object lookup
  const selectedAppt = useMemo(() => {
    if (!data?.content) return null;
    return data.content.find(a => a.appointmentId === selectedApptId) || null;
  }, [data, selectedApptId]);

  // Look up doctor info in the loaded doctors database
  const selectedDocDetails = useMemo(() => {
    if (!selectedAppt || !doctors.length) return null;
    return doctors.find(d => d.doctorId === selectedAppt.doctorId || d.fullName === selectedAppt.doctorName) || null;
  }, [selectedAppt, doctors]);

  const tabs = [
    { key: "upcoming", label: "Lịch hẹn sắp tới", icon: <CalendarDays size={16} /> },
    { key: "history",  label: "Lịch sử khám bệnh", icon: <Clock size={16} /> },
    { key: "calendar", label: "Xem Lịch Tháng", icon: <Calendar size={16} /> },
  ];

  // Calendar logic
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const getDaysArray = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const arr = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let i = 1; i <= days; i++) arr.push(new Date(year, month, i));
    return arr;
  };

  const daysArray = getDaysArray();
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  // Date/Time helper formatters
  const formatApptDate = (dateStr) => {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-1 relative text-slate-800">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shadow-sm">
              <CalendarDays size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lịch hẹn của tôi</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">Xem thông tin chi tiết lịch hẹn sắp tới, lịch sử điều trị và thông tin bác sĩ phụ trách.</p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-bold hover:bg-slate-50 transition-all text-xs shadow-sm cursor-pointer"
        >
          <ArrowLeft size={14} />
          Quay lại tổng quan
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              tab === t.key 
                ? "bg-[#0A604E] text-white shadow-[0_4px_12px_rgba(10,96,78,0.15)]" 
                : "bg-white border border-slate-200 text-[#4A5D59] hover:bg-slate-50"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo mã lịch hẹn, tên bác sĩ..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-transparent border-none px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 font-bold"
          />
        </div>
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={selectedDoctorId} 
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full bg-transparent border-none py-2.5 text-sm outline-none text-slate-700 font-bold cursor-pointer"
          >
            <option value="">Tất cả Bác sĩ</option>
            {doctors.map(d => <option key={d.doctorId} value={d.doctorId}>BS. {d.fullName || d.doctorCode}</option>)}
          </select>
        </div>
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={selectedSpecialtyId} 
            onChange={(e) => setSelectedSpecialtyId(e.target.value)}
            className="w-full bg-transparent border-none py-2.5 text-sm outline-none text-slate-700 font-bold cursor-pointer"
          >
            <option value="">Tất cả Chuyên khoa</option>
            {specialties.map(s => <option key={s.departmentId} value={s.departmentId}>{s.departmentName}</option>)}
          </select>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="flex items-center gap-2 mb-4 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3 text-rose-700 text-xs font-bold">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-emerald-800 text-xs font-bold">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {/* Main content grid */}
      <div className="w-full flex-1 min-h-0">
        {loading && !data && (
          <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
          </div>
        )}

        {!loading && tab !== "calendar" && data && (
          <>
            {data.content?.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Appointments List (5/12 width) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {data.content.map((appt) => {
                    const isSelected = appt.appointmentId === selectedApptId;
                    const dateDisplay = formatApptDate(appt.appointmentDate);
                    const timeDisplay = appt.startTime ? appt.startTime.substring(0, 5) : "—";
                    
                    return (
                      <button
                        key={appt.appointmentId}
                        onClick={() => setSelectedApptId(appt.appointmentId)}
                        className={`w-full text-left bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                          isSelected 
                            ? "border-[#1DB896] shadow-md ring-1 ring-[#1DB896]/20 bg-teal-50/5" 
                            : "border-slate-200/80 hover:border-slate-350 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1DB896]"></div>
                        )}
                        
                        {/* Header Row: Highlight Date & Time, and keep Status Badge */}
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                            <CalendarDays size={16} className="text-[#1DB896] shrink-0" />
                            <span>{dateDisplay} • {timeDisplay}</span>
                          </div>
                          <StatusBadge status={appt.status} />
                        </div>

                        <div className="h-px bg-slate-100 w-full"></div>

                        {/* Doctor Section (Highlighted) */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shrink-0">
                            <User size={14} className="text-[#1DB896]" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block leading-none mb-0.5">Bác sĩ đảm nhiệm</span>
                            <span className="text-xs font-black text-slate-800">BS. {appt.doctorName}</span>
                          </div>
                        </div>

                        <div className="h-px bg-slate-50 w-full"></div>

                        {/* Footer Row: Patient & Appointment Code (Subtle detail) */}
                        <div className="flex justify-between items-center text-[10px] text-[#4A5D59] font-bold">
                          <div>
                            <span className="text-slate-450 font-semibold">Bệnh nhân: </span>
                            <span className="text-slate-700 font-black truncate max-w-[130px] inline-block align-middle">{appt.patientName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-450 font-semibold">Mã: </span>
                            <span className="text-slate-500 font-bold font-mono">{appt.appointmentCode}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Pagination */}
                  {data.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-4 mb-4">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={data.page === 0}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        <ChevronLeft size={16} className="text-slate-600" />
                      </button>
                      <span className="text-xs font-bold text-[#4A5D59]">
                        Trang {data.page + 1} / {data.totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={data.last}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        <ChevronRight size={16} className="text-slate-600" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column: Sticky Detail Panel & Doctor Information (7/12 width) */}
                <div className="lg:col-span-7 sticky top-6">
                  {selectedAppt ? (
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 animate-[fadeIn_0.25s_ease]">
                      
                      {/* Section Title */}
                      <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết đặt hẹn</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200/50">
                              #{selectedAppt.appointmentCode}
                            </span>
                          </div>
                          {/* Large Highlighted Date & Time */}
                          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                            <CalendarDays size={18} className="text-[#1DB896] shrink-0" />
                            <span>{formatApptDate(selectedAppt.appointmentDate)}</span>
                            <span className="text-slate-350 font-normal">|</span>
                            <Clock size={16} className="text-[#1DB896] shrink-0" />
                            <span>{selectedAppt.startTime?.substring(0, 5)} - {selectedAppt.endTime?.substring(0, 5)}</span>
                          </h2>
                        </div>
                        <StatusBadge status={selectedAppt.status} />
                      </div>

                      {/* Info Block */}
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                        <div>
                          <span className="text-[#4A5D59] font-bold block mb-1">Hình thức khám</span>
                          <strong className="text-slate-800 font-black text-xs block">
                            {selectedAppt.bookingType === "ONLINE" ? "Trực tuyến" : "Trực tiếp tại phòng khám"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#4A5D59] font-bold block mb-1">Hồ sơ khám cho</span>
                          <strong className="text-slate-800 font-black text-xs block">{selectedAppt.patientName}</strong>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[#4A5D59] font-bold block mb-1">Lý do khám bệnh</span>
                          <div className="bg-white border border-slate-200 rounded-xl p-3 text-slate-700 font-semibold leading-relaxed">
                            {selectedAppt.reasonForVisit || "Không có mô tả chi tiết"}
                          </div>
                        </div>

                        {selectedAppt.status === "CANCELLED" && selectedAppt.cancellationReason && (
                          <div className="col-span-2 bg-rose-50 border border-rose-100 rounded-xl p-3">
                            <span className="text-rose-700 font-black block mb-0.5">Lý do hủy lịch:</span>
                            <span className="text-rose-700 font-bold">{selectedAppt.cancellationReason}</span>
                          </div>
                        )}
                      </div>

                      {/* Doctor Info Detail Box (Requirement: "1 phần hiện cả thông tin của bác sĩ từng lịch nữa") */}
                      <div className="border-t border-slate-100 pt-5">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <User size={14} className="text-[#1DB896]" /> Bác sĩ đảm nhiệm
                        </h3>
                        
                        <div className="bg-[#F0F9F7] border border-[#1DB896]/10 rounded-2xl p-4 flex gap-4 items-start relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-[#1DB896]/5 rounded-full blur-2xl"></div>
                          
                          {/* Doctor Avatar */}
                          <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {selectedDocDetails?.avatarUrl ? (
                              <img src={selectedDocDetails.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <img 
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedAppt.doctorId || 1}&backgroundColor=e2e8f0`} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          {/* Doctor details */}
                          <div className="flex-1 min-w-0 flex flex-col">
                            <h4 className="font-black text-slate-800 text-sm">
                              {selectedDocDetails?.degree ? `${selectedDocDetails.degree}. ` : "BS. "}{selectedAppt.doctorName}
                            </h4>
                            <p className="text-[11px] font-extrabold text-[#198E75]">
                              Chuyên khoa {selectedDocDetails?.departmentName || selectedDocDetails?.specialization || "Khám Tổng quát"}
                            </p>
                            
                            {/* Experience and ratings */}
                            <div className="flex items-center gap-3 text-[10px] font-bold text-[#4A5D59] mt-2">
                              <span className="flex items-center gap-1">
                                <Activity size={12} className="text-[#1DB896]" />
                                {selectedDocDetails?.yearsOfExperience || 10} năm kinh nghiệm
                              </span>
                              <span className="flex items-center gap-1">
                                <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                                {(selectedAppt.doctorId ? (selectedAppt.doctorId % 3 === 0 ? 5.0 : selectedAppt.doctorId % 2 === 0 ? 4.8 : 4.9) : 4.9).toFixed(1)}/5.0
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={12} className="text-[#1DB896]" />
                                {selectedAppt.doctorId ? `Phòng ${300 + (selectedAppt.doctorId % 20)}` : "Phòng 402"}
                              </span>
                            </div>
                            
                            {/* Short bio if available */}
                            {(selectedDocDetails?.biography || selectedDocDetails?.yearOfBirth || selectedDocDetails?.hometown) && (
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-2.5 border-t border-slate-200/50 pt-2">
                                {selectedDocDetails?.yearOfBirth && <span className="font-bold text-[#1DB896] mr-2">Sinh năm: {selectedDocDetails.yearOfBirth}</span>}
                                {selectedDocDetails?.hometown && <span className="font-bold text-[#1DB896] mr-2">Quê quán: {selectedDocDetails.hometown}</span>}
                                {selectedDocDetails?.yearOfBirth || selectedDocDetails?.hometown ? <br/> : null}
                                {selectedDocDetails.biography}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons footer */}
                      <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-slate-100">
                        {selectedAppt.status === "CANCELLED" && (
                          <button
                            onClick={() => handleRefundRequest(selectedAppt)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-650 hover:bg-red-100 text-xs font-black transition-colors cursor-pointer"
                          >
                            Yêu cầu hoàn trả phí giữ chỗ
                          </button>
                        )}
                        
                        {(selectedAppt.status === "CONFIRMED" || selectedAppt.status === "PENDING_PAYMENT") && (
                          <>
                            {new Date() < new Date(`${selectedAppt.appointmentDate}T${selectedAppt.startTime}`) ? (
                              <>
                                {selectedAppt.status === "PENDING_PAYMENT" && (
                                  <button
                                    onClick={() => handleStartOnlinePayment(selectedAppt)}
                                    disabled={loadingPayment}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-black transition-colors cursor-pointer animate-pulse"
                                  >
                                    <Coins size={12} className="text-amber-500" />
                                    {loadingPayment ? "Đang xử lý..." : "Thanh toán cọc"}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRescheduleRequest(selectedAppt)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-black transition-colors cursor-pointer"
                                >
                                  <RefreshCw size={12} />
                                  Dời lịch khám
                                </button>
                                <button
                                  onClick={() => handleCancelRequest(selectedAppt)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-black transition-colors cursor-pointer"
                                >
                                  <XCircle size={12} />
                                  Hủy lịch khám
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-amber-500 italic font-bold py-2">
                                Đã quá khung giờ bắt đầu khám
                              </span>
                            )}
                          </>
                        )}

                        {selectedAppt.status === "COMPLETED" && selectedAppt.hasReviewed && (
                          <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1 py-2">
                            ✓ Bạn đã gửi đánh giá dịch vụ
                          </span>
                        )}

                        {selectedAppt.status === "COMPLETED" && !selectedAppt.hasReviewed && (
                          <button
                            onClick={() => handleReviewRequest(selectedAppt.appointmentId)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-black transition-colors cursor-pointer"
                          >
                            <MessageSquarePlus size={12} />
                            Viết đánh giá trải nghiệm
                          </button>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold">
                      Chọn một lịch hẹn ở cột bên trái để xem đầy đủ chi tiết lịch khám.
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}

        {/* Monthly Calendar View */}
        {!loading && !error && tab === "calendar" && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="text-md font-black text-slate-800">
                {monthNames[currentMonth.getMonth()]} Năm {currentMonth.getFullYear()}
              </h3>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 transition-colors cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 transition-colors cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day, idx) => (
                <div key={idx} className="text-center font-black text-slate-400 text-xs py-2 tracking-wider">
                  {day}
                </div>
              ))}
              
              {daysArray.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="h-28 rounded-2xl bg-slate-50/50 border border-slate-100/50"></div>;
                }

                const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const dayAppointments = calendarData.filter(appt => appt.appointmentDate === dayStr);
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <div key={idx} className={`h-28 flex flex-col p-2 rounded-2xl border transition-all ${isToday ? 'bg-teal-50/30 border-[#1DB896]' : 'bg-white border-slate-150 hover:bg-slate-50'}`}>
                    <span className={`text-xs font-black mb-1.5 ${isToday ? 'text-[#0A604E]' : 'text-[#4A5D59]'}`}>
                      {date.getDate()}
                    </span>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
                      {dayAppointments.map(appt => (
                        <div 
                          key={appt.appointmentId} 
                          className="text-[10px] leading-snug p-1 rounded-lg bg-[#F0F9F7] text-teal-800 truncate border border-[#1DB896]/10 cursor-pointer hover:bg-[#D1F2EB] transition-colors font-bold"
                          title={`${appt.startTime.substring(0, 5)} - BS. ${appt.doctorName}`}
                          onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/appointments/${appt.appointmentId}`); }}
                        >
                          <span className="text-[#198E75] font-black mr-1">{appt.startTime.substring(0, 5)}</span>
                          BS.{appt.doctorName.split(' ').pop()}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <CancelModal
        isOpen={cancelModalOpen}
        onClose={() => { if (!cancelling) setCancelModalOpen(false); }}
        onConfirm={handleConfirmCancel}
        busy={cancelling}
        appointment={cancelTargetAppt}
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
        appointment={refundTargetAppt}
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

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        paymentData={activePaymentData}
        onPaymentSuccess={() => {
          setSuccessMsg("Thanh toán cọc thành công! Lịch hẹn đã được xác nhận.");
          loadData();
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
