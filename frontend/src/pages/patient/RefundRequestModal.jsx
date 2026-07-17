import { useState, useMemo } from "react";
import { X, AlertCircle } from "lucide-react";
import { createRefundRequest } from "../../services/refundService";

export default function RefundRequestModal({ isOpen, onClose, onSuccess, payment, appointment }) {
  const [reason, setReason] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { refundPercentage, computedAmount, isRefundable } = useMemo(() => {
    if (!appointment || !payment) return { refundPercentage: 0, computedAmount: 0, isRefundable: false };

    const apptDateTime = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
    const now = new Date();
    
    const diffMs = apptDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let percentage = 0;
    if (diffHours > 24) {
      percentage = 1;
    } else if (diffHours > 2) {
      percentage = 0.5;
    } else {
      percentage = 0;
    }

    return {
      refundPercentage: percentage,
      computedAmount: payment.amount * percentage,
      isRefundable: percentage > 0
    };
  }, [appointment, payment]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || !bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setError("Vui lòng điền đầy đủ tất cả các trường bắt buộc.");
      return;
    }

    setBusy(true);
    setError(null);

    const fullReason = `Lý do: ${reason.trim()}
Ngân hàng: ${bankName.trim()}
STK: ${accountNumber.trim()}
Tên Chủ TK: ${accountName.trim()}`;

    try {
      await createRefundRequest({
        paymentId: payment.paymentId,
        refundAmount: computedAmount,
        reason: fullReason
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi khi gửi yêu cầu.");
    } finally {
      setBusy(false);
    }
  };

  const isFormValid = reason.trim() && bankName.trim() && accountNumber.trim() && accountName.trim();

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "500px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column",
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, background: "#fff", zIndex: 10
        }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.2rem" }}>Yêu cầu hoàn tiền</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          
          {/* Chính sách hoàn tiền */}
          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#334155", fontWeight: 600 }}>
              <AlertCircle size={18} color="#3b82f6" />
              Chính sách hoàn tiền
            </div>
            <ul style={{ margin: 0, paddingLeft: "24px", color: "#475569", fontSize: "13px", lineHeight: "1.6" }}>
              <li>Hủy trước <strong>&gt; 24 giờ</strong> so với giờ khám: Hoàn <strong>100%</strong></li>
              <li>Hủy từ <strong>2 đến 24 giờ</strong> so với giờ khám: Hoàn <strong>50%</strong></li>
              <li>Hủy <strong>&lt; 2 giờ</strong> hoặc sau giờ khám: <strong>Không hoàn tiền</strong></li>
              <li>Thời gian xử lý: <strong>3 - 5 ngày làm việc</strong>.</li>
            </ul>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", background: isRefundable ? "#eff6ff" : "#fef2f2", padding: "12px", borderRadius: "8px" }}>
            <div>
              <span style={{ display: "block", fontSize: "13px", color: "#64748b" }}>Tỷ lệ hoàn tiền:</span>
              <strong style={{ fontSize: "15px", color: isRefundable ? "#2563eb" : "#dc2626" }}>
                {refundPercentage * 100}%
              </strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ display: "block", fontSize: "13px", color: "#64748b" }}>Số tiền được hoàn:</span>
              <strong style={{ fontSize: "18px", color: isRefundable ? "#2563eb" : "#dc2626" }}>
                {computedAmount.toLocaleString("vi-VN")} VND
              </strong>
            </div>
          </div>

          {!isRefundable ? (
            <div style={{ textAlign: "center", color: "#dc2626", padding: "10px", background: "#fef2f2", borderRadius: "8px", marginBottom: "20px" }}>
              Rất tiếc, bạn đã quá thời hạn để được hoàn tiền.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Ngân hàng thụ hưởng *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="VD: Vietcombank, Techcombank..."
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    Số tài khoản *
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Nhập số tài khoản"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    Tên chủ tài khoản *
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", textTransform: "uppercase" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Lý do hủy/hoàn tiền *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ghi chú lý do bạn muốn hủy lịch hẹn"
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </>
          )}

          {error && (
            <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#475569" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy || !isRefundable || !isFormValid}
              style={{
                padding: "8px 16px", borderRadius: "6px", border: "none",
                background: (busy || !isRefundable || !isFormValid) ? "#93c5fd" : "#2563eb",
                color: "#fff", cursor: (busy || !isRefundable || !isFormValid) ? "not-allowed" : "pointer",
                fontWeight: 600
              }}
            >
              {busy ? "Đang xử lý..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
