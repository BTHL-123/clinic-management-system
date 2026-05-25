import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, sendRegisterOtp } from "../../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    gender: "OTHER",
    dateOfBirth: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendOtp = async () => {
    setError("");
    setNotice("");
    if (!form.email) {
      setError("Vui lòng nhập email trước khi lấy mã OTP.");
      return;
    }
    setSubmitting(true);
    try {
      await sendRegisterOtp({ email: form.email });
      setOtpSent(true);
      setNotice("Mã OTP đã được gửi tới email của bạn.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!otpSent) {
      await handleSendOtp();
      return;
    }
    setSubmitting(true);
    try {
      await register({ ...form, dateOfBirth: form.dateOfBirth || null, otpCode });
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
        <h1>Đặt nền cho hành trình khám bệnh gọn hơn.</h1>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Đăng ký bệnh nhân</h2>
          <p className="muted">Tạo hồ sơ ban đầu để đặt lịch online.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}
            {notice && <div className="success-box">{notice}</div>}
            <div className="field">
              <label htmlFor="fullName">Họ tên</label>
              <input
                id="fullName"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm({ ...form, email: event.target.value });
                  setOtpSent(false);
                  setOtpCode("");
                }}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                minLength={6}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Số điện thoại</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="gender">Giới tính</label>
              <select
                id="gender"
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="dateOfBirth">Ngày sinh</label>
              <input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
              />
            </div>
            {otpSent && (
              <div className="field">
                <label htmlFor="otpCode">Mã OTP email</label>
                <input
                  id="otpCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  required
                />
              </div>
            )}
            <button className="ghost-button" type="button" onClick={handleSendOtp} disabled={submitting}>
              {otpSent ? "Gửi lại OTP" : "Gửi OTP"}
            </button>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Đang xử lý..." : otpSent ? "Xác thực và đăng ký" : "Gửi OTP để đăng ký"}
            </button>
            <p className="muted">
              Đã có tài khoản?{" "}
              <Link className="secondary-link" to="/login">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
