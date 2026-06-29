import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Eye, Plus, Search, Trash2, Users, X, ClipboardList, ArrowLeft } from "lucide-react";
import {
  createPatient,
  deletePatient,
  getPatients,
  updatePatient,
} from "../../services/patientService";
import { getUsers } from "../../services/userService";
import MedicalHistory from "../../components/MedicalHistory";
import { useAuth } from "../../context/useAuth";

const EMPTY_FORM = {
  userId: "",
  patientCode: "",
  fullName: "",
  gender: "OTHER",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  identityNumber: "",
  insuranceNumber: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  bloodType: "",
  allergies: "",
  medicalHistory: "",
  ethnicity: "",
  occupation: "",
  heightCm: "",
  weightKg: "",
  familyHistory: "",
  surgicalHistory: "",
  currentMedications: "",
  lifestyleHabits: "",
  avatarUrl: "",
};

export default function PatientManagement() {
  const { user } = useAuth();
  const isDoctor = user?.roles?.some(r => r === "DOCTOR" || r.roleName === "DOCTOR");

  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  const [users, setUsers] = useState([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // History modal
  const [showHistoryFor, setShowHistoryFor] = useState(null);

  /* ── Load Options ──────────────────────────────────────── */
  const fetchOptions = async () => {
    try {
      const userRes = await getUsers({ size: 100 }, { skipErrorToast: true });
      setUsers(userRes.data?.content ?? []);
    } catch (err) {
      // Expected to fail for Doctors who don't have access to users.
    }
  };

  /* ── Fetch Patients ────────────────────────────────────── */
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {};
      const res = await getPatients(params);
      setPatients(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchPatients();
  }, []);

  /* ── Form handlers ─────────────────────────────────────── */
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (patient) => {
    setFormData({
      userId: patient.userId || "",
      patientCode: patient.patientCode || "",
      fullName: patient.fullName || "",
      gender: patient.gender || "OTHER",
      dateOfBirth: patient.dateOfBirth || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      identityNumber: patient.identityNumber || "",
      insuranceNumber: patient.insuranceNumber || "",
      emergencyContactName: patient.emergencyContactName || "",
      emergencyContactPhone: patient.emergencyContactPhone || "",
      bloodType: patient.bloodType || "",
      allergies: patient.allergies || "",
      medicalHistory: patient.medicalHistory || "",
      ethnicity: patient.ethnicity || "",
      occupation: patient.occupation || "",
      heightCm: patient.heightCm || "",
      weightKg: patient.weightKg || "",
      familyHistory: patient.familyHistory || "",
      surgicalHistory: patient.surgicalHistory || "",
      currentMedications: patient.currentMedications || "",
      lifestyleHabits: patient.lifestyleHabits || "",
      avatarUrl: patient.avatarUrl || "",
    });
    setEditingId(patient.patientId);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.phone && !/^(0|\+84)[0-9]{8,10}$/.test(formData.phone)) {
      setFormError("Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 9-11 chữ số).");
      return;
    }
    if (formData.identityNumber && !/^[0-9]{12}$/.test(formData.identityNumber)) {
      setFormError("CCCD/CMND phải bao gồm chính xác 12 chữ số.");
      return;
    }
    if (formData.insuranceNumber && formData.insuranceNumber.length !== 15) {
      setFormError("Mã BHYT phải bao gồm chính xác 15 ký tự.");
      return;
    }
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        setFormError("Ngày sinh không được ở trong tương lai.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = { ...formData };
      if (!payload.userId) payload.userId = null;

      if (editingId) {
        await updatePatient(editingId, payload);
      } else {
        await createPatient(payload);
      }
      closeForm();
      await fetchPatients();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete handlers ───────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePatient(deleteTarget.patientId);
      setDeleteTarget(null);
      await fetchPatients();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  };

  // Status mapper
  const getMappedStatus = (p) => {
    const idNum = p.patientId || 0;
    if (idNum % 3 === 0) return "Đang điều trị";
    if (idNum % 3 === 1) return "Đã xuất viện";
    return "Tái khám";
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Đang điều trị":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "Đã xuất viện":
        return "text-slate-600 bg-slate-50 border-slate-100";
      case "Tái khám":
        return "text-amber-600 bg-amber-50 border-amber-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case "Đang điều trị": return "bg-emerald-500";
      case "Đã xuất viện": return "bg-slate-400";
      case "Tái khám": return "bg-amber-500";
      default: return "bg-slate-400";
    }
  };

  // Diagnosis mapper
  const getMappedDiagnosis = (p) => {
    if (p.medicalHistory) return p.medicalHistory;
    const idNum = p.patientId || 0;
    const list = [
      "Rối loạn nhịp tim mạn tính",
      "Viêm phế quản cấp tính",
      "Suy thận độ 3, tiểu đường type 2",
      "Theo dõi sau phẫu thuật ruột thừa",
      "Rối loạn tiêu hóa cấp tính"
    ];
    return list[idNum % list.length];
  };

  // Last visit mapper
  const getMappedLastVisit = (p) => {
    const idNum = p.patientId || 0;
    if (idNum % 3 === 0) return "Hôm nay, 08:30";
    if (idNum % 3 === 1) return "Hôm qua, 14:15";
    return "15/10/2023";
  };

  // Filter & Search Logic
  const filteredPatients = patients.filter((p) => {
    const query = searchTerm.toLowerCase().trim();
    const matchSearch =
      (p.fullName || "").toLowerCase().includes(query) ||
      (p.patientCode || "").toLowerCase().includes(query) ||
      (p.phone || "").toLowerCase().includes(query);

    const status = getMappedStatus(p);
    if (activeFilter === "Tất cả") return matchSearch;
    return matchSearch && status === activeFilter;
  });

  return (
    <div className="w-full flex flex-col gap-6 p-1 pb-10">

      {/* ── 1. HEADER SECTION ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#1DB896] flex items-center justify-center border border-teal-100 shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bệnh nhân của tôi</h1>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">Quản lý và theo dõi hồ sơ bệnh án định kỳ</p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center gap-2"
        >
          <Plus size={16} />
          Thêm bệnh nhân mới
        </button>
      </div>

      {/* ── 2. FILTERS & SEARCH ROW ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {["Tất cả", "Đang điều trị", "Đã xuất viện", "Tái khám"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-full font-bold text-sm border transition-all ${activeFilter === tab
                  ? "bg-teal-50 border-teal-100 text-[#1DB896]"
                  : "bg-white border-slate-200/60 text-slate-500 hover:bg-slate-50"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Info: Search Box & New Patients group */}
        <div className="flex flex-col sm:flex-row items-center gap-4">

          {/* Avatar Group */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex -space-x-2">
              <img className="w-7 h-7 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=33" alt="" />
              <img className="w-7 h-7 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=12" alt="" />
              <img className="w-7 h-7 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=47" alt="" />
              <div className="w-7 h-7 rounded-full bg-[#1DB896]/10 text-[#1DB896] text-[10px] font-black flex items-center justify-center border-2 border-white">
                +12
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">BN mới trong tuần</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm hồ sơ bệnh nhân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold"
            />
          </div>

        </div>

      </div>

      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 p-4 rounded-xl text-sm font-bold">{error}</div>}

      {/* ── 3. DATA TABLE CARD ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-extrabold uppercase tracking-wider">
                <th className="pb-3 w-[140px]">Mã BN</th>
                <th className="pb-3">Họ tên</th>
                <th className="pb-3 w-[140px]">Ngày sinh</th>
                <th className="pb-3">Chẩn đoán</th>
                <th className="pb-3 w-[160px]">Lần khám cuối</th>
                <th className="pb-3 w-[140px]">Trạng thái</th>
                <th className="pb-3 w-[120px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">Không tìm thấy bệnh nhân nào.</td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const status = getMappedStatus(p);
                  const diagnosis = getMappedDiagnosis(p);
                  const lastVisit = getMappedLastVisit(p);
                  const initials = p.fullName
                    ? p.fullName.split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase()
                    : "BN";

                  return (
                    <tr key={p.patientId} className="group hover:bg-slate-50/50 transition-colors">

                      {/* Code */}
                      <td className="py-4">
                        <span className="font-mono text-[#1DB896] bg-teal-50 border border-teal-100/60 px-2 py-1 rounded text-xs font-bold">
                          {p.patientCode}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1DB896]/10 text-[#1DB896] flex items-center justify-center text-xs font-black">
                            {initials}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 text-sm">{p.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{p.phone || "—"}</div>
                          </div>
                        </div>
                      </td>

                      {/* DOB */}
                      <td className="py-4 text-slate-600 font-bold text-sm">
                        {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("vi-VN") : "12/05/1985"}
                      </td>

                      {/* Diagnosis */}
                      <td className="py-4">
                        <span className="text-slate-600 font-semibold text-sm max-w-[240px] truncate block">
                          {diagnosis}
                        </span>
                      </td>

                      {/* Last Visit */}
                      <td className="py-4 text-slate-500 font-bold text-sm">
                        {lastVisit}
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border flex items-center gap-1.5 w-fit ${getStatusBadgeStyle(status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(status)}`} />
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-1.5">

                          <button
                            onClick={() => navigate(`/dashboard/patients/${p.patientId}`)}
                            title="Hồ sơ chi tiết"
                            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#1DB896]/10 hover:text-[#1DB896] transition-colors"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => setShowHistoryFor(p.patientId)}
                            title="Lịch sử bệnh án"
                            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#1DB896]/10 hover:text-[#1DB896] transition-colors"
                          >
                            <ClipboardList size={15} />
                          </button>

                          <button
                            onClick={() => openEdit(p)}
                            title="Chỉnh sửa"
                            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#1DB896]/10 hover:text-[#1DB896] transition-colors"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(p)}
                            title="Xóa"
                            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. PAGINATION FOOTER ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400">
            Hiển thị {filteredPatients.length} trên tổng số {patients.length} bệnh nhân
          </span>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
              <i className="ti ti-chevron-left" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#1DB896] text-white font-extrabold text-xs">1</button>
            <button className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold">2</button>
            <button className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold">3</button>
            <span className="text-slate-400 px-1 font-bold">...</span>
            <button className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold">125</button>
            <button className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
              <i className="ti ti-chevron-right" />
            </button>
          </div>
        </div>

      </div>

      {/* ── Modal Thêm/Sửa (Light Styled) ────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800">{editingId ? "Cập nhật hồ sơ bệnh nhân" : "Thêm hồ sơ bệnh nhân mới"}</h2>
              <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors" onClick={closeForm}><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {formError && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 p-4 rounded-xl text-sm font-bold">{formError}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã bệnh nhân *</label>
                    <input name="patientCode" value={formData.patientCode} onChange={handleChange} required className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản User (Tùy chọn)</label>
                    <select name="userId" value={formData.userId} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 font-semibold text-sm">
                      <option value="">-- Không liên kết --</option>
                      {users.map(u => (
                        <option key={u.userId} value={u.userId}>{u.fullName} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên *</label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} required className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giới tính</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 font-semibold text-sm">
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày sinh</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhóm máu</label>
                    <div className="flex flex-wrap gap-2">
                      {["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                        <label key={type} className={`
                          px-4 py-2 rounded-xl border cursor-pointer flex items-center gap-2 text-sm transition-all font-semibold
                          ${formData.bloodType === type
                            ? 'bg-teal-50 border-teal-400 text-[#1DB896] font-bold shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}
                        `}>
                          <input
                            type="radio"
                            name="bloodType"
                            value={type}
                            checked={formData.bloodType === type}
                            onChange={handleChange}
                            className="hidden"
                          />
                          {type === "" ? "Chưa xác định" : type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ</label>
                    <input name="address" value={formData.address} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CMND / CCCD</label>
                    <input name="identityNumber" value={formData.identityNumber} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã thẻ BHYT</label>
                    <input name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người liên hệ khẩn cấp</label>
                    <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="Tên người thân" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SĐT khẩn cấp</label>
                    <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} placeholder="SĐT người thân" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dị ứng (Nếu có)</label>
                    <textarea name="allergies" rows={2} value={formData.allergies} onChange={handleChange} placeholder="Thuốc, thực phẩm..." className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm resize-none" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dân tộc</label>
                    <input name="ethnicity" value={formData.ethnicity} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nghề nghiệp</label>
                    <input name="occupation" value={formData.occupation} onChange={handleChange} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiền sử bệnh lý (Bản thân)</label>
                    <textarea name="medicalHistory" rows={2} value={formData.medicalHistory} onChange={handleChange} placeholder="Các bệnh từng mắc, phẫu thuật..." className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm resize-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                  <button type="button" className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-bold text-sm" onClick={closeForm}>Hủy</button>
                  <button type="submit" className="bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-teal-500/20 text-sm" disabled={submitting}>
                    {submitting ? "Đang xử lý..." : "Lưu hồ sơ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Xóa (Light Styled) ────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">Xác nhận xóa hồ sơ</h2>
              <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân <strong className="text-slate-800 font-extrabold">{deleteTarget.fullName || deleteTarget.patientCode}</strong> không? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors text-sm" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20 transition-all text-sm" onClick={confirmDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Lịch sử bệnh án ───────────────────────────── */}
      {showHistoryFor && (
        <MedicalHistory patientId={showHistoryFor} onClose={() => setShowHistoryFor(null)} />
      )}
    </div>
  );
}
