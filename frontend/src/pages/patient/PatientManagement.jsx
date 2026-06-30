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
import PageHeader from "../../components/PageHeader.jsx";

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

  // Filter & Search Logic
  const filteredPatients = patients.filter((p) => {
    const query = searchTerm.toLowerCase().trim();
    return (
      (p.fullName || "").toLowerCase().includes(query) ||
      (p.patientCode || "").toLowerCase().includes(query) ||
      (p.phone || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full gap-6 pb-6">
      {/* ── Page Header ────────────────────────────────── */}
      <PageHeader
        title="Hồ sơ bệnh nhân"
        icon={Users}
        iconColor="text-white"
        onBack={() => navigate("/dashboard")}
        rightContent={
          !isDoctor && (
            <button
              className="bg-[#0F766E] hover:bg-[#095650] text-white font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-teal-700/20 text-sm"
              onClick={openCreate}
            >
              <Plus size={16} />
              Thêm bệnh nhân
            </button>
          )
        }
      />

      {/* ── Filters ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex gap-4">
        <div className="relative flex-1 max-w-[420px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã bệnh nhân hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
          />
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm font-medium">{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm w-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-extrabold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-4 pl-6">Mã BN</th>
                <th className="p-4">Họ và tên</th>
                <th className="p-4">Giới tính</th>
                <th className="p-4">SĐT</th>
                <th className="p-4">CCCD / BHYT</th>
                <th className="p-4">Tài khoản</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">Không tìm thấy bệnh nhân nào.</td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.patientId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="font-mono text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg text-xs border border-teal-200/60 font-bold">{patient.patientCode}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-800 text-sm">{patient.fullName || "—"}</td>
                    <td className="p-4 text-slate-600 text-sm font-medium">{patient.gender === "MALE" ? "Nam" : patient.gender === "FEMALE" ? "Nữ" : "Khác"}</td>
                    <td className="p-4 text-slate-800 text-sm font-semibold">{patient.phone || "—"}</td>
                    <td className="p-4">
                      {patient.identityNumber && <div className="text-xs text-slate-500 mb-0.5 font-medium">ID: <span className="text-slate-800 font-bold">{patient.identityNumber}</span></div>}
                      {patient.insuranceNumber && <div className="text-xs text-teal-600 font-medium">BHYT: <span className="text-teal-700 font-bold">{patient.insuranceNumber}</span></div>}
                      {!patient.identityNumber && !patient.insuranceNumber && <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-4">
                      {patient.userName ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold">{patient.userName}</span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Không có</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/patients/${patient.patientId}`)}
                          title="Xem chi tiết"
                          className="p-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        {!isDoctor && (
                          <>
                            <button
                              onClick={() => openEdit(patient)}
                              title="Chỉnh sửa"
                              className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(patient)}
                              title="Xóa"
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
              <i className="ti ti-chevron-left"></i>
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#1DB896] text-white font-extrabold text-xs">1</button>
            <button className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold">2</button>
            <button className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold">3</button>
            <span className="text-slate-400 px-1 font-bold">...</span>
            <button className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold">125</button>
            <button className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
              <i className="ti ti-chevron-right"></i>
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
                    <textarea name="allergies" rows={2} value={formData.allergies} onChange={handleChange} placeholder="Thuốc, thực phẩm..." className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm resize-none"></textarea>
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
                    <textarea name="medicalHistory" rows={2} value={formData.medicalHistory} onChange={handleChange} placeholder="Các bệnh từng mắc, phẫu thuật..." className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder-slate-400 font-semibold text-sm resize-none"></textarea>
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
