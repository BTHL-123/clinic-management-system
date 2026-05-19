import { useEffect, useState } from "react";
import { Building2, Edit, Plus, Search, Trash2, X } from "lucide-react";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../../services/departmentService";

const EMPTY_FORM = { departmentName: "", description: "", status: "ACTIVE" };

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // confirm delete
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      // res.data is a PageResponse, so the array is inside res.data.content
      setDepartments(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  /* ── Filter ────────────────────────────────────────────── */
  const filtered = departments.filter(
    (d) =>
      d.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.description ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /* ── Form handlers ─────────────────────────────────────── */
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (dept) => {
    setFormData({
      departmentName: dept.departmentName,
      description: dept.description ?? "",
      status: dept.status,
    });
    setEditingId(dept.departmentId);
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
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departmentName.trim()) {
      setFormError("Tên chuyên khoa không được để trống.");
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await updateDepartment(editingId, formData);
      } else {
        await createDepartment(formData);
      }
      closeForm();
      await fetchDepartments();
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
      await deleteDepartment(deleteTarget.departmentId);
      setDeleteTarget(null);
      await fetchDepartments();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <>
      {/* ── Page Header ────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Building2 size={26} />
            Quản lý Chuyên khoa
          </h1>
          <p className="muted">
            Quản lý danh sách các chuyên khoa trong phòng khám.
          </p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={16} />
          Thêm chuyên khoa
        </button>
      </div>

      {/* ── Search Bar ─────────────────────────────────── */}
      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc mô tả..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && <div className="error-box">{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên chuyên khoa</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  {searchTerm
                    ? "Không tìm thấy chuyên khoa nào."
                    : "Chưa có chuyên khoa nào. Hãy thêm mới!"}
                </td>
              </tr>
            ) : (
              filtered.map((dept, idx) => (
                <tr key={dept.departmentId}>
                  <td>{idx + 1}</td>
                  <td className="cell-name">{dept.departmentName}</td>
                  <td className="cell-desc">
                    {dept.description || "—"}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${dept.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}
                    >
                      {dept.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                    </span>
                  </td>
                  <td>
                    {dept.createdAt
                      ? new Date(dept.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className="icon-button"
                        title="Chỉnh sửa"
                        onClick={() => openEdit(dept)}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="icon-button btn-danger"
                        title="Xóa"
                        onClick={() => setDeleteTarget(dept)}
                      >
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

      {/* ── Create / Edit Modal ────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingId ? "Cập nhật chuyên khoa" : "Thêm chuyên khoa mới"}
              </h2>
              <button className="icon-button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <form className="form-stack" onSubmit={handleSubmit}>
              {formError && <div className="error-box">{formError}</div>}

              <div className="field">
                <label htmlFor="departmentName">Tên chuyên khoa *</label>
                <input
                  id="departmentName"
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleChange}
                  placeholder="VD: Nội khoa, Da liễu, Tim mạch..."
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn gọn về chuyên khoa..."
                />
              </div>

              {editingId && (
                <div className="field">
                  <label htmlFor="status">Trạng thái</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Đang xử lý..."
                    : editingId
                      ? "Cập nhật"
                      : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button
                className="icon-button"
                onClick={() => setDeleteTarget(null)}
              >
                <X size={18} />
              </button>
            </div>
            <p>
              Bạn có chắc chắn muốn xóa chuyên khoa{" "}
              <strong>{deleteTarget.departmentName}</strong> không?
            </p>
            <div className="form-actions">
              <button
                className="secondary-button"
                onClick={() => setDeleteTarget(null)}
              >
                Hủy
              </button>
              <button className="danger-button" onClick={confirmDelete}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
