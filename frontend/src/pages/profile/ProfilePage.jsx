import { useState } from "react";
import { Camera, Save, UserSquare, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import PatientProfile from "../patient/PatientProfile";
import DoctorProfile from "../doctor/DoctorProfile";
import PageHeader from "../../components/PageHeader";

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
    <section className={`${isPatientMode ? "bg-white rounded-3xl border border-slate-200 shadow-sm" : "patient-glass-card"} p-6 md:p-8 w-full`}>
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
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountPhone" className="text-sm font-bold patient-label">Số điện thoại</label>
            <input
              id="accountPhone"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountEmail" className="text-sm font-bold patient-label">Email</label>
            <input id="accountEmail" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" value={user?.email || ""} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountRoles" className="text-sm font-bold patient-label">Vai trò</label>
            <input id="accountRoles" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" value={user?.roles?.join(", ") || ""} disabled />
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
  const isReceptionistOnly = roles.includes("RECEPTIONIST") && !roles.includes("ADMIN");
  const isAdminShell = roles.includes("ADMIN") && !isDoctor && !isPharmacist && !isPatientOnly && !isLabTechnician;
  const usePatientVisualShell = isPatientOnly || isReceptionistOnly || isAdminShell || isPharmacist || isLabTechnician;

  if (isDoctor) {
    return <DoctorProfile />;
  }

  return (
    <div className={usePatientVisualShell ? "w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pb-8 pr-2" : "max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10"}>
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
        .page-title, .page-title span, h2.inline-flex span, h2 span {
          color: #0f766e !important;
        }
      `}</style>
      <PageHeader
        title="Hồ sơ của tôi"
        icon={UserSquare}
        iconColor="text-teal-400"
        subtitle={
          <span className={usePatientVisualShell ? "text-slate-500 font-bold" : "text-white/70 font-medium"}>
            Cập nhật thông tin cá nhân, avatar và xem hồ sơ theo vai trò.
          </span>
        }
        onBack={() => navigate("/dashboard", { state: { activeClusterId: "settings" } })}
      />

      <div className={usePatientVisualShell ? "w-full max-w-[800px] flex flex-col gap-8 mb-10" : "w-full max-w-[800px] flex flex-col gap-8"}>
        <AccountProfileCard isPatientMode={usePatientVisualShell} />
        {roles.includes("PATIENT") && <PatientProfile />}
        {roles.includes("DOCTOR") && <DoctorProfile />}
      </div>
    </div>
  );
}
