import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyDoctorProfile, updateDoctor } from "../../services/doctorService";
import { changePassword } from "../../services/authService";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast.js";
import {
  User, Award, ShieldAlert, Key, ClipboardList, Phone, Mail,
  MapPin, Camera, ShieldCheck, Bell, Settings, Lock, RotateCcw,
  HelpCircle, Plus, X
} from "lucide-react";

export default function DoctorProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, updateCurrentUser, uploadCurrentUserAvatar } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Profile fields state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Doctor professional fields state
  const [specialization, setSpecialization] = useState("");
  const [degree, setDegree] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [doctorCode, setDoctorCode] = useState("");
  const [biography, setBiography] = useState("");

  // Interactive certificates tags
  const [certificates, setCertificates] = useState(() => {
    const saved = localStorage.getItem("doctor_certs");
    return saved ? JSON.parse(saved) : ["Học viện Quân Y", "Cardiology Specialization (USA)", "Robotic Surgery Cert."];
  });
  const [newCert, setNewCert] = useState("");

  // Password fields
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updatingPass, setUpdatingPass] = useState(false);
  const [strengthScore, setStrengthScore] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getMyDoctorProfile();
        const profData = res.data || res;
        setProfile(profData);
        setSpecialization(profData.specialization || "");
        setDegree(profData.degree || "");
        setYearsOfExperience(profData.yearsOfExperience || 0);
        setDoctorCode(profData.doctorCode || "");
        setBiography(profData.biography || "");
        setError("");
        setNotFound(false);
      } catch (err) {
        if (err.response?.status === 404 || err.message?.includes("404")) {
          setNotFound(true);
        } else {
          setError(err.message || "Không thể tải thông tin hồ sơ.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Save certificates changes locally
  useEffect(() => {
    localStorage.setItem("doctor_certs", JSON.stringify(certificates));
  }, [certificates]);

  // Password strength logic
  const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 6) score += 1;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const getStrengthConfig = (score) => {
    switch (score) {
      case 1:
        return { label: "Yếu", color: "text-rose-500", bg: "bg-rose-500" };
      case 2:
        return { label: "Trung bình", color: "text-amber-500", bg: "bg-amber-500" };
      case 3:
        return { label: "Mạnh", color: "text-emerald-500", bg: "bg-emerald-500" };
      default:
        return { label: "Rất yếu", color: "text-slate-400", bg: "bg-slate-200" };
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "newPassword") {
        setStrengthScore(calculateStrength(value));
      }
      return next;
    });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast?.error("Mật khẩu mới và nhập lại không trùng khớp.");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast?.error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    try {
      setUpdatingPass(true);
      await changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      toast?.success("Cập nhật mật khẩu thành công!");
      setPasswords({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStrengthScore(0);
    } catch (err) {
      toast?.error(err.response?.data?.message || err.message || "Đổi mật khẩu thất bại.");
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const updatedUser = await uploadCurrentUserAvatar(file);
      setAvatarUrl(updatedUser.avatarUrl || "");
      toast?.success("Cập nhật ảnh đại diện thành công.");
    } catch (err) {
      toast?.error(err.message || "Không thể upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddCert = (e) => {
    e.preventDefault();
    if (newCert.trim() && !certificates.includes(newCert.trim())) {
      setCertificates([...certificates, newCert.trim()]);
      setNewCert("");
    }
  };

  const handleRemoveCert = (certToRemove) => {
    setCertificates(certificates.filter(c => c !== certToRemove));
  };

  const handleSaveAllProfile = async () => {
    setSavingProfile(true);
    try {
      // 1. Update basic user account info (Họ tên, SĐT)
      await updateCurrentUser({
        fullName,
        phone
      });

      // 2. Update professional doctor profile info
      if (profile) {
        await updateDoctor(profile.doctorId, {
          userId: profile.userId,
          departmentId: profile.departmentId,
          doctorCode: doctorCode || profile.doctorCode,
          degree,
          specialization,
          yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
          biography,
          consultationFee: profile.consultationFee,
          status: profile.status
        });
      }

      toast?.success("Lưu thay đổi hồ sơ thành công!");
    } catch (err) {
      toast?.error(err.response?.data?.message || err.message || "Có lỗi xảy ra khi lưu thông tin.");
    } finally {
      setSavingProfile(false);
    }
  };

  const strCfg = getStrengthConfig(strengthScore);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px] text-slate-400 font-bold animate-pulse text-xs">
        Đang tải thông tin hồ sơ...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-center text-rose-600 font-extrabold text-sm max-w-xl mx-auto flex items-center gap-3 justify-center mt-10">
        <ShieldAlert size={20} />
        Tài khoản chưa liên kết với thông tin Bác sĩ. Vui lòng liên hệ Admin.
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-center text-rose-600 font-extrabold text-sm max-w-xl mx-auto flex items-center gap-3 justify-center mt-10">
        <ShieldAlert size={20} />
        {error}
      </div>
    );
  }

  const initials = (fullName || user?.email || "DR")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 relative pb-8">

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100/50 flex items-center justify-center shrink-0">
            <User className="text-teal-600 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">Hồ sơ của tôi</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all relative">
            <Bell size={16} />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          </button>

          <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all">
            <Settings size={16} />
          </button>

          <button
            onClick={handleSaveAllProfile}
            disabled={savingProfile}
            className={`font-extrabold text-xs tracking-wider px-6 py-2.5 rounded-full shadow-md transition-all flex items-center gap-2 active:scale-95 ${savingProfile
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/10"
              }`}
          >
            LƯU THAY ĐỔI
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">

        {/* Left Column: Personal info & credentials (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex flex-col items-center gap-6">

            {/* Avatar block */}
            <div className="relative group mt-4">
              <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50 flex items-center justify-center text-3xl font-black text-slate-800 shadow-sm relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white text-[10px] font-bold">
                    Đang tải...
                  </div>
                )}
              </div>
              <label className="absolute bottom-[-6px] right-[-6px] w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-teal-600 cursor-pointer transition-all hover:scale-105">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>

            {/* Doctor names */}
            <div className="text-center flex flex-col gap-1.5 items-center">
              <div className="text-sm font-black text-slate-800 tracking-tight leading-snug">
                {degree ? `${degree} ` : "BS. "} {fullName}
              </div>
              <span className="px-3 py-1 rounded-full text-[9px] font-black tracking-wider bg-teal-50 text-teal-700 border border-teal-100/50 uppercase">
                • Bác sĩ chính
              </span>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-50" />

            {/* Contact details */}
            <div className="w-full flex flex-col gap-4">
              {/* Phone input */}
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <Phone size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent border-0 p-0 text-xs text-slate-700 font-bold outline-none mt-0.5 focus:underline focus:text-teal-600"
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <Mail size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                  <div className="text-xs text-slate-700 font-bold truncate mt-0.5">{user?.email || "chưa cập nhật"}</div>
                </div>
              </div>

              {/* Department */}
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <MapPin size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Phòng ban</label>
                  <div className="text-xs text-slate-700 font-bold truncate mt-0.5">{profile?.departmentName || "Khoa ngoại tổng quát"}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Professional info & passwords (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">

          {/* Professional Information Card */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 flex flex-col gap-5 shadow-[0_4px_25px_rgba(0,0,0,0.015)] relative">
            <div className="absolute top-6 right-6 text-teal-500/80">
              <ShieldCheck size={28} className="stroke-[1.5]" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">Hồ sơ chuyên môn</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Quản lý các thông tin hành nghề y tế</p>
            </div>

            {/* Form grid fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Chuyên khoa</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-750 font-bold focus:border-teal-500/50 outline-none transition-all"
                  placeholder="Ví dụ: Phẫu thuật Tim mạch..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Số giấy phép (License)</label>
                <input
                  type="text"
                  value={doctorCode}
                  onChange={(e) => setDoctorCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-750 font-bold focus:border-teal-500/50 outline-none transition-all"
                  placeholder="Ví dụ: #MED-2023-009412..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Kinh nghiệm</label>
                <input
                  type="text"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-750 font-bold focus:border-teal-500/50 outline-none transition-all"
                  placeholder="Ví dụ: 15 năm lâm sàng..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Trình độ</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-750 font-bold focus:border-teal-500/50 outline-none transition-all"
                  placeholder="Ví dụ: Tiến sĩ / BS.CKII..."
                />
              </div>
            </div>

            {/* Certifications tags list */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Bằng cấp & Chứng chỉ</label>

              <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                {certificates.map((cert, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-[10px] font-black tracking-wide"
                  >
                    {cert}
                    <button
                      type="button"
                      onClick={() => handleRemoveCert(cert)}
                      className="hover:text-rose-600 transition-all font-bold ml-0.5 text-[9px]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {certificates.length === 0 && (
                  <span className="text-[10px] text-slate-400 font-bold italic py-1">Chưa có chứng chỉ nào</span>
                )}
              </div>

              {/* Add tag form */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCert(e)}
                  className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-750 font-bold focus:border-teal-500/50 outline-none transition-all"
                  placeholder="Thêm chứng chỉ mới..."
                />
                <button
                  type="button"
                  onClick={handleAddCert}
                  className="px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100/50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus size={13} className="stroke-[2.5]" /> Thêm
                </button>
              </div>
            </div>

            {/* Biography Text Area */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Tiểu sử (Bio)</label>
              <textarea
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-[1.5rem] px-4 py-3.5 text-xs text-slate-700 font-medium focus:border-teal-500/50 outline-none transition-all placeholder:text-slate-450 resize-y leading-relaxed"
                placeholder="Giới thiệu về kinh nghiệm chuyên môn và kỹ năng y khoa..."
              />
            </div>

          </div>

          {/* Security & Password Card */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 flex flex-col gap-5 shadow-[0_4px_25px_rgba(0,0,0,0.015)]">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100/60 flex items-center justify-center shrink-0 text-slate-500">
                <RotateCcw size={16} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 tracking-tight">Bảo mật & Mật khẩu</h2>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Cập nhật mật khẩu định kỳ để bảo vệ dữ liệu bệnh nhân</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 mt-2">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwords.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-850 font-bold focus:border-teal-500/50 outline-none transition-all"
                  />
                </div>

                {/* New password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Mật khẩu mới</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-850 font-bold focus:border-teal-500/50 outline-none transition-all"
                  />
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-855 font-bold focus:border-teal-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password strength & Button aligned */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 pt-2">
                {/* Strength Meter */}
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-slate-400 uppercase tracking-wider">Độ mạnh mật khẩu</span>
                    <span className={`${strCfg.color} font-black uppercase`}>{strCfg.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strengthScore >= 1 ? strCfg.bg : "bg-transparent"}`} />
                    <div className={`h-full rounded-full transition-all ${strengthScore >= 2 ? strCfg.bg : "bg-transparent"}`} />
                    <div className={`h-full rounded-full transition-all ${strengthScore >= 3 ? strCfg.bg : "bg-transparent"}`} />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={updatingPass}
                  className={`px-6 py-3 rounded-xl font-extrabold text-[10px] tracking-wider transition-all uppercase ${updatingPass
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      : "bg-[#0A604E] hover:bg-[#084e40] text-white active:scale-95 shadow-sm"
                    }`}
                >
                  {updatingPass ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
              </div>

            </form>
          </div>

          {/* Guidelines Banner */}
          <div className="bg-slate-50/60 border border-slate-200/60 rounded-[1.5rem] p-4 flex items-center justify-center gap-3">
            <HelpCircle size={15} className="text-slate-400" />
            <p className="text-xs text-slate-500 font-bold text-center">
              Cần hỗ trợ về tài khoản? Liên hệ quản trị viên hệ thống.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
