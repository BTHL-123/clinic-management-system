import { useEffect, useState, useMemo } from "react";
import { Truck, Edit, Trash2, Plus, Search, X, ArrowLeft, Info, Phone, Mail, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
} from "../../services/supplierService";
import PageHeader from "../../components/PageHeader";

export default function SupplierManagement() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupId, setSelectedSupId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    phone: "",
    email: "",
    address: "",
    status: "ACTIVE",
  });
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

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const term = searchTerm.toLowerCase().trim();
    return suppliers.filter((s) =>
      (s.supplierName?.toLowerCase() || "").includes(term) ||
      (s.phone || "").includes(term) ||
      (s.email?.toLowerCase() || "").includes(term)
    );
  }, [suppliers, searchTerm]);

  // Set default selection
  useEffect(() => {
    if (filtered && filtered.length > 0) {
      const exists = filtered.some(s => s.supplierId === selectedSupId);
      if (!exists) {
        setSelectedSupId(filtered[0].supplierId);
      }
    } else {
      setSelectedSupId(null);
    }
  }, [filtered, selectedSupId]);

  const selectedSup = useMemo(() => {
    return suppliers.find(s => s.supplierId === selectedSupId) || null;
  }, [suppliers, selectedSupId]);

  const openCreate = () => {
    setFormData({
      supplierName: "",
      phone: "",
      email: "",
      address: "",
      status: "ACTIVE",
    });
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
        setSelectedSupId(null);
        await fetchSuppliers();
      } catch (err) {
        setError(err.message || "Xóa thất bại");
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
              <Truck size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nhà Cung Cấp</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">
            Quản lý danh sách các nhà cung cấp phân phối dược phẩm cho phòng khám.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên nhà cung cấp, số điện thoại..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 font-bold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-slate-400 hover:text-slate-655 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold rounded-xl px-5 py-2.5 shadow-md shadow-teal-500/15 text-xs flex items-center justify-center gap-1.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Thêm nhà cung cấp
        </button>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Main Content Split Columns - Always render grid */}
      <div className="w-full flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: List (5/12 width) */}
          <div className="lg:col-span-5 flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
            {loading && suppliers.length === 0 ? (
              <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6">
                <Truck size={40} className="text-slate-300 mx-auto opacity-40 mb-3" />
                <div className="text-xs text-[#4A5D59] font-bold">Chưa có nhà cung cấp nào phù hợp.</div>
              </div>
            ) : (
              filtered.map((sup) => {
                const isSelected = sup.supplierId === selectedSupId;
                return (
                  <button
                    key={sup.supplierId}
                    onClick={() => setSelectedSupId(sup.supplierId)}
                    className={`w-full text-left bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                      isSelected 
                        ? "border-[#1DB896] shadow-md ring-1 ring-[#1DB896]/20 bg-teal-50/5" 
                        : "border-slate-200/80 hover:border-slate-350 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1DB896]"></div>
                    )}
                    
                    {/* Top Row: Name & Status */}
                    <div className="flex justify-between items-center w-full">
                      <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-1 flex-1 pr-2">
                        {sup.supplierName}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider shrink-0 ${
                        sup.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-slate-50 text-slate-450 border-slate-200'
                      }`}>
                        {sup.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng HĐ'}
                      </span>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Contact details summary */}
                    <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-semibold">
                      {sup.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          {sup.phone}
                        </span>
                      )}
                      {sup.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" />
                          {sup.email}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Sticky Detail Panel (7/12 width) */}
          <div className="lg:col-span-7 sticky top-6">
            {selectedSup ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 animate-[fadeIn_0.25s_ease]">
                
                {/* Detail Header */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hồ sơ nhà cung cấp</span>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                      <Truck size={18} className="text-[#1DB896] shrink-0" />
                      <span>{selectedSup.supplierName}</span>
                    </h2>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                    selectedSup.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-slate-50 text-slate-450 border-slate-200'
                  }`}>
                    {selectedSup.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>

                {/* Details Card */}
                <div className="flex flex-col gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <Phone size={14} className="text-[#1DB896] mt-0.5" />
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Số điện thoại liên hệ</span>
                        <strong className="text-slate-800 font-bold text-xs">{selectedSup.phone || "—"}</strong>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60 my-1"></div>

                    <div className="flex items-start gap-3">
                      <Mail size={14} className="text-[#1DB896] mt-0.5" />
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Thư điện tử (Email)</span>
                        <strong className="text-slate-800 font-bold text-xs block">{selectedSup.email || "—"}</strong>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60 my-1"></div>

                    <div className="flex items-start gap-3">
                      <MapPin size={14} className="text-[#1DB896] mt-0.5" />
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Địa chỉ văn phòng / Kho hàng</span>
                        <strong className="text-slate-700 font-medium text-xs leading-relaxed block mt-0.5">
                          {selectedSup.address || "—"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => openEdit(selectedSup)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-[#F0F9F7] hover:text-[#1DB896] hover:border-[#1DB896]/35 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit size={14} /> Chỉnh sửa thông tin
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSup.supplierId, selectedSup.supplierName)}
                    className="px-5 py-2.5 rounded-xl border border-transparent bg-rose-50 text-rose-700 font-black hover:bg-rose-100 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Trash2 size={14} /> Ngừng hoạt động
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold flex flex-col items-center gap-3">
                <Info size={40} className="text-slate-300" />
                Chọn một nhà cung cấp ở danh sách bên trái để xem đầy đủ chi tiết liên hệ và địa chỉ kho.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]" onClick={closeForm}>
          <div className="bg-white p-7 rounded-[2rem] w-full max-w-lg shadow-2xl relative border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F0F9F7] text-[#1DB896] border border-[#1DB896]/20">
                  <Truck size={18} />
                </div>
                {editingId ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
              </h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                onClick={closeForm}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formError && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-semibold">{formError}</div>}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Tên nhà cung cấp *</label>
                <input
                  name="supplierName"
                  required
                  value={formData.supplierName}
                  onChange={handleChange}
                  placeholder="Nhập tên đơn vị nhà cung cấp..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Số điện thoại liên hệ</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Địa chỉ thư điện tử (Email)</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Địa chỉ văn phòng / Kho hàng</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Nhập số nhà, tên đường, tỉnh thành..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all resize-none"
                />
              </div>

              {editingId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Trạng thái</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-[#4A5D59] cursor-pointer"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                </div>
              )}

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
                  {submitting ? "Đang xử lý..." : "Lưu thông tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
