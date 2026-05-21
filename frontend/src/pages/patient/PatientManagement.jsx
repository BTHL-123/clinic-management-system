import { useEffect, useState } from "react";
import { Edit, Plus, Search, Trash2, Users, X } from "lucide-react";
import {
  createPatient,
  deletePatient,
  getPatients,
  updatePatient,
} from "../../services/patientService";
import { getUsers } from "../../services/userService";

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
};

export default function PatientManagement() {
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

  /* ── Load Options ──────────────────────────────────────── */
  const fetchOptions = async () => {
    try {
      const userRes = await getUsers({ size: 100 });
      setUsers(userRes.data?.content ?? []);
    } catch (err) {
      console.error("Failed to load options", err);
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
    <>
      {/* ── Page Header ────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={26} />
            Hồ sơ bệnh nhân
          </h1>
          <p className="muted">Quản lý hồ sơ bệnh nhân, tiền sử bệnh lý và thông tin liên hệ.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={16} />
          Thêm bệnh nhân
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────── */}
      <div className="search-bar" style={{ display: "flex", gap: "10px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã bệnh nhân hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã BN</th>
              <th>Họ và tên</th>
              <th>Giới tính</th>
              <th>SĐT</th>
              <th>CCCD / BHYT</th>
              <th>Liên kết tài khoản</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-row">Đang tải dữ liệu...</td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">Không tìm thấy bệnh nhân nào.</td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.patientId}>
                  <td className="cell-name">{patient.patientCode}</td>
                  <td><strong>{patient.fullName || "—"}</strong></td>
                  <td>{patient.gender === "MALE" ? "Nam" : patient.gender === "FEMALE" ? "Nữ" : "Khác"}</td>
                  <td>{patient.phone || "—"}</td>
                  <td>
                    {patient.identityNumber && <div style={{ fontSize: 12 }}>ID: {patient.identityNumber}</div>}
                    {patient.insuranceNumber && <div style={{ fontSize: 12, color: '#0f766e' }}>BHYT: {patient.insuranceNumber}</div>}
                    {!patient.identityNumber && !patient.insuranceNumber && "—"}
                  </td>
                  <td>
                    {patient.userName ? (
                      <span className="status-badge badge-active">{patient.userName}</span>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>Không có</span>
                    )}
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="icon-button" onClick={() => openEdit(patient)} title="Chỉnh sửa">
                        <Edit size={15} />
                      </button>
                      <button className="icon-button btn-danger" onClick={() => setDeleteTarget(patient)} title="Xóa">
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: "700px" }}>
            <div className="modal-header">
              <h2>{editingId ? "Cập nhật hồ sơ bệnh nhân" : "Thêm hồ sơ bệnh nhân"}</h2>
              <button className="icon-button" onClick={closeForm}><X size={18} /></button>
            </div>
            
            <form className="form-stack" onSubmit={handleSubmit} style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 10 }}>
              {formError && <div className="error-box">{formError}</div>}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label>Mã bệnh nhân *</label>
                  <input name="patientCode" value={formData.patientCode} onChange={handleChange} required />
                </div>

                <div className="field">
                  <label>Tài khoản User (Tùy chọn)</label>
                  <select name="userId" value={formData.userId} onChange={handleChange}>
                    <option value="">-- Không liên kết --</option>
                    {users.map(u => (
                      <option key={u.userId} value={u.userId}>{u.fullName} ({u.email})</option>
                    ))}
                  </select>
                </div>
                
                <div className="field">
                  <label>Họ và tên *</label>
                  <input name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>

                <div className="field">
                  <label>Giới tính</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div className="field">
                  <label>Ngày sinh</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>Số điện thoại</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                
                <div className="field">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>Nhóm máu</label>
                  <select name="bloodType" value={formData.bloodType} onChange={handleChange}>
                    <option value="">-- Chọn nhóm máu --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Địa chỉ</label>
                  <input name="address" value={formData.address} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>CMND / CCCD</label>
                  <input name="identityNumber" value={formData.identityNumber} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>Mã thẻ BHYT</label>
                  <input name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} />
                </div>

                <div className="field">
                  <label>Người liên hệ khẩn cấp</label>
                  <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="Tên người thân" />
                </div>

                <div className="field">
                  <label>SĐT khẩn cấp</label>
                  <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} placeholder="SĐT người thân" />
                </div>

                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Dị ứng (Nếu có)</label>
                  <textarea name="allergies" rows={2} value={formData.allergies} onChange={handleChange} placeholder="Thuốc, thực phẩm..." />
                </div>

                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Tiền sử bệnh lý</label>
                  <textarea name="medicalHistory" rows={3} value={formData.medicalHistory} onChange={handleChange} placeholder="Các bệnh từng mắc, phẫu thuật..." />
                </div>
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
            <p>Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân <strong>{deleteTarget.fullName || deleteTarget.patientCode}</strong> không?</p>
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
