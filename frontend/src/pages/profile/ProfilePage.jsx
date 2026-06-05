import { useState } from "react";
import { Camera, Save, UserSquare, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import PatientProfile from "../patient/PatientProfile";
import DoctorProfile from "../doctor/DoctorProfile";

function AccountProfileCard() {
  const { user, updateCurrentUser, uploadCurrentUserAvatar } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const initials = (form.fullName || user?.email || "AI")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await updateCurrentUser(form);
      setNotice("Cập nhật thông tin tài khoản thành công.");
    } catch (err) {
      setError(err.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setError("");
    setNotice("");
    setUploadingAvatar(true);
    try {
      const updatedUser = await uploadCurrentUserAvatar(file);
      setAvatarUrl(updatedUser.avatarUrl || "");
      setNotice("Cập nhật avatar thành công.");
    } catch (err) {
      setError(err.message || "Không thể upload avatar.");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  return (
    <section className="patient-glass-card profile-panel p-6 md:p-8">
      <div className="profile-avatar-block">
        <div className="user-avatar large">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Thông tin tài khoản</h2>
          <p className="muted mb-0">Thông tin này áp dụng cho mọi vai trò đăng nhập.</p>
          <label className="ghost-button avatar-upload-button">
            <Camera size={16} />
            {uploadingAvatar ? "Đang tải ảnh..." : "Chọn avatar"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarChange} disabled={uploadingAvatar} />
          </label>
        </div>
      </div>
      <form className="form-stack" onSubmit={handleSubmit}>
        {error && <div className="error-box">{error}</div>}
        {notice && <div className="success-box">{notice}</div>}
        <div className="profile-grid">
          <div className="field">
            <label htmlFor="accountFullName">Họ và tên</label>
            <input
              id="accountFullName"
              className="patient-glass-input"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="accountPhone">Số điện thoại</label>
            <input
              id="accountPhone"
              className="patient-glass-input"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="accountEmail">Email</label>
            <input id="accountEmail" className="patient-glass-input disabled:opacity-60" value={user?.email || ""} disabled />
          </div>
          <div className="field">
            <label htmlFor="accountRoles">Vai trò</label>
            <input id="accountRoles" className="patient-glass-input disabled:opacity-60" value={user?.roles?.join(", ") || ""} disabled />
          </div>
        </div>
        <div className="form-actions">
          <button className="primary-button compact" type="submit" disabled={submitting}>
            <Save size={16} />
            {submitting ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roles = user?.roles || [];

  return (
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10">
      <div className="w-full mb-10 flex flex-col items-center">
        <button 
          onClick={() => navigate("/dashboard", { state: { activeClusterId: "settings" } })}
          className="self-start inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 hover:bg-white text-teal-900 font-extrabold border border-white shadow-md rounded-full hover:shadow-lg hover:-translate-x-0.5 transition-all duration-300 group"
        >
          <div className="bg-teal-100/80 p-1.5 rounded-full text-teal-700 group-hover:bg-teal-200 transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Quay lại Màn hình chính
        </button>
        <div className="flex flex-col items-center text-center mt-2">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <UserSquare size={32} className="text-teal-300 drop-shadow-md" />
            <span className="drop-shadow-md">Hồ sơ của tôi</span>
          </h1>
          <p className="text-teal-50/90 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            Cập nhật thông tin cá nhân, avatar và xem hồ sơ theo vai trò.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[800px] flex flex-col gap-8">
        <AccountProfileCard />
        {roles.includes("PATIENT") && <PatientProfile />}
        {roles.includes("DOCTOR") && <DoctorProfile />}
      </div>
    </div>
  );
}
