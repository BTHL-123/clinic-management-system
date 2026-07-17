import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo.jsx";
import { forgotPassword, resetPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", otpCode: "", newPassword: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await forgotPassword({ email: form.email });
      setStep(2);
      setNotice("Mã OTP đã được gửi tới email của bạn.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await resetPassword({ 
        email: form.email, 
        otpCode: form.otpCode, 
        newPassword: form.newPassword 
      });
      setNotice("Đổi mật khẩu thành công. Bạn có thể đăng nhập ngay.");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
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
          <Logo size={52} textColor="#0f4a8a" />
        </div>
        <h1>Lấy lại quyền truy cập tài khoản một cách an toàn.</h1>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Quên mật khẩu</h2>
          <p className="muted">Nhập email để nhận mã xác thực (OTP).</p>
          {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
          {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
          
          {step === 1 && (
            <form className="form-stack" onSubmit={handleSendOtp}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </div>
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="form-stack" onSubmit={handleReset}>
              <div className="field">
                <label htmlFor="otpCode">Mã OTP</label>
                <input
                  id="otpCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.otpCode}
                  onChange={(event) => setForm({ ...form, otpCode: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="newPassword">Mật khẩu mới</label>
                <input
                  id="newPassword"
                  type="password"
                  minLength={6}
                  value={form.newPassword}
                  onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                  required
                />
              </div>
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
              <button className="ghost-button" type="button" onClick={() => setStep(1)} disabled={submitting}>
                Quay lại
              </button>
            </form>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link className="secondary-link" to="/login">Trở lại Đăng nhập</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
