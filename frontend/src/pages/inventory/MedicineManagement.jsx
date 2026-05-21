import { useEffect, useState } from "react";
import { Pill, Edit, Plus, Search, X } from "lucide-react";
import {
  createMedicine,
  getMedicines,
  updateMedicine,
} from "../../services/medicineService";

const EMPTY_FORM = {
  medicineCode: "",
  medicineName: "",
  activeIngredient: "",
  dosageForm: "",
  strength: "",
  unit: "",
  rxnormCode: "",
  description: "",
  status: "ACTIVE",
};

export default function MedicineManagement() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await getMedicines();
      setMedicines(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const filtered = medicines.filter(
    (m) =>
      m.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.medicineCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (med) => {
    setFormData({
      medicineCode: med.medicineCode,
      medicineName: med.medicineName,
      activeIngredient: med.activeIngredient ?? "",
      dosageForm: med.dosageForm ?? "",
      strength: med.strength ?? "",
      unit: med.unit ?? "",
      rxnormCode: med.rxnormCode ?? "",
      description: med.description ?? "",
      status: med.status,
    });
    setEditingId(med.medicineId);
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
    if (!formData.medicineCode.trim() || !formData.medicineName.trim()) {
      setFormError("Mã thuốc và Tên thuốc không được để trống.");
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await updateMedicine(editingId, formData);
      } else {
        await createMedicine(formData);
      }
      closeForm();
      await fetchMedicines();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Pill size={26} />
            Danh mục Thuốc
          </h1>
          <p className="muted">Quản lý danh sách các loại thuốc.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={16} />
          Thêm thuốc mới
        </button>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm theo mã hoặc tên thuốc..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã thuốc</th>
              <th>Tên thuốc</th>
              <th>Hoạt chất</th>
              <th>Dạng bào chế</th>
              <th>Đơn vị</th>
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
                <td colSpan={7} className="empty-row">Không tìm thấy thuốc nào.</td>
              </tr>
            ) : (
              filtered.map((med) => (
                <tr key={med.medicineId}>
                  <td><strong>{med.medicineCode}</strong></td>
                  <td className="cell-name">{med.medicineName}</td>
                  <td>{med.activeIngredient || "—"}</td>
                  <td>{med.dosageForm || "—"}</td>
                  <td>{med.unit || "—"}</td>
                  <td>
                    <span className={`status-badge ${med.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}>
                      {med.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="icon-button" title="Chỉnh sửa" onClick={() => openEdit(med)}>
                        <Edit size={15} />
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
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Cập nhật thuốc" : "Thêm thuốc mới"}</h2>
              <button className="icon-button" onClick={closeForm}><X size={18} /></button>
            </div>

            <form className="form-stack" onSubmit={handleSubmit}>
              {formError && <div className="error-box">{formError}</div>}

              <div className="form-grid">
                <div className="field">
                  <label>Mã thuốc *</label>
                  <input
                    name="medicineCode"
                    value={formData.medicineCode}
                    onChange={handleChange}
                    disabled={!!editingId}
                    autoFocus
                  />
                </div>
                <div className="field">
                  <label>Tên thuốc *</label>
                  <input
                    name="medicineName"
                    value={formData.medicineName}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label>Hoạt chất</label>
                  <input
                    name="activeIngredient"
                    value={formData.activeIngredient}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label>Dạng bào chế</label>
                  <input
                    name="dosageForm"
                    value={formData.dosageForm}
                    onChange={handleChange}
                    placeholder="VD: Viên nén, Siro..."
                  />
                </div>
                <div className="field">
                  <label>Hàm lượng (Strength)</label>
                  <input
                    name="strength"
                    value={formData.strength}
                    onChange={handleChange}
                    placeholder="VD: 500mg"
                  />
                </div>
                <div className="field">
                  <label>Đơn vị</label>
                  <input
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="VD: Viên, Hộp, Vỉ..."
                  />
                </div>
              </div>

              <div className="field">
                <label>Mô tả / Ghi chú</label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {editingId && (
                <div className="field">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Ngừng bán</option>
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
