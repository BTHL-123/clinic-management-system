import { useState } from "react";
import { Camera, Save, UserSquare, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import PatientProfile from "../patient/PatientProfile";
import DoctorProfile from "../doctor/DoctorProfile";

function AccountProfileCard({ isPatientMode }) {
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
    <section className="patient-glass-card p-6 md:p-8 w-full shadow-2xl">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 shrink-0 bg-black/5 flex items-center justify-center text-3xl font-extrabold text-slate-900 shadow-lg">
          {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{initials}</span>}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Thông tin tài khoản</h2>
          <p className="text-slate-700 mb-4 text-sm font-semibold">Thông tin này áp dụng cho mọi vai trò đăng nhập.</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-black/5 hover:bg-black/10 text-slate-900 transition-colors cursor-pointer text-sm font-bold w-fit mx-auto md:mx-0">
            <Camera size={16} />
            {uploadingAvatar ? "Đang tải ảnh..." : "Chọn avatar"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarChange} disabled={uploadingAvatar} className="hidden" />
          </label>
        </div>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {error && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-800 p-3 rounded-xl text-sm font-bold">{error}</div>}
        {notice && <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-800 p-3 rounded-xl text-sm font-bold">{notice}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountFullName" className="text-sm font-bold text-slate-800">Họ và tên</label>
            <input
              id="accountFullName"
              className="patient-glass-input px-4 py-2.5 focus:border-teal-400"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountPhone" className="text-sm font-bold text-slate-800">Số điện thoại</label>
            <input
              id="accountPhone"
              className="patient-glass-input px-4 py-2.5 focus:border-teal-400"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountEmail" className="text-sm font-bold text-slate-800">Email</label>
            <input id="accountEmail" className="patient-glass-input px-4 py-2.5 disabled:opacity-60" value={user?.email || ""} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountRoles" className="text-sm font-bold text-slate-800">Vai trò</label>
            <input id="accountRoles" className="patient-glass-input px-4 py-2.5 disabled:opacity-60" value={user?.roles?.join(", ") || ""} disabled />
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold transition-colors shadow-lg shadow-teal-500/30 flex items-center gap-2 disabled:opacity-50" type="submit" disabled={submitting}>
            <Save size={18} />
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
  const isPatientMode = roles.includes("PATIENT");

  return (
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10">
      <div className="w-full mb-10 flex flex-col items-center">
        <button
          onClick={() => navigate("/dashboard", { state: { activeClusterId: "settings" } })}
          className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm self-start"
        >
          <ArrowLeft size={18} />
          Quay lại Màn hình chính
        </button>
        <div className="flex flex-col items-center text-center mt-2">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <UserSquare size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md">Hồ sơ của tôi</span>
          </h1>
          <p className="text-white/70 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            Cập nhật thông tin cá nhân, avatar và xem hồ sơ theo vai trò.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[800px] flex flex-col gap-8">
        <AccountProfileCard isPatientMode={isPatientMode} />
        {roles.includes("PATIENT") && <PatientProfile />}
        {roles.includes("DOCTOR") && <DoctorProfile />}
      </div>
    </div>
  );
}
