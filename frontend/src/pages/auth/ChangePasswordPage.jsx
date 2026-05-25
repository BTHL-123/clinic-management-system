import { useState } from "react";
import { KeyRound } from "lucide-react";
import { changePassword } from "../../services/authService";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setNotice("Mật khẩu đã được đổi thành công.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="content-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <KeyRound size={26} />
            Đổi mật khẩu
          </h1>
          <p className="muted">Cập nhật mật khẩu tài khoản local của bạn.</p>
        </div>
      </div>
      <form className="form-stack narrow-form" onSubmit={handleSubmit}>
        {error && <div className="error-box">{error}</div>}
        {notice && <div className="success-box">{notice}</div>}
        <div className="field">
          <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
          <input
            id="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="changeNewPassword">Mật khẩu mới</label>
          <input
            id="changeNewPassword"
            type="password"
            minLength={6}
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
          <input
            id="confirmPassword"
            type="password"
            minLength={6}
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            required
          />
        </div>
        <button className="primary-button compact" type="submit" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
      </form>
    </section>
  );
}
