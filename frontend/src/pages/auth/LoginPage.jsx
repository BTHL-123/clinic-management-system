import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate("/dashboard", { replace: true });
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
        <h1>Điều phối vận hành phòng khám từ một màn hình rõ ràng.</h1>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Đăng nhập</h2>
          <p className="muted">Dùng tài khoản được cấp để vào hệ thống.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}
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
            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            <p className="muted">
              Chưa có tài khoản bệnh nhân?{" "}
              <Link className="secondary-link" to="/register">
                Đăng ký
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
