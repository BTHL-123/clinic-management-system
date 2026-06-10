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
    <section className={`${isPatientMode ? "patient-glass-panel rounded-[2rem]" : "patient-glass-card"} p-6 md:p-8 w-full shadow-2xl`}>
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 shrink-0 bg-black/5 flex items-center justify-center text-3xl font-extrabold text-slate-900 shadow-lg">
          {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{initials}</span>}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold patient-section-title mb-1">Thông tin tài khoản</h2>
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
            <label htmlFor="accountFullName" className="text-sm font-bold patient-label">Họ và tên</label>
            <input
              id="accountFullName"
              className="patient-glass-input px-4 py-2.5 focus:border-teal-400 !text-black"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountPhone" className="text-sm font-bold patient-label">Số điện thoại</label>
            <input
              id="accountPhone"
              className="patient-glass-input px-4 py-2.5 focus:border-teal-400 !text-black"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountEmail" className="text-sm font-bold patient-label">Email</label>
            <input id="accountEmail" className="patient-glass-input px-4 py-2.5 disabled:opacity-60" value={user?.email || ""} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountRoles" className="text-sm font-bold patient-label">Vai trò</label>
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
  const roles = user?.roles?.map((r) => r.roleName || r) || [];
  const isDoctor = roles.includes("DOCTOR");
  const isPharmacist = roles.includes("PHARMACIST");
  const isLabTechnician = roles.includes("LAB_TECHNICIAN");
  const isPatientOnly = roles.includes("PATIENT") && !isDoctor && !isPharmacist && !isLabTechnician;
  const isAdminShell = roles.includes("ADMIN") && !isDoctor && !isPharmacist && !isPatientOnly && !isLabTechnician;
  const usePatientVisualShell = isPatientOnly || isAdminShell || isPharmacist || isLabTechnician;

  return (
    <div className={usePatientVisualShell ? "max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10" : "max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10"}>
      <style>{`
        .field label {
          color: #0f766e !important;
          font-weight: 700 !important;
        }
        .patient-glass-card h3, .patient-glass-panel h3 {
          color: #0f766e !important;
        }
        .patient-glass-input, .patient-glass-input-clear input, .patient-glass-input select, .patient-glass-input textarea {
          color: #000000 !important;
        }
        .page-title, .page-title span, h2.inline-flex span, h2 span, h1 span {
          color: #0f766e !important;
        }
      `}</style>
      <div className="w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px] mt-4">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          <button
            onClick={() => navigate("/dashboard", { state: { activeClusterId: "settings" } })}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
        <div className="flex flex-col items-center text-center mt-2 w-full px-4">
          <h1 className={usePatientVisualShell
            ? "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-[#0f766e] tracking-tight mb-4"
            : "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-[#0f766e] tracking-tight mb-4"}
          >
            <UserSquare size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md">Hồ sơ của tôi</span>
          </h1>
          <p className={usePatientVisualShell ? "text-white/80 font-bold drop-shadow-sm text-[16px] max-w-[600px]" : "text-white/70 font-medium drop-shadow-sm text-[16px] max-w-[600px]"}>
            Cập nhật thông tin cá nhân, avatar và xem hồ sơ theo vai trò.
          </p>
        </div>
      </div>

      <div className={usePatientVisualShell ? "w-full max-w-[800px] flex flex-col gap-8 mb-10" : "w-full max-w-[800px] flex flex-col gap-8"}>
        <AccountProfileCard isPatientMode={usePatientVisualShell} />
        {roles.includes("PATIENT") && <PatientProfile />}
        {roles.includes("DOCTOR") && <DoctorProfile />}
      </div>
    </div>
  );
}
