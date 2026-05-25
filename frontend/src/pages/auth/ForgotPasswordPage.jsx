import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendOtp = async () => {
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await forgotPassword({ email });
      setOtpSent(true);
      setNotice("Mã OTP đặt lại mật khẩu đã được gửi tới email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await resetPassword({ email, otpCode, newPassword });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-visual">
        <div className="brand-lockup">
          <span className="brand-mark">AI</span>
          <span>Clinic Management System</span>
        </div>
        <h1>Lấy lại quyền truy cập tài khoản một cách an toàn.</h1>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Quên mật khẩu</h2>
          <p className="muted">Nhập email để nhận mã OTP đặt lại mật khẩu.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}
            {notice && <div className="success-box">{notice}</div>}
            <div className="field">
              <label htmlFor="forgotEmail">Email</label>
              <input
                id="forgotEmail"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setOtpSent(false);
                }}
                required
              />
            </div>
            {otpSent && (
              <>
                <div className="field">
                  <label htmlFor="forgotOtp">Mã OTP</label>
                  <input
                    id="forgotOtp"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="newPassword">Mật khẩu mới</label>
                  <input
                    id="newPassword"
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Đang xử lý..." : otpSent ? "Đặt lại mật khẩu" : "Gửi OTP"}
            </button>
            {otpSent && (
              <button className="ghost-button" type="button" onClick={handleSendOtp} disabled={submitting}>
                Gửi lại OTP
              </button>
            )}
            <p className="muted">
              <Link className="secondary-link" to="/login">
                Quay lại đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
