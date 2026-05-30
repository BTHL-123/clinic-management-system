import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { processPaymentCallback } from "../../services/paymentService";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("PROCESSING");
  const [errorMsg, setErrorMsg] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const handleCallback = async () => {
      try {
        const paymentCode = searchParams.get("vnp_TxnRef") || searchParams.get("paymentCode") || "";
        const responseCode = searchParams.get("vnp_ResponseCode") || searchParams.get("status") || "";
        const transactionId = searchParams.get("vnp_TransactionNo") || searchParams.get("gatewayTransactionId") || "";

        if (!paymentCode) {
          setStatus("FAILED");
          setErrorMsg("Không tìm thấy mã giao dịch (paymentCode) trong URL.");
          return;
        }

        const isSuccess = responseCode === "00" || responseCode.toUpperCase() === "PAID" || responseCode.toUpperCase() === "SUCCESS";
        const finalStatus = isSuccess ? "PAID" : "FAILED";

        await processPaymentCallback({
          paymentCode,
          status: finalStatus,
          gatewayTransactionId: transactionId
        });

        setStatus(isSuccess ? "SUCCESS" : "FAILED");
      } catch (err) {
        console.error("Callback error", err);
        setStatus("FAILED");
        setErrorMsg(err.message || "Có lỗi xảy ra khi xử lý giao dịch.");
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "75vh",
      padding: "20px"
    }}>
      <div style={{
        background: "#fff",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        textAlign: "center",
        maxWidth: "420px",
        width: "100%"
      }}>
        {status === "PROCESSING" && (
          <>
            <Loader2 size={64} style={{ color: "#3b82f6", margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Đang xử lý giao dịch...</h2>
            <p className="muted">Vui lòng không đóng trình duyệt lúc này.</p>
          </>
        )}

        {status === "SUCCESS" && (
          <>
            <CheckCircle2 size={64} style={{ color: "#10b981", margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "1.5rem", marginBottom: "10px", color: "#10b981" }}>Thanh toán thành công!</h2>
            <p className="muted" style={{ marginBottom: "24px" }}>Giao dịch của bạn đã được ghi nhận.</p>
            <button className="primary-button" style={{ width: "100%" }} onClick={() => navigate("/dashboard/invoices")}>
              Quay lại danh sách Hóa đơn
            </button>
          </>
        )}

        {status === "FAILED" && (
          <>
            <XCircle size={64} style={{ color: "#ef4444", margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "1.5rem", marginBottom: "10px", color: "#ef4444" }}>Thanh toán thất bại</h2>
            <p className="muted" style={{ marginBottom: "24px" }}>{errorMsg || "Giao dịch đã bị hủy hoặc xảy ra lỗi từ cổng thanh toán."}</p>
            <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
              <button className="primary-button" onClick={() => navigate("/dashboard/payments")}>
                Quay lại Quản lý Thanh toán
              </button>
              <button className="secondary-button" onClick={() => navigate("/dashboard/invoices")}>
                Quay lại danh sách Hóa đơn
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
