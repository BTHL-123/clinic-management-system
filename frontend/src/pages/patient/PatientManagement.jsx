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
import PageHeader from "../../components/PageHeader";

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
      // It's expected to fail for Doctors who don't have access to users.
      // We don't need to log this as an error to avoid console clutter.
    }
  };

  /* ── Fetch Patients ────────────────────────────────────── */
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.keyword = searchTerm;

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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      if (!payload.userId) payload.userId = null; // Clean up empty string

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

  return (
    <div className="receptionist-patient-page text-white flex flex-col h-full gap-6 pb-6">
      {/* ── Page Header ────────────────────────────────── */}
      <PageHeader
        title="Hồ sơ bệnh nhân"
        icon={Users}
        iconColor="text-white"
        onBack={() => navigate("/dashboard")}
        rightContent={
          !isDoctor && (
            <button
              className="bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all flex items-center gap-2 shadow-lg"
              onClick={openCreate}
            >
              <Plus size={16} />
              Thêm bệnh nhân
            </button>
          )
        }
      />

      {/* ── Filters ────────────────────────────────────── */}
      <div className="patient-glass-panel rounded-[1.5rem] p-5 shadow-xl flex gap-4">
        <div className="relative flex-1 max-w-[420px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-700/50" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã bệnh nhân hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full patient-glass-input text-slate-900 placeholder-teal-700/50 text-sm rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-teal-500/50 transition-colors font-semibold"
          />
        </div>
      </div>

      {error && <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 p-4 rounded-xl">{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="flex-1 patient-glass-panel rounded-[3rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] border-0 w-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="receptionist-patient-table w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white/5 border-b border-slate-900/10 text-[#0f766e] text-sm sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-5">Mã BN</th>
                <th className="p-5">Họ và tên</th>
                <th className="p-5">Giới tính</th>
                <th className="p-5">SĐT</th>
                <th className="p-5">CCCD / BHYT</th>
                <th className="p-5">Tài khoản</th>
                <th className="p-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">Đang tải dữ liệu...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">Không tìm thấy bệnh nhân nào.</td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.patientId} className="border-b border-slate-900/10 hover:bg-white/30 transition-colors">
                    <td className="p-4 pl-5">
                      <span className="font-mono text-teal-700 bg-teal-50/80 px-2 py-1 rounded-md text-sm border border-teal-200/60 font-bold">{patient.patientCode}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{patient.fullName || "—"}</td>
                    <td className="p-4 text-slate-800 font-medium">{patient.gender === "MALE" ? "Nam" : patient.gender === "FEMALE" ? "Nữ" : "Khác"}</td>
                    <td className="p-4 text-slate-800 font-medium">{patient.phone || "—"}</td>
                    <td className="p-4">
                      {patient.identityNumber && <div className="text-xs text-slate-600 mb-0.5 font-medium">ID: <span className="text-slate-800 font-semibold">{patient.identityNumber}</span></div>}
                      {patient.insuranceNumber && <div className="text-xs text-teal-700 font-medium">BHYT: <span className="text-teal-800 font-semibold">{patient.insuranceNumber}</span></div>}
                      {!patient.identityNumber && !patient.insuranceNumber && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-4 receptionist-patient-account-cell">
                      {patient.userName ? (
                        <span className="receptionist-patient-account-badge">{patient.userName}</span>
                      ) : (
                        <span className="receptionist-patient-account-empty">Không có</span>
                      )}
                    </td>
                    <td className="p-4 receptionist-patient-actions-cell">
                      <div className="receptionist-patient-actions flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/patients/${patient.patientId}`)}
                          title="Hồ sơ chi tiết"
                          className="receptionist-patient-action receptionist-patient-action-view p-2 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setShowHistoryFor(patient.patientId)}
                          title="Lịch sử bệnh án"
                          className="receptionist-patient-action receptionist-patient-action-history p-2 rounded-lg transition-all"
                        >
                          <ClipboardList size={16} />
                        </button>
                        {!isDoctor && (
                          <>
                            <button
                              onClick={() => openEdit(patient)}
                              title="Chỉnh sửa"
                              className="receptionist-patient-action receptionist-patient-action-edit p-2 rounded-lg transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(patient)}
                              title="Xóa"
                              className="receptionist-patient-action receptionist-patient-action-delete p-2 rounded-lg transition-all"
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
      </div>

      {/* ── Modal Thêm/Sửa ─────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-[#115e59]/95 backdrop-blur-2xl border border-white/20 rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-bold text-white">{editingId ? "Cập nhật hồ sơ bệnh nhân" : "Thêm hồ sơ bệnh nhân"}</h2>
              <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors" onClick={closeForm}><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar text-white">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {formError && <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 p-4 rounded-xl">{formError}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Mã bệnh nhân *</label>
                    <input name="patientCode" value={formData.patientCode} onChange={handleChange} required className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Tài khoản User (Tùy chọn)</label>
                    <select name="userId" value={formData.userId} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors [&>option]:bg-slate-800">
                      <option value="">-- Không liên kết --</option>
                      {users.map(u => (
                        <option key={u.userId} value={u.userId}>{u.fullName} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Họ và tên *</label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} required className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Giới tính</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors [&>option]:bg-slate-800">
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Ngày sinh</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors [color-scheme:dark]" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Số điện thoại</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Nhóm máu</label>
                    <div className="flex flex-wrap gap-2">
                      {["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                        <label key={type} className={`
                          px-4 py-2 rounded-xl border cursor-pointer flex items-center gap-2 text-sm transition-all
                          ${formData.bloodType === type 
                            ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold shadow-[0_0_10px_rgba(45,212,191,0.2)]' 
                            : 'bg-slate-900/40 border-white/10 text-white/80 hover:bg-white/5'}
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
                    <label className="text-sm text-white/80 font-medium">Địa chỉ</label>
                    <input name="address" value={formData.address} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">CMND / CCCD</label>
                    <input name="identityNumber" value={formData.identityNumber} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Mã thẻ BHYT</label>
                    <input name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">Người liên hệ khẩn cấp</label>
                    <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="Tên người thân" className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-white/80 font-medium">SĐT khẩn cấp</label>
                    <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} placeholder="SĐT người thân" className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Dị ứng (Nếu có)</label>
                    <textarea name="allergies" rows={2} value={formData.allergies} onChange={handleChange} placeholder="Thuốc, thực phẩm..." className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors resize-none" />
                  </div>
                  
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Dân tộc</label>
                    <input name="ethnicity" value={formData.ethnicity} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Nghề nghiệp</label>
                    <input name="occupation" value={formData.occupation} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Tiền sử bệnh lý (Bản thân)</label>
                    <textarea name="medicalHistory" rows={2} value={formData.medicalHistory} onChange={handleChange} placeholder="Các bệnh từng mắc, phẫu thuật..." className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors resize-none" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Tiền sử gia đình</label>
                    <textarea name="familyHistory" rows={2} value={formData.familyHistory} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors resize-none" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Tiền sử phẫu thuật</label>
                    <textarea name="surgicalHistory" rows={2} value={formData.surgicalHistory} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors resize-none" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Thuốc đang sử dụng</label>
                    <textarea name="currentMedications" rows={2} value={formData.currentMedications} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors resize-none" />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm text-white/80 font-medium">Thói quen (Rượu, bia, thuốc lá...)</label>
                    <textarea name="lifestyleHabits" rows={2} value={formData.lifestyleHabits} onChange={handleChange} className="bg-slate-900/40 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400/50 transition-colors resize-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                  <button type="button" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={closeForm}>Hủy</button>
                  <button type="submit" className="bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold px-6 py-2.5 rounded-xl hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all" disabled={submitting}>
                    {submitting ? "Đang xử lý..." : "Lưu hồ sơ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Xóa ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-[#115e59]/95 backdrop-blur-2xl border border-white/20 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden p-6 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Trash2 className="text-rose-400" /> Xác nhận xóa</h2>
              <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors" onClick={() => setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <p className="text-white/80 mb-8 leading-relaxed">Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân <strong className="text-white">{deleteTarget.fullName || deleteTarget.patientCode}</strong> không? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all" onClick={confirmDelete}>Xóa</button>
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
