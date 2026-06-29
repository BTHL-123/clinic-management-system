import { useEffect, useState, useCallback, useMemo } from "react";
import { PackageOpen, Plus, Search, X, Edit, Trash2, ArrowLeft, Info, Calendar, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBatches, importBatch, updateBatch, deleteBatch } from "../../services/inventoryService";
import { getMedicines } from "../../services/medicineService";
import { getSuppliers } from "../../services/supplierService";
import PageHeader from "../../components/PageHeader";

const STATUS_MAP = {
  AVAILABLE: { label: "Còn hàng", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-250" },
  LOW_STOCK: { label: "Sắp hết", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-250" },
  NEAR_EXPIRY: { label: "Sắp hết hạn", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  EXPIRED: { label: "Hết hạn", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-150" },
  CANCELLED: { label: "Đã hủy", color: "text-slate-500", bg: "bg-slate-55/60", border: "border-slate-200" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "text-slate-650", bg: "bg-slate-50", border: "border-slate-200" };
  const dotMap = {
    AVAILABLE: "bg-emerald-500",
    LOW_STOCK: "bg-amber-500",
    NEAR_EXPIRY: "bg-orange-500",
    EXPIRED: "bg-rose-500",
    CANCELLED: "bg-slate-400",
  };
  const dotClass = dotMap[status] || "bg-slate-400";

  return (
    <span className={`${s.bg} ${s.color} ${s.border} border px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
      {s.label}
    </span>
  );
}

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
  const [selectedBatchId, setSelectedBatchId] = useState(null);

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

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return batches;
    const term = searchTerm.toLowerCase().trim();
    return batches.filter(
      (b) =>
        (b.medicineName?.toLowerCase() || "").includes(term) ||
        (b.batchNumber?.toLowerCase() || "").includes(term)
    );
  }, [batches, searchTerm]);

  // Set default selection
  useEffect(() => {
    if (filtered && filtered.length > 0) {
      const exists = filtered.some(b => b.batchId === selectedBatchId);
      if (!exists) {
        setSelectedBatchId(filtered[0].batchId);
      }
    } else {
      setSelectedBatchId(null);
    }
  }, [filtered, selectedBatchId]);

  const selectedBatch = useMemo(() => {
    return batches.find(b => b.batchId === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const selectedSupplier = useMemo(() => {
    if (!selectedBatch) return null;
    return suppliers.find(s => s.supplierId === selectedBatch.supplierId) || null;
  }, [selectedBatch, suppliers]);

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
        setSelectedBatchId(null);
        await fetchData();
      } catch (err) {
        setError(err.message || "Hủy lô thất bại");
      }
    }
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-1 relative text-slate-800 pb-8">
      
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shadow-sm">
              <PackageOpen size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lô Thuốc &amp; Nhập Kho</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">
            Quản lý hạn sử dụng, số lượng tồn kho của từng lô thuốc nhập kho dược phẩm.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên thuốc, số lô..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 font-bold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={openImport}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold rounded-xl px-5 py-2.5 shadow-md shadow-teal-500/15 text-xs flex items-center justify-center gap-1.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Nhập kho thuốc mới
        </button>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Main Content Split Columns */}
      <div className="w-full flex-1 min-h-0">
        {loading && batches.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <PackageOpen size={48} className="text-slate-300 mx-auto opacity-40 mb-3" />
            <div className="text-sm text-[#4A5D59] font-bold">Không tìm thấy lô thuốc nào phù hợp.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: List (5/12 width) */}
            <div className="lg:col-span-5 flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
              {filtered.map((b) => {
                const isSelected = b.batchId === selectedBatchId;
                return (
                  <button
                    key={b.batchId}
                    onClick={() => setSelectedBatchId(b.batchId)}
                    className={`w-full text-left bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                      isSelected 
                        ? "border-[#1DB896] shadow-md ring-1 ring-[#1DB896]/20 bg-teal-50/5" 
                        : "border-slate-200/80 hover:border-slate-350 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1DB896]"></div>
                    )}
                    
                    {/* Top Row: Expiry Date & Status */}
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <Calendar size={13} className="text-slate-400" />
                        <span>HSD: {b.expiryDate}</span>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Batch Number & Medicine */}
                    <div>
                      <span className="font-mono text-teal-700 bg-teal-50/80 border border-teal-200/50 px-2 py-0.5 rounded text-[11px] font-bold self-start mb-1.5 inline-block">
                        Lô: {b.batchNumber}
                      </span>
                      <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-2">
                        {b.medicineName}
                      </h4>
                    </div>

                    <div className="h-px bg-slate-50 w-full"></div>

                    {/* Quantity & Price footer */}
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                      <span>Tồn: <strong className="text-slate-800 font-bold">{b.currentQuantity}</strong> / {b.initialQuantity}</span>
                      <strong className="text-teal-700 font-black text-xs">
                        {b.sellingPrice?.toLocaleString("vi-VN")} đ
                      </strong>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Sticky Detail Panel (7/12 width) */}
            <div className="lg:col-span-7 sticky top-6">
              {selectedBatch ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 animate-[fadeIn_0.25s_ease]">
                  
                  {/* Detail Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết lô thuốc nhập</span>
                        <span className="text-[10px] bg-slate-100 text-slate-550 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200/60">
                          #{selectedBatch.batchNumber}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                        <PackageOpen size={18} className="text-[#1DB896] shrink-0" />
                        <span>{selectedBatch.medicineName}</span>
                      </h2>
                    </div>
                    <StatusBadge status={selectedBatch.status} />
                  </div>

                  {/* Details Card */}
                  <div className="flex flex-col gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Số lô hàng (Batch #)</span>
                        <strong className="text-slate-800 font-mono text-sm block">{selectedBatch.batchNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Hạn sử dụng (Expiry)</span>
                        <strong className="text-slate-800 font-bold text-xs block">{selectedBatch.expiryDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Ngày sản xuất</span>
                        <strong className="text-slate-800 font-bold text-xs block">{selectedBatch.manufactureDate || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Tồn kho hiện tại</span>
                        <strong className="text-slate-800 font-black text-sm block">
                          {selectedBatch.currentQuantity} <span className="text-[10px] text-slate-400 font-semibold">/ {selectedBatch.initialQuantity} nhập</span>
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Giá nhập kho</span>
                        <strong className="text-slate-700 font-bold text-xs block">
                          {selectedBatch.importPrice?.toLocaleString("vi-VN")} đ
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Giá bán niêm yết</span>
                        <strong className="text-teal-700 font-black text-sm block">
                          {selectedBatch.sellingPrice?.toLocaleString("vi-VN")} đ
                        </strong>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60 my-1"></div>

                    <div>
                      <span className="text-slate-450 font-bold block mb-1">Nhà cung cấp</span>
                      <strong className="text-slate-800 font-bold text-xs block">
                        {selectedSupplier?.supplierName || "Nhập kho thủ công / Không rõ nhà cung cấp"}
                      </strong>
                      {selectedSupplier && (
                        <p className="text-[10px] text-slate-450 mt-0.5 font-semibold">
                          Liên hệ: {selectedSupplier.phone || "—"} | {selectedSupplier.email || "—"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => openEdit(selectedBatch)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-[#F0F9F7] hover:text-[#1DB896] hover:border-[#1DB896]/35 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit size={14} /> Cập nhật giá & HSD
                    </button>
                    <button
                      onClick={() => handleDelete(selectedBatch.batchId, selectedBatch.batchNumber)}
                      className="px-5 py-2.5 rounded-xl border border-transparent bg-rose-50 text-rose-700 font-black hover:bg-rose-100 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Trash2 size={14} /> Hủy lô thuốc này
                    </button>
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold flex flex-col items-center gap-3">
                  <Info size={40} className="text-slate-300" />
                  Chọn một lô thuốc ở danh sách bên trái để xem chi tiết thông tin nhập kho và thực hiện điều chỉnh giá.
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]" onClick={closeForm}>
          <div className="bg-white p-7 rounded-[2rem] w-full max-w-2xl shadow-2xl relative border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F0F9F7] text-[#1DB896] border border-[#1DB896]/20">
                  <PackageOpen size={18} />
                </div>
                {editingId ? "Cập nhật giá & Hạn sử dụng" : "Nhập kho thuốc mới"}
              </h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                onClick={closeForm}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formError && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-semibold">{formError}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Chọn thuốc nhập kho *</label>
                  <select 
                    name="medicineId" 
                    value={formData.medicineId} 
                    onChange={handleChange} 
                    disabled={!!editingId}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-[#4A5D59] cursor-pointer disabled:opacity-50"
                  >
                    <option value="">-- Chọn thuốc --</option>
                    {medicines.map((m) => (
                      <option key={m.medicineId} value={m.medicineId}>
                        {m.medicineCode} - {m.medicineName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Nhà cung cấp</label>
                  <select 
                    name="supplierId" 
                    value={formData.supplierId} 
                    onChange={handleChange} 
                    disabled={!!editingId}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-[#4A5D59] cursor-pointer disabled:opacity-50"
                  >
                    <option value="">-- Không chọn / Nhập tay --</option>
                    {suppliers.map((s) => (
                      <option key={s.supplierId} value={s.supplierId}>
                        {s.supplierName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Số lô (Batch #) *</label>
                  <input
                    name="batchNumber"
                    required
                    value={formData.batchNumber}
                    onChange={handleChange}
                    disabled={!!editingId}
                    placeholder="VD: LOT-001"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Số lượng nhập *</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    disabled={!!editingId}
                    placeholder="Nhập số lượng..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-slate-800 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Ngày sản xuất</label>
                  <input
                    type="date"
                    name="manufactureDate"
                    value={formData.manufactureDate}
                    onChange={handleChange}
                    disabled={!!editingId}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-slate-800 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Ngày hết hạn *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    required
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-slate-800 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Giá nhập (VNĐ) *</label>
                  <input
                    type="number"
                    name="importPrice"
                    required
                    min="0"
                    value={formData.importPrice}
                    onChange={handleChange}
                    placeholder="Nhập giá nhập..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-slate-800 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Giá bán dự kiến (VNĐ) *</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    required
                    min="0"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    placeholder="Nhập giá bán..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                  onClick={closeForm}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0A604E] hover:bg-[#084f40] text-white font-black hover:shadow-md transition-colors disabled:opacity-50 text-xs flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? "Đang xử lý..." : "Lưu lô thuốc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
