import { useState } from "react";
import { X } from "lucide-react";
import { createRefundRequest } from "../../services/refundService";

export default function RefundRequestModal({ isOpen, onClose, onSuccess, payment }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do hoàn tiền và thông tin nhận tiền.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createRefundRequest({
        paymentId: payment.paymentId,
        refundAmount: payment.amount,
        reason: reason
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi khi gửi yêu cầu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "450px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid #e2e8f0"
        }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.1rem" }}>Yêu cầu hoàn tiền</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              Số tiền hoàn (Tối đa)
            </label>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#dc2626" }}>
              {payment.amount?.toLocaleString("vi-VN")} VND
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              Lý do & Thông tin nhận tiền *
            </label>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>
              Vui lòng nhập lý do và thông tin tài khoản ngân hàng (Tên NH, STK, Chủ TK) để chúng tôi chuyển khoản.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Phòng khám hủy lịch. Vietcombank - 0123456789 - NGUYEN VAN A"
              rows={4}
              style={{
                width: "100%", padding: "10px", borderRadius: "8px",
                border: "1px solid #cbd5e1", outline: "none", resize: "none",
                fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box"
              }}
            />
          </div>

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
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1",
                background: "#fff", cursor: "pointer", fontWeight: 600, color: "#475569"
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy || !reason.trim()}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "none",
                background: (busy || !reason.trim()) ? "#93c5fd" : "#3b82f6",
                color: "#fff", cursor: (busy || !reason.trim()) ? "not-allowed" : "pointer",
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
