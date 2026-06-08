import { useEffect, useState } from "react";
import { Truck, Edit, Trash2, Plus, Search, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
              <div className="bg-sky-500/20 p-2.5 rounded-xl border border-sky-500/30 text-sky-300">
                <Truck size={28} />
              </div>
              Nhà Cung Cấp
            </h1>
            <p className="text-white/70 font-medium mt-1 drop-shadow-sm">Quản lý danh sách nhà cung cấp thuốc.</p>
          </div>
        </div>
        <button className="bg-gradient-to-r from-sky-400 to-blue-400 hover:from-sky-300 hover:to-blue-300 text-slate-900 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-sky-400/30 transition-all flex items-center gap-2" onClick={openCreate}>
          <Plus size={18} strokeWidth={2.5} />
          Thêm nhà cung cấp
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-xl w-full">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/50">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/40 border border-white/10 text-white placeholder-white/40 text-sm rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-sky-400/50 transition-colors"
          />
        </div>

      {error && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl mb-6">{error}</div>}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/60 text-sm">
              <th className="p-4 font-semibold pb-3">#</th>
              <th className="p-4 font-semibold pb-3">Tên nhà cung cấp</th>
              <th className="p-4 font-semibold pb-3">Số điện thoại</th>
              <th className="p-4 font-semibold pb-3">Email</th>
              <th className="p-4 font-semibold pb-3">Địa chỉ</th>
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
                <td colSpan={7} className="p-8 text-center text-white/50">Không tìm thấy nhà cung cấp nào.</td>
              </tr>
            ) : (
              filtered.map((sup, idx) => (
                <tr key={sup.supplierId} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4">{idx + 1}</td>
                  <td className="p-4 font-semibold text-white">{sup.supplierName}</td>
                  <td className="p-4">{sup.phone || "—"}</td>
                  <td className="p-4">{sup.email || "—"}</td>
                  <td className="p-4">{sup.address || "—"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${sup.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-white/10 text-white/50 border-white/20"}`}>
                      {sup.status === "ACTIVE" ? "Hoạt động" : "Ngừng HĐ"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Chỉnh sửa" onClick={() => openEdit(sup)}>
                        <Edit size={16} />
                      </button>
                      <button 
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors" 
                        title="Ngừng hoạt động" 
                        onClick={() => handleDelete(sup.supplierId, sup.supplierName)}
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
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{editingId ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}</h2>
              <button className="text-white/50 hover:text-white transition-colors" onClick={closeForm}><X size={24} /></button>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {formError && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-3 rounded-xl text-sm">{formError}</div>}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Tên nhà cung cấp *</label>
                <input
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Số điện thoại</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Địa chỉ</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              {editingId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/80">Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 focus:outline-none [&>option]:bg-slate-800">
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors font-medium" onClick={closeForm}>Hủy</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-colors shadow-lg shadow-sky-500/30" disabled={submitting}>
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
