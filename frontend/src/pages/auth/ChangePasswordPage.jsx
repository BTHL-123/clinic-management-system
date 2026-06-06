import { useState } from "react";
import { KeyRound, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { changePassword } from "../../services/authService";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPatientMode = user?.roles?.includes("PATIENT");
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
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center">
      <div className="w-full mb-10 flex flex-col items-center">
        <button
          onClick={() => navigate("/dashboard", { state: { activeClusterId: "settings" } })}
          className={isPatientMode
            ? "bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm self-start"
            : "self-start inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 hover:bg-white text-teal-900 font-extrabold border border-white shadow-md rounded-full hover:shadow-lg hover:-translate-x-0.5 transition-all duration-300 group"}
        >
          {isPatientMode ? (
            <ArrowLeft size={18} />
          ) : (
            <div className="bg-teal-100/80 p-1.5 rounded-full text-teal-700 group-hover:bg-teal-200 transition-colors">
              <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
          )}
          Quay lại Màn hình chính
        </button>
        <div className="flex flex-col items-center text-center mt-2">
          <h1 className={isPatientMode
            ? "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4"
            : "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4"}
          >
            <KeyRound size={32} className={isPatientMode ? "text-teal-400 drop-shadow-md" : "text-teal-300 drop-shadow-md"} />
            <span className="drop-shadow-md">Đổi mật khẩu</span>
          </h1>
          <p className={isPatientMode ? "text-white/70 font-medium drop-shadow-sm text-[16px] max-w-[600px]" : "text-teal-50/90 font-medium drop-shadow-sm text-[16px] max-w-[600px]"}>
            Cập nhật mật khẩu tài khoản local của bạn để bảo mật tốt hơn.
          </p>
        </div>
      </div>

      <div className={`${isPatientMode ? "patient-glass-card" : "light-glass-card"} p-6 md:p-8 w-full max-w-[500px] mx-auto mb-10`}>
        <form className="form-stack" onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          {notice && <div className="success-box">{notice}</div>}
          <div className="field">
            <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
            <input
              id="currentPassword"
              type="password"
              className={isPatientMode ? "patient-glass-input" : "light-glass-input"}
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
              className={isPatientMode ? "patient-glass-input" : "light-glass-input"}
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
              className={isPatientMode ? "patient-glass-input" : "light-glass-input"}
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
      </div>
    </div>
  );
}
