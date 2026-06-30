import { useEffect, useState } from "react";
import { Edit, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import {
  createDoctor,
  deleteDoctor,
  getDoctors,
  updateDoctor,
} from "../../services/doctorService";
import { getActiveDepartments } from "../../services/departmentService";
import { getUsers, getUsersEligibleForDoctor } from "../../services/userService";
import PageHeader from "../../components/PageHeader";

const EMPTY_FORM = {
  userId: "",
  departmentId: "",
  doctorCode: "",
  degree: "",
  specialization: "",
  yearsOfExperience: 0,
  yearOfBirth: "",
  hometown: "",
  biography: "",
  consultationFee: 0,
  status: "ACTIVE",
};

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── Load Options ──────────────────────────────────────── */
  const fetchOptions = async () => {
    try {
      const [deptRes, userRes] = await Promise.all([
        getActiveDepartments(),
        getUsersEligibleForDoctor(),
      ]);
      setDepartments(deptRes.data ?? []);
      setUsers(userRes.data ?? []);
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  /* ── Fetch Doctors ─────────────────────────────────────── */
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (departmentFilter) params.departmentId = departmentFilter;
      if (searchTerm) params.keyword = searchTerm;

      const res = await getDoctors(params);
      setDoctors(res.data?.content ?? []);
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
    // Basic debounce could be added here
    fetchDoctors();
  }, [searchTerm, departmentFilter]);

  /* ── Form handlers ─────────────────────────────────────── */
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (doctor) => {
    setFormData({
      userId: doctor.userId || "",
      departmentId: doctor.departmentId || "",
      doctorCode: doctor.doctorCode || "",
      degree: doctor.degree || "",
      specialization: doctor.specialization || "",
      yearsOfExperience: doctor.yearsOfExperience || 0,
      yearOfBirth: doctor.yearOfBirth || "",
      hometown: doctor.hometown || "",
      biography: doctor.biography || "", 
      consultationFee: doctor.consultationFee || 0,
      status: doctor.status || "ACTIVE",
    });
    setEditingId(doctor.doctorId);
    
    // If we're editing, the user might not be in the 'eligible' list anymore because they are already a doctor.
    // We should make sure the current user is added to the users list if not already there, 
    // but the simplest way is to just let the select box show the user's ID if it matches an existing user.
    // However, if the user isn't in `users`, the select box won't show the name properly.
    // Let's add the current doctor's user info to the options if missing.
    setUsers(prev => {
        if (!prev.find(u => u.userId === doctor.userId) && doctor.userId) {
            return [...prev, { userId: doctor.userId, fullName: doctor.fullName, email: "Tài khoản hiện tại" }];
        }
        return prev;
    });

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
    try {
      setSubmitting(true);
      if (editingId) {
        const payload = { ...formData };
        await updateDoctor(editingId, payload);
      } else {
        await createDoctor(formData);
      }
      closeForm();
      await fetchDoctors();
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
      await deleteDoctor(deleteTarget.doctorId);
      setDeleteTarget(null);
      await fetchDoctors();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* ── Page Header ────────────────────────────────── */}
      <PageHeader
        title="Quản lý Bác sĩ"
        icon={UserRound}
        iconColor="text-white"
        subtitle="Quản lý hồ sơ bác sĩ và phân công chuyên khoa."
        rightContent={
          <button
            className="bg-white text-teal-700 hover:bg-teal-50 font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-2"
            onClick={openCreate}
          >
            <Plus size={16} />
            Thêm bác sĩ
          </button>
        }
      />


      {/* ── Filters ────────────────────────────────────── */}
      <div className="search-bar" style={{ display: "flex", gap: "10px", alignItems: "center", maxWidth: "100%" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            style={{ minHeight: "44px", borderRadius: "8px", border: "1px solid #d7dee8", padding: "0 12px", background: "#fff" }}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Tất cả chuyên khoa</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
        </div>
        <button className="primary-button" style={{ flexShrink: 0, marginRight: "16px" }} onClick={openCreate}>
          <Plus size={16} />
          Thêm bác sĩ
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="table-wrapper doctor-table-wrapper">
        <table className="doctor-data-table">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "9%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ color: "#0f766e" }}>Mã BS</th>
              <th style={{ color: "#0f766e" }}>Họ và tên</th>
              <th style={{ color: "#0f766e" }}>Chuyên khoa</th>
              <th style={{ color: "#0f766e" }}>Học vị</th>
              <th style={{ color: "#0f766e" }}>Kinh nghiệm</th>
              <th style={{ color: "#0f766e" }}>Phí khám</th>
              <th style={{ color: "#0f766e" }}>Trạng thái</th>
              <th style={{ textAlign: "center", color: "#0f766e" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-row">Đang tải dữ liệu...</td>
              </tr>
            ) : doctors.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">Không tìm thấy bác sĩ nào.</td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor.doctorId}>
                  <td className="cell-name">{doctor.doctorCode}</td>
                  <td><strong>{doctor.fullName || "—"}</strong></td>
                  <td>{doctor.departmentName || "—"}</td>
                  <td>{doctor.degree || "—"}</td>
                  <td>{doctor.yearsOfExperience} năm</td>
                  <td>{doctor.consultationFee ? doctor.consultationFee.toLocaleString("vi-VN") + " ₫" : "Miễn phí"}</td>
                  <td>
                    <span className={`status-badge ${doctor.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}>
                      {doctor.status === "ACTIVE" ? "Đang làm việc" : doctor.status === "ON_LEAVE" ? "Nghỉ phép" : "Đã nghỉ"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-group">
                      <button className="icon-button" onClick={() => openEdit(doctor)} title="Chỉnh sửa">
                        <Edit size={15} />
                      </button>
                      <button className="icon-button btn-danger" onClick={() => setDeleteTarget(doctor)} title="Xóa">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Thêm/Sửa ─────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: "600px" }}>
            <div className="modal-header">
              <h2>{editingId ? "Cập nhật hồ sơ bác sĩ" : "Thêm bác sĩ mới"}</h2>
              <button className="icon-button" onClick={closeForm}><X size={18} /></button>
            </div>
            
            <form className="form-stack" onSubmit={handleSubmit} style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 10 }}>
              {formError && <div className="error-box">{formError}</div>}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label>Mã bác sĩ (Tự động tạo)</label>
                  <input name="doctorCode" value={formData.doctorCode || "Tự động tạo sau khi lưu"} disabled style={{ backgroundColor: "#f1f5f9", color: "#64748b", fontStyle: "italic" }} />
                </div>
                
                <div className="field">
                  <label>Tài khoản User liên kết *</label>
                  <select name="userId" value={formData.userId} onChange={handleChange} required>
                    <option value="">-- Chọn User --</option>
                    {users.map(u => (
                      <option key={u.userId} value={u.userId}>{u.fullName} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Chuyên khoa *</label>
                  <select name="departmentId" value={formData.departmentId} onChange={handleChange} required>
                    <option value="">-- Chọn chuyên khoa --</option>
                    {departments.map(d => (
                      <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Học vị</label>
                  <input name="degree" value={formData.degree} onChange={handleChange} placeholder="VD: Thạc sĩ, BS.CKI" />
                </div>

                <div className="field">
                  <label>Chuyên môn</label>
                  <input name="specialization" value={formData.specialization} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>Năm kinh nghiệm</label>
                  <input type="number" name="yearsOfExperience" min="0" value={formData.yearsOfExperience} onChange={handleChange} />
                </div>
                
                <div className="field">
                  <label>Năm sinh</label>
                  <input type="number" name="yearOfBirth" min="1900" max={new Date().getFullYear()} value={formData.yearOfBirth} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>Quê quán</label>
                  <input name="hometown" value={formData.hometown} onChange={handleChange} placeholder="VD: Hà Nội" />
                </div>

                <div className="field">
                  <label>Phí khám bệnh (VND)</label>
                  <input type="number" name="consultationFee" min="0" value={formData.consultationFee} onChange={handleChange} />
                </div>

                {editingId && (
                  <div className="field">
                    <label>Trạng thái</label>
                    <select name="status" value={formData.status} onChange={handleChange}>
                      <option value="ACTIVE">Đang làm việc</option>
                      <option value="ON_LEAVE">Nghỉ phép</option>
                      <option value="INACTIVE">Đã thôi việc</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="field" style={{ marginTop: 14 }}>
                <label>Tiểu sử / Giới thiệu</label>
                <textarea name="biography" rows={4} value={formData.biography} onChange={handleChange} />
              </div>

              <div className="form-actions" style={{ marginTop: 24 }}>
                <button type="button" className="secondary-button" onClick={closeForm}>Hủy</button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Lưu hồ sơ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Xóa ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="icon-button" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <p>Bạn có chắc chắn muốn xóa bác sĩ <strong>{deleteTarget.fullName || deleteTarget.doctorCode}</strong> không?</p>
            <div className="form-actions">
              <button className="secondary-button" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="danger-button" onClick={confirmDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
