import { useState } from "react";
import { KeyRound, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { changePassword } from "../../services/authService";
import PageHeader from "../../components/PageHeader";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = user?.roles?.map((r) => r.roleName || r) || [];
  const isDoctor = roles.includes("DOCTOR");
  const isPharmacist = roles.includes("PHARMACIST");
  const isLabTechnician = roles.includes("LAB_TECHNICIAN");
  const isPatientOnly = roles.includes("PATIENT") && !isDoctor && !isPharmacist && !isLabTechnician;
  const isAdminShell = roles.includes("ADMIN") && !isDoctor && !isPharmacist && !isPatientOnly && !isLabTechnician;
  const usePatientVisualShell = isPatientOnly || isAdminShell || isPharmacist || isLabTechnician;
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
    <div className={usePatientVisualShell ? "max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10" : "max-w-[1100px] mx-auto w-full flex flex-col items-center"}>
      <PageHeader
        title="Đổi mật khẩu"
        icon={KeyRound}
        iconColor="text-white"
        subtitle="Cập nhật mật khẩu tài khoản local của bạn để bảo mật tốt hơn."
        onBack={() => navigate("/dashboard", { state: { activeClusterId: "settings" } })}
      />

      <div className={`${usePatientVisualShell ? "patient-glass-panel rounded-[2rem]" : "light-glass-card"} p-6 md:p-8 w-full max-w-[600px] mb-10`}>
        <form className="form-stack" onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          {notice && <div className="success-box">{notice}</div>}
          <div className="field">
            <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
            <input
              id="currentPassword"
              type="password"
              className={usePatientVisualShell ? "patient-glass-input" : "light-glass-input"}
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
              className={usePatientVisualShell ? "patient-glass-input" : "light-glass-input"}
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
              className={usePatientVisualShell ? "patient-glass-input" : "light-glass-input"}
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
