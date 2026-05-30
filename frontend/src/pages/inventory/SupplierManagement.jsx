import { useEffect, useState } from "react";
import { Truck, Edit, Trash2, Plus, Search, X } from "lucide-react";
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
} from "../../services/supplierService";

const EMPTY_FORM = {
  supplierName: "",
  phone: "",
  email: "",
  address: "",
  status: "ACTIVE",
};

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await getSuppliers();
      setSuppliers(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = suppliers.filter((s) =>
    s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (sup) => {
    setFormData({
      supplierName: sup.supplierName,
      phone: sup.phone ?? "",
      email: sup.email ?? "",
      address: sup.address ?? "",
      status: sup.status,
    });
    setEditingId(sup.supplierId);
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
    if (!formData.supplierName.trim()) {
      setFormError("Tên nhà cung cấp không được để trống.");
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await updateSupplier(editingId, formData);
      } else {
        await createSupplier(formData);
      }
      closeForm();
      await fetchSuppliers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn ngừng hoạt động nhà cung cấp "${name}" không?`)) {
      try {
        await deleteSupplier(id);
        await fetchSuppliers();
      } catch (err) {
        setError(err.message || "Xóa thất bại");
      }
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={26} />
            Nhà Cung Cấp
          </h1>
          <p className="muted">Quản lý danh sách nhà cung cấp thuốc.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={16} />
          Thêm nhà cung cấp
        </button>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên nhà cung cấp..."
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
              <th>Tên nhà cung cấp</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-row">Đang tải dữ liệu...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">Không tìm thấy nhà cung cấp nào.</td>
              </tr>
            ) : (
              filtered.map((sup, idx) => (
                <tr key={sup.supplierId}>
                  <td>{idx + 1}</td>
                  <td className="cell-name">{sup.supplierName}</td>
                  <td>{sup.phone || "—"}</td>
                  <td>{sup.email || "—"}</td>
                  <td>{sup.address || "—"}</td>
                  <td>
                    <span className={`status-badge ${sup.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}>
                      {sup.status === "ACTIVE" ? "Hoạt động" : "Ngừng HĐ"}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="icon-button" title="Chỉnh sửa" onClick={() => openEdit(sup)}>
                        <Edit size={15} />
                      </button>
                      <button 
                        className="icon-button" 
                        title="Ngừng hoạt động" 
                        onClick={() => handleDelete(sup.supplierId, sup.supplierName)}
                        style={{ color: "#ef4444" }}
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
              <h2>{editingId ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}</h2>
              <button className="icon-button" onClick={closeForm}><X size={18} /></button>
            </div>

            <form className="form-stack" onSubmit={handleSubmit}>
              {formError && <div className="error-box">{formError}</div>}

              <div className="field">
                <label>Tên nhà cung cấp *</label>
                <input
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Số điện thoại</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label>Địa chỉ</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              {editingId && (
                <div className="field">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm}>Hủy</button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : editingId ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
