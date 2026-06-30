import { useEffect, useState } from "react";
import { PackageOpen, Plus, Search, X, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBatches, importBatch, updateBatch, deleteBatch } from "../../services/inventoryService";
import { getMedicines } from "../../services/medicineService";
import { getSuppliers } from "../../services/supplierService";
import PageHeader from "../../components/PageHeader";

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
  const navigate = useNavigate();
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
      <div className="w-full flex flex-col items-center">
        <PageHeader
          title="Lô Thuốc &amp; Nhập Kho"
          icon={PackageOpen}
          iconColor="text-white"
          subtitle="Quản lý lô thuốc hiện tại và thực hiện nhập kho mới."
          onBack={() => navigate("/dashboard")}
          rightContent={
            <button className="bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-300 hover:to-purple-300 text-slate-900 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-400/30 transition-all flex items-center gap-2" onClick={openImport}>
              <Plus size={18} strokeWidth={2.5} />
              Nhập kho
            </button>
          }
        />

        <div className="patient-glass-panel patient-glass-panel-clear rounded-[3rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] border-0 w-full">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên thuốc hoặc số lô..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/5 border border-slate-900/10 text-slate-900 placeholder-slate-500 text-sm rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-indigo-500/50 transition-colors backdrop-blur-sm font-bold"
            />
          </div>

          {error && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl mb-6">{error}</div>}

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/10 text-[#0f766e] text-sm">
                  <th className="p-4 font-bold pb-3">Thuốc</th>
                  <th className="p-4 font-bold pb-3">Số lô</th>
                  <th className="p-4 font-bold pb-3">Ngày hết hạn</th>
                  <th className="p-4 font-bold pb-3">Giá bán</th>
                  <th className="p-4 font-bold pb-3">Tồn hiện tại</th>
                  <th className="p-4 font-bold pb-3">Trạng thái</th>
                  <th className="p-4 font-bold pb-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-800 font-bold">Đang tải dữ liệu...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-900 font-bold">Không tìm thấy lô thuốc nào.</td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.batchId} className="border-b border-slate-900/10 hover:bg-slate-900/5 transition-colors group">
                      <td className="p-4 font-bold text-slate-900">{b.medicineName}</td>
                      <td className="p-4 font-bold">{b.batchNumber}</td>
                      <td className="p-4 font-bold">{b.expiryDate}</td>
                      <td className="p-4 font-bold text-emerald-700">{b.sellingPrice?.toLocaleString("vi-VN")} đ</td>
                      <td className="p-4 font-bold">
                        <span className="text-slate-900">{b.currentQuantity}</span> <span className="text-slate-500">/ {b.initialQuantity}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${b.status === "AVAILABLE" ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
                            : b.status === "NEAR_EXPIRY" ? "bg-amber-500/20 text-amber-700 border-amber-500/30"
                              : "bg-slate-900/10 text-slate-600 border-slate-900/20"
                          }`}>
                          {b.status === "AVAILABLE" ? "Còn hàng"
                            : b.status === "LOW_STOCK" ? "Sắp hết"
                              : b.status === "NEAR_EXPIRY" ? "Sắp hết hạn"
                                : b.status === "EXPIRED" ? "Hết hạn"
                                  : b.status === "CANCELLED" ? "Đã hủy"
                                    : "Hết hàng"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-slate-900/5 hover:bg-slate-900/10 rounded-lg text-slate-700 transition-colors" title="Chỉnh sửa" onClick={() => openEdit(b)}>
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-700 transition-colors"
                            title="Hủy lô"
                            onClick={() => handleDelete(b.batchId, b.batchNumber)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{editingId ? "Cập nhật lô thuốc" : "Nhập kho thuốc"}</h2>
                <button className="text-white/50 hover:text-white transition-colors" onClick={closeForm}><X size={24} /></button>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {formError && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-3 rounded-xl text-sm">{formError}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/80">Chọn thuốc *</label>
                    <select name="medicineId" value={formData.medicineId} onChange={handleChange} disabled={!!editingId} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-400 focus:outline-none disabled:opacity-50 [&>option]:bg-slate-800">
                      <option value="">-- Chọn thuốc --</option>
                      {medicines.map((m) => (
                        <option key={m.medicineId} value={m.medicineId}>
                          {m.medicineCode} - {m.medicineName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/80">Nhà cung cấp</label>
                    <select name="supplierId" value={formData.supplierId} onChange={handleChange} disabled={!!editingId} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-400 focus:outline-none disabled:opacity-50 [&>option]:bg-slate-800">
                      <option value="">-- Tự nhập / Không chọn --</option>
                      {suppliers.map((s) => (
                        <option key={s.supplierId} value={s.supplierId}>
                          {s.supplierName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/80">Số lô (Batch Number) *</label>
                    <input
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      disabled={!!editingId}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-400 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/80">Ngày sản xuất</label>
                    <input
                      type="date"
                      name="manufactureDate"
                      value={formData.manufactureDate}
                      onChange={handleChange}
                      disabled={!!editingId}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-400 focus:outline-none disabled:opacity-50 [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/80">Ngày hết hạn *</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-400 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/80">Số lượng nhập *</label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      disabled={!!editingId}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-400 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/80">Giá nhập (VNĐ) *</label>
                    <input
                      type="number"
                      name="importPrice"
                      min="0"
                      value={formData.importPrice}
                      onChange={handleChange}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/80">Giá bán dự kiến (VNĐ) *</label>
                    <input
                      type="number"
                      name="sellingPrice"
                      min="0"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors font-medium" onClick={closeForm}>Hủy</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-colors shadow-lg shadow-indigo-500/30" disabled={submitting}>
                    {submitting ? "Đang xử lý..." : (editingId ? "Cập nhật" : "Nhập kho")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
