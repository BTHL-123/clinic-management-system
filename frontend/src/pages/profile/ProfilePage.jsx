import { useState } from "react";
import { Camera, Save, UserSquare } from "lucide-react";
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
    <section className="panel profile-panel">
      <div className="profile-avatar-block">
        <div className="user-avatar large">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
        </div>
        <div>
          <h2>Thông tin tài khoản</h2>
          <p className="muted">Thông tin này áp dụng cho mọi vai trò đăng nhập.</p>
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
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="accountPhone">Số điện thoại</label>
            <input
              id="accountPhone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="accountEmail">Email</label>
            <input id="accountEmail" value={user?.email || ""} disabled />
          </div>
          <div className="field">
            <label htmlFor="accountRoles">Vai trò</label>
            <input id="accountRoles" value={user?.roles?.join(", ") || ""} disabled />
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
  const roles = user?.roles || [];

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserSquare size={26} />
            Hồ sơ của tôi
          </h1>
          <p className="muted">Cập nhật thông tin cá nhân, avatar và xem hồ sơ theo vai trò.</p>
        </div>
      </div>
      <AccountProfileCard />
      {roles.includes("PATIENT") && <PatientProfile />}
      {roles.includes("DOCTOR") && <DoctorProfile />}
    </div>
  );
}
