import { useEffect, useState } from "react";
import { PackageOpen, Plus, Search, X, Edit, Trash2 } from "lucide-react";
import { getBatches, importBatch, updateBatch, deleteBatch } from "../../services/inventoryService";
import { getMedicines } from "../../services/medicineService";
import { getSuppliers } from "../../services/supplierService";

const EMPTY_FORM = {
  medicineId: "",
  supplierId: "",
  batchNumber: "",
  manufactureDate: "",
  expiryDate: "",
  importPrice: "",
  sellingPrice: "",
  quantity: "",
};

export default function InventoryBatches() {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resBatches, resMeds, resSups] = await Promise.all([
        getBatches(),
        getMedicines({ size: 1000, status: "ACTIVE" }),
        getSuppliers({ size: 1000, status: "ACTIVE" })
      ]);
      setBatches(resBatches.data?.content ?? []);
      setMedicines(resMeds.data?.content ?? []);
      setSuppliers(resSups.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = batches.filter(
    (b) =>
      b.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openImport = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (batch) => {
    setFormData({
      medicineId: batch.medicineId,
      supplierId: batch.supplierId || "",
      batchNumber: batch.batchNumber,
      manufactureDate: batch.manufactureDate || "",
      expiryDate: batch.expiryDate || "",
      importPrice: batch.importPrice || "",
      sellingPrice: batch.sellingPrice || "",
      quantity: batch.initialQuantity || "",
    });
    setEditingId(batch.batchId);
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
    if (!formData.expiryDate || !formData.importPrice || !formData.sellingPrice) {
      setFormError("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await updateBatch(editingId, {
          expiryDate: formData.expiryDate,
          importPrice: parseFloat(formData.importPrice),
          sellingPrice: parseFloat(formData.sellingPrice)
        });
      } else {
        if (!formData.medicineId || !formData.batchNumber || !formData.quantity) {
          setFormError("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
          setSubmitting(false);
          return;
        }
        await importBatch({
          ...formData,
          medicineId: parseInt(formData.medicineId, 10),
          supplierId: formData.supplierId ? parseInt(formData.supplierId, 10) : null,
          importPrice: parseFloat(formData.importPrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          quantity: parseInt(formData.quantity, 10),
        });
      }
      closeForm();
      await fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, batchNumber) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy/xóa mềm lô "${batchNumber}" không?`)) {
      try {
        await deleteBatch(id);
        await fetchData();
      } catch (err) {
        setError(err.message || "Hủy lô thất bại");
      }
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <PackageOpen size={26} />
            Lô Thuốc & Nhập Kho
          </h1>
          <p className="muted">Quản lý lô thuốc hiện tại và thực hiện nhập kho mới.</p>
        </div>
        <button className="primary-button" onClick={openImport}>
          <Plus size={16} />
          Nhập kho
        </button>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên thuốc hoặc số lô..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Thuốc</th>
              <th>Số lô</th>
              <th>Ngày hết hạn</th>
              <th>Giá bán</th>
              <th>Tồn hiện tại</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-row">Đang tải dữ liệu...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">Không tìm thấy lô thuốc nào.</td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.batchId}>
                  <td><strong>{b.medicineName}</strong></td>
                  <td>{b.batchNumber}</td>
                  <td>{b.expiryDate}</td>
                  <td>{b.sellingPrice?.toLocaleString("vi-VN")} đ</td>
                  <td>
                    <strong>{b.currentQuantity}</strong> / {b.initialQuantity}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      b.status === "AVAILABLE" ? "badge-active"
                      : b.status === "NEAR_EXPIRY" ? "badge-warning"
                      : "badge-inactive"
                    }`}>
                      {b.status === "AVAILABLE" ? "Còn hàng"
                      : b.status === "LOW_STOCK" ? "Sắp hết"
                      : b.status === "NEAR_EXPIRY" ? "Sắp hết hạn"
                      : b.status === "EXPIRED" ? "Hết hạn"
                      : b.status === "CANCELLED" ? "Đã hủy"
                      : "Hết hàng"}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="icon-button" title="Chỉnh sửa" onClick={() => openEdit(b)}>
                        <Edit size={15} />
                      </button>
                      <button 
                        className="icon-button" 
                        title="Hủy lô" 
                        onClick={() => handleDelete(b.batchId, b.batchNumber)}
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
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Cập nhật lô thuốc" : "Nhập kho thuốc"}</h2>
              <button className="icon-button" onClick={closeForm}><X size={18} /></button>
            </div>

            <form className="form-stack" onSubmit={handleSubmit}>
              {formError && <div className="error-box">{formError}</div>}

              <div className="form-grid">
                <div className="field">
                  <label>Chọn thuốc *</label>
                  <select name="medicineId" value={formData.medicineId} onChange={handleChange} disabled={!!editingId}>
                    <option value="">-- Chọn thuốc --</option>
                    {medicines.map((m) => (
                      <option key={m.medicineId} value={m.medicineId}>
                        {m.medicineCode} - {m.medicineName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Nhà cung cấp</label>
                  <select name="supplierId" value={formData.supplierId} onChange={handleChange} disabled={!!editingId}>
                    <option value="">-- Tự nhập / Không chọn --</option>
                    {suppliers.map((s) => (
                      <option key={s.supplierId} value={s.supplierId}>
                        {s.supplierName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Số lô (Batch Number) *</label>
                  <input
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleChange}
                    disabled={!!editingId}
                  />
                </div>
                <div className="field">
                  <label>Ngày sản xuất</label>
                  <input
                    type="date"
                    name="manufactureDate"
                    value={formData.manufactureDate}
                    onChange={handleChange}
                    disabled={!!editingId}
                  />
                </div>
                <div className="field">
                  <label>Ngày hết hạn *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label>Số lượng nhập *</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    disabled={!!editingId}
                  />
                </div>
                <div className="field">
                  <label>Giá nhập (VNĐ) *</label>
                  <input
                    type="number"
                    name="importPrice"
                    min="0"
                    value={formData.importPrice}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label>Giá bán dự kiến (VNĐ) *</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm}>Hủy</button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : (editingId ? "Cập nhật" : "Nhập kho")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
