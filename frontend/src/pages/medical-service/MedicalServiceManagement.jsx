import { useEffect, useState } from "react";
import { Edit, HeartPulse, Plus, Search, Trash2, X } from "lucide-react";
import {
  createMedicalService,
  deleteMedicalService,
  getMedicalServices,
  updateMedicalService,
} from "../../services/medicalServiceService";
import PageHeader from "../../components/PageHeader";

const SERVICE_TYPES = [
  { value: "CONSULTATION", label: "Khám bệnh" },
  { value: "LAB_TEST", label: "Xét nghiệm" },
  { value: "PACKAGE", label: "Gói khám" },
  { value: "OTHER", label: "Khác" },
];

const EMPTY_FORM = {
  serviceCode: "",
  serviceName: "",
  serviceType: "CONSULTATION",
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
      const res = await getMedicalServices({ page: 0, size: 100 });
      setServices(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchServices();
  }, []);

  /* ── Filter ────────────────────────────────────────────── */
  const filtered = services.filter(
    (s) =>
      s.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.serviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /* ── Form handlers ─────────────────────────────────────── */
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (svc) => {
    setFormData({
      serviceCode: svc.serviceCode,
      serviceName: svc.serviceName,
      serviceType: svc.serviceType,
      price: svc.price,
      description: svc.description ?? "",
      status: svc.status,
    });
    setEditingId(svc.serviceId);
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
    if (!formData.price || Number(formData.price) < 0) {
      setFormError("Giá dịch vụ phải lớn hơn hoặc bằng 0.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...formData, price: Number(formData.price) };
      if (editingId) {
        await updateMedicalService(editingId, payload);
      } else {
        await createMedicalService(payload);
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

  /* ── Helpers ───────────────────────────────────────────── */
  const typeLabel = (type) =>
    SERVICE_TYPES.find((t) => t.value === type)?.label ?? type;

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  /* ── Render ────────────────────────────────────────────── */
  return (
    <>
      {/* ── Page Header ────────────────────────────────── */}
      <PageHeader
        title="Quản lý Dịch vụ y tế"
        icon={HeartPulse}
        iconColor="text-white"
        subtitle="Quản lý danh sách các dịch vụ y tế trong phòng khám."
        rightContent={
          <button className="bg-white text-teal-700 hover:bg-teal-50 font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-2" onClick={openCreate}>
            <Plus size={16} />
            Thêm dịch vụ
          </button>
        }
      />

      {/* ── Search Bar ─────────────────────────────────── */}
      <div className="search-bar" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm theo mã, tên hoặc mô tả..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="primary-button" style={{ flexShrink: 0 }} onClick={openCreate}>
          <Plus size={16} />
          Thêm dịch vụ
        </button>
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && <div className="error-box">{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="table-wrapper">
        <table className="data-table fixed-table">
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>Mã dịch vụ</th>
              <th>Tên dịch vụ</th>
              <th>Loại</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  {searchTerm
                    ? "Không tìm thấy dịch vụ nào."
                    : "Chưa có dịch vụ nào. Hãy thêm mới!"}
                </td>
              </tr>
            ) : (
              filtered.map((svc, idx) => (
                <tr key={svc.serviceId}>
                  <td>{idx + 1}</td>
                  <td><code>{svc.serviceCode}</code></td>
                  <td className="cell-name">{svc.serviceName}</td>
                  <td>
                    <span className="status-badge badge-info">
                      {typeLabel(svc.serviceType)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(svc.price)}</td>
                  <td>
                    <span
                      className={`status-badge ${svc.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}
                    >
                      {svc.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                    </span>
                  </td>
                  <td>
                    {svc.createdAt
                      ? new Date(svc.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className="icon-button"
                        title="Chỉnh sửa"
                        onClick={() => openEdit(svc)}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="icon-button btn-danger"
                        title="Xóa"
                        onClick={() => setDeleteTarget(svc)}
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
                {editingId ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
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
                  placeholder="VD: SVC001"
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
                  placeholder="VD: Khám tổng quát, Xét nghiệm máu..."
                />
              </div>

              <div className="field">
                <label htmlFor="serviceType">Loại dịch vụ *</label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="price">Giá (VNĐ) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="VD: 200000"
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
