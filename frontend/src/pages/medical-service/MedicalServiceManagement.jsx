import { useEffect, useState } from "react";
import { Stethoscope, Edit, Plus, Search, Trash2, X } from "lucide-react";
import {
  createMedicalService,
  deleteMedicalService,
  getMedicalServices,
  updateMedicalService,
} from "../../services/medicalServiceService";

const EMPTY_FORM = {
  serviceCode: "",
  serviceName: "",
  serviceType: "EXAM",
  price: "",
  description: "",
  status: "ACTIVE",
};

export default function MedicalServiceManagement() {
  const [services, setServices] = useState([]);
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
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await getMedicalServices();
      setServices(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* ── Filter ────────────────────────────────────────────── */
  const filtered = services.filter(
    (s) =>
      (s.serviceName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.serviceCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── Form handlers ─────────────────────────────────────── */
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (service) => {
    setFormData({
      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      serviceType: service.serviceType || "EXAM",
      price: service.price || 0,
      description: service.description || "",
      status: service.status,
    });
    setEditingId(service.serviceId);
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
    if (!formData.serviceCode.trim()) {
      setFormError("Mã dịch vụ không được để trống.");
      return;
    }
    if (!formData.serviceName.trim()) {
      setFormError("Tên dịch vụ không được để trống.");
      return;
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) < 0) {
      setFormError("Giá dịch vụ không hợp lệ.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateMedicalService(editingId, formData);
      } else {
        await createMedicalService(formData);
      }
      closeForm();
      await fetchServices();
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
      await deleteMedicalService(deleteTarget.serviceId);
      setDeleteTarget(null);
      await fetchServices();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatServiceType = (type) => {
    switch (type) {
      case "EXAM":
        return "Khám bệnh";
      case "TEST":
        return "Xét nghiệm";
      case "PROCEDURE":
        return "Thủ thuật";
      default:
        return type;
    }
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Stethoscope size={26} />
            Quản lý Dịch vụ y tế
          </h1>
          <p className="muted">
            Quản lý danh sách các dịch vụ khám chữa bệnh và bảng giá.
          </p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={16} />
          Thêm dịch vụ
        </button>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm theo mã, tên hoặc mô tả..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã dịch vụ</th>
              <th>Tên dịch vụ</th>
              <th>Loại dịch vụ</th>
              <th>Đơn giá</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  {searchTerm
                    ? "Không tìm thấy dịch vụ nào."
                    : "Chưa có dịch vụ nào. Hãy thêm mới!"}
                </td>
              </tr>
            ) : (
              filtered.map((service, idx) => (
                <tr key={service.serviceId}>
                  <td>{idx + 1}</td>
                  <td><strong>{service.serviceCode}</strong></td>
                  <td className="cell-name">{service.serviceName}</td>
                  <td>{formatServiceType(service.serviceType)}</td>
                  <td className="fw-500">{formatCurrency(service.price)}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        service.status === "ACTIVE" ? "badge-active" : "badge-inactive"
                      }`}
                    >
                      {service.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className="icon-button"
                        title="Chỉnh sửa"
                        onClick={() => openEdit(service)}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="icon-button btn-danger"
                        title="Xóa"
                        onClick={() => setDeleteTarget(service)}
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

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingId ? "Cập nhật dịch vụ y tế" : "Thêm dịch vụ mới"}
              </h2>
              <button className="icon-button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <form className="form-stack" onSubmit={handleSubmit}>
              {formError && <div className="error-box">{formError}</div>}

              <div className="field">
                <label htmlFor="serviceCode">Mã dịch vụ *</label>
                <input
                  id="serviceCode"
                  name="serviceCode"
                  value={formData.serviceCode}
                  onChange={handleChange}
                  placeholder="VD: KHAM01, XN01..."
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="serviceName">Tên dịch vụ *</label>
                <input
                  id="serviceName"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleChange}
                  placeholder="VD: Khám tổng quát..."
                />
              </div>

              <div className="field">
                <label htmlFor="serviceType">Loại dịch vụ</label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                >
                  <option value="EXAM">Khám bệnh</option>
                  <option value="TEST">Xét nghiệm</option>
                  <option value="PROCEDURE">Thủ thuật</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="price">Giá tiền (VNĐ) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="VD: 150000"
                />
              </div>

              <div className="field">
                <label htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn gọn về dịch vụ..."
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
              Bạn có chắc chắn muốn xóa dịch vụ{" "}
              <strong>{deleteTarget.serviceName}</strong> không?
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
