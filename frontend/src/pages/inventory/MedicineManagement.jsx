import { useEffect, useState, useMemo } from "react";
import { Pill, Edit, Plus, Search, X, Trash2, ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createMedicine,
  getMedicines,
  updateMedicine,
  deleteMedicine,
} from "../../services/medicineService";
import PageHeader from "../../components/PageHeader";

const EMPTY_FORM = {
  medicineCode: "",
  medicineName: "",
  activeIngredient: "",
  dosageForm: "",
  strength: "",
  unit: "",
  rxnormCode: "",
  description: "",
  usageInstructions: "",
  status: "ACTIVE",
};

export default function MedicineManagement() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedId, setSelectedMedId] = useState(null);

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

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return medicines;
    const term = searchTerm.toLowerCase().trim();
    return medicines.filter(
      (m) =>
        (m.medicineName?.toLowerCase() || "").includes(term) ||
        (m.medicineCode?.toLowerCase() || "").includes(term) ||
        (m.activeIngredient?.toLowerCase() || "").includes(term)
    );
  }, [medicines, searchTerm]);

  // Default selection
  useEffect(() => {
    if (filtered && filtered.length > 0) {
      const exists = filtered.some(m => m.medicineId === selectedMedId);
      if (!exists) {
        setSelectedMedId(filtered[0].medicineId);
      }
    } else {
      setSelectedMedId(null);
    }
  }, [filtered, selectedMedId]);

  const selectedMed = useMemo(() => {
    return medicines.find(m => m.medicineId === selectedMedId) || null;
  }, [medicines, selectedMedId]);

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
      usageInstructions: med.usageInstructions ?? "",
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
    if (!formData.medicineName.trim()) {
      setFormError("Tên thuốc không được để trống.");
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
      if (err.errors) {
        const errorMessages = Object.values(err.errors).join(", ");
        setFormError(`Lỗi dữ liệu: ${errorMessages}`);
      } else {
        setFormError(err.message || "Có lỗi xảy ra");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa thuốc "${name}" không?`)) {
      try {
        setLoading(true);
        await deleteMedicine(id);
        setSelectedMedId(null);
        await fetchMedicines();
      } catch (err) {
        setError(err.message || "Xóa thất bại");
        setLoading(false);
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
              <Pill size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh Mục Thuốc</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">
            Quản lý danh sách các loại thuốc, hàm lượng, cách bào chế và trạng thái lưu hành.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo mã hoặc tên thuốc..." 
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
          onClick={openCreate}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold rounded-xl px-5 py-2.5 shadow-md shadow-teal-500/15 text-xs flex items-center justify-center gap-1.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Thêm thuốc mới
        </button>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Main Content Split Columns */}
      <div className="w-full flex-1 min-h-0">
        {loading && medicines.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Pill size={48} className="text-slate-300 mx-auto opacity-40 mb-3" />
            <div className="text-sm text-[#4A5D59] font-bold">Không tìm thấy thuốc nào phù hợp.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: List (5/12 width) */}
            <div className="lg:col-span-5 flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
              {filtered.map((med) => {
                const isSelected = med.medicineId === selectedMedId;
                return (
                  <button
                    key={med.medicineId}
                    onClick={() => setSelectedMedId(med.medicineId)}
                    className={`w-full text-left bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                      isSelected 
                        ? "border-[#1DB896] shadow-md ring-1 ring-[#1DB896]/20 bg-teal-50/5" 
                        : "border-slate-200/80 hover:border-slate-350 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1DB896]"></div>
                    )}
                    
                    {/* Top Row: Code & Status */}
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-teal-700 bg-teal-50/80 border border-teal-200/50 px-2 py-0.5 rounded text-[11px] font-bold">
                        {med.medicineCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                        med.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-slate-50 text-slate-450 border-slate-200'
                      }`}>
                        {med.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Name & Active Ingredient */}
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-2">
                        {med.medicineName}
                      </h4>
                      {med.activeIngredient && (
                        <p className="text-[10px] text-slate-400 font-semibold block leading-none mt-1">
                          Hoạt chất: {med.activeIngredient}
                        </p>
                      )}
                    </div>

                    <div className="h-px bg-slate-50 w-full"></div>

                    {/* Details footer */}
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                      <span>Dạng: {med.dosageForm || "—"}</span>
                      <span>Hàm lượng: {med.strength || "—"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Sticky Detail Panel (7/12 width) */}
            <div className="lg:col-span-7 sticky top-6">
              {selectedMed ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 animate-[fadeIn_0.25s_ease]">
                  
                  {/* Detail Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin dược phẩm</span>
                        <span className="text-[10px] bg-slate-100 text-slate-550 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200/60">
                          #{selectedMed.medicineCode}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                        <Pill size={18} className="text-[#1DB896] shrink-0" />
                        <span>{selectedMed.medicineName}</span>
                      </h2>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                      selectedMed.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-50 text-slate-450 border-slate-200'
                    }`}>
                      {selectedMed.status === 'ACTIVE' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                    </span>
                  </div>

                  {/* Details Card */}
                  <div className="flex flex-col gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Hoạt chất chính</span>
                        <strong className="text-slate-800 font-bold text-xs block">{selectedMed.activeIngredient || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Dạng bào chế</span>
                        <strong className="text-slate-800 font-bold text-xs block">{selectedMed.dosageForm || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Hàm lượng</span>
                        <strong className="text-slate-800 font-bold text-xs block">{selectedMed.strength || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Đơn vị cơ bản</span>
                        <strong className="text-slate-800 font-bold text-xs block">{selectedMed.unit || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Mã RxNorm</span>
                        <strong className="text-slate-800 font-mono text-xs block">{selectedMed.rxnormCode || "—"}</strong>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60 my-1"></div>

                    <div>
                      <span className="text-slate-450 font-bold block mb-1">Thành phần / Chức năng (Mô tả)</span>
                      <p className="text-slate-700 text-xs font-medium leading-relaxed bg-white border border-slate-150/50 rounded-xl p-3.5 mt-1 min-h-[50px]">
                        {selectedMed.description || "Chưa có thông tin mô tả chi tiết."}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-450 font-bold block mb-1">Hướng dẫn sử dụng mặc định</span>
                      <p className="text-slate-700 text-xs font-medium leading-relaxed bg-white border border-slate-150/50 rounded-xl p-3.5 mt-1 min-h-[50px]">
                        {selectedMed.usageInstructions || "Chưa có hướng dẫn sử dụng mặc định."}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => openEdit(selectedMed)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-[#F0F9F7] hover:text-[#1DB896] hover:border-[#1DB896]/35 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit size={14} /> Chỉnh sửa thông tin
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMed.medicineId, selectedMed.medicineName)}
                      className="px-5 py-2.5 rounded-xl border border-transparent bg-rose-50 text-rose-700 font-black hover:bg-rose-100 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Trash2 size={14} /> Xóa thuốc
                    </button>
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold flex flex-col items-center gap-3">
                  <Info size={40} className="text-slate-300" />
                  Chọn một thuốc ở danh sách bên trái để xem đầy đủ chi tiết và thực hiện quản lý cập nhật.
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
                  <Pill size={18} />
                </div>
                {editingId ? "Cập nhật thông tin dược phẩm" : "Thêm thuốc mới"}
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
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Mã thuốc (Để trống tự tạo)</label>
                  <input
                    name="medicineCode"
                    value={formData.medicineCode}
                    onChange={handleChange}
                    disabled={!!editingId}
                    placeholder="Nhập mã hoặc để trống..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all uppercase disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Tên thuốc *</label>
                  <input
                    name="medicineName"
                    required
                    value={formData.medicineName}
                    onChange={handleChange}
                    placeholder="Nhập tên thuốc..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Hoạt chất</label>
                  <input
                    name="activeIngredient"
                    value={formData.activeIngredient}
                    onChange={handleChange}
                    placeholder="Nhập hoạt chất chính..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Dạng bào chế</label>
                  <input
                    name="dosageForm"
                    value={formData.dosageForm}
                    onChange={handleChange}
                    placeholder="VD: Viên nén, Siro..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Hàm lượng (Strength)</label>
                  <input
                    name="strength"
                    value={formData.strength}
                    onChange={handleChange}
                    placeholder="VD: 500mg"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Đơn vị</label>
                  <input
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="VD: Viên, Chai, Hộp..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Thành phần / Chức năng (Mô tả)</label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Thành phần chi tiết..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Hướng dẫn sử dụng mặc định</label>
                <textarea
                  name="usageInstructions"
                  rows={2}
                  value={formData.usageInstructions}
                  onChange={handleChange}
                  placeholder="VD: Uống sau ăn..."
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
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Ngừng bán</option>
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
                  {submitting ? "Đang xử lý..." : "Lưu dược phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
