import { useEffect, useState } from "react";
import { Pill, Edit, Plus, Search, X, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createMedicine,
  getMedicines,
  updateMedicine,
  deleteMedicine,
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
  const navigate = useNavigate();
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
        await fetchMedicines();
      } catch (err) {
        setError(err.message || "Xóa thất bại");
        setLoading(false);
      }
    }
  };

  return (
    <>
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white p-2 rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 drop-shadow-md">
              <div className="bg-teal-500/20 p-2.5 rounded-xl border border-teal-500/30 text-teal-300">
                <Pill size={28} />
              </div>
              Danh mục Thuốc
            </h1>
            <p className="text-white/70 font-medium mt-1 drop-shadow-sm">Quản lý danh sách các loại thuốc.</p>
          </div>
        </div>
        <button className="bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-900 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-teal-400/30 transition-all flex items-center gap-2" onClick={openCreate}>
          <Plus size={18} strokeWidth={2.5} />
          Thêm thuốc mới
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-xl w-full">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/50">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã hoặc tên thuốc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/40 border border-white/10 text-white placeholder-white/40 text-sm rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-teal-400/50 transition-colors"
          />
        </div>

      {error && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl mb-6">{error}</div>}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/60 text-sm">
              <th className="p-4 font-semibold pb-3">Mã thuốc</th>
              <th className="p-4 font-semibold pb-3">Tên thuốc</th>
              <th className="p-4 font-semibold pb-3">Hoạt chất</th>
              <th className="p-4 font-semibold pb-3">Dạng bào chế</th>
              <th className="p-4 font-semibold pb-3">Đơn vị</th>
              <th className="p-4 font-semibold pb-3">Trạng thái</th>
              <th className="p-4 font-semibold pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-white/50">Đang tải dữ liệu...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-white/50">Không tìm thấy thuốc nào.</td>
              </tr>
            ) : (
              filtered.map((med) => (
                <tr key={med.medicineId} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4"><strong>{med.medicineCode}</strong></td>
                  <td className="p-4 font-semibold text-white">{med.medicineName}</td>
                  <td className="p-4">{med.activeIngredient || "—"}</td>
                  <td className="p-4">{med.dosageForm || "—"}</td>
                  <td className="p-4">{med.unit || "—"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${med.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-white/10 text-white/50 border-white/20"}`}>
                      {med.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Chỉnh sửa" onClick={() => openEdit(med)}>
                        <Edit size={16} />
                      </button>
                      <button className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors" title="Xóa" onClick={() => handleDelete(med.medicineId, med.medicineName)}>
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
              <h2 className="text-2xl font-bold text-white">{editingId ? "Cập nhật thuốc" : "Thêm thuốc mới"}</h2>
              <button className="text-white/50 hover:text-white transition-colors" onClick={closeForm}><X size={24} /></button>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {formError && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-3 rounded-xl text-sm">{formError}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/80">Mã thuốc (Bỏ trống để tự động tạo)</label>
                  <input
                    name="medicineCode"
                    value={formData.medicineCode}
                    onChange={handleChange}
                    disabled={!!editingId}
                    placeholder="Nhập mã hoặc để trống..."
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none disabled:opacity-50"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/80">Tên thuốc *</label>
                  <input
                    name="medicineName"
                    value={formData.medicineName}
                    onChange={handleChange}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/80">Hoạt chất</label>
                  <input
                    name="activeIngredient"
                    value={formData.activeIngredient}
                    onChange={handleChange}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/80">Dạng bào chế</label>
                  <input
                    name="dosageForm"
                    value={formData.dosageForm}
                    onChange={handleChange}
                    placeholder="VD: Viên nén, Siro..."
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/80">Hàm lượng (Strength)</label>
                  <input
                    name="strength"
                    value={formData.strength}
                    onChange={handleChange}
                    placeholder="VD: 500mg"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/80">Đơn vị</label>
                  <input
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="VD: Viên, Hộp, Vỉ..."
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Mô tả / Ghi chú</label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              {editingId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/80">Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none [&>option]:bg-slate-800">
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Ngừng bán</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors font-medium" onClick={closeForm}>Hủy</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold transition-colors shadow-lg shadow-teal-500/30" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : editingId ? "Cập nhật" : "Thêm mới"}
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
