import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, Search, Filter, Stethoscope } from "lucide-react";
import { getLabTests, createLabTest, updateLabTest, deleteLabTest } from "../../services/labTestService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

const EMPTY_LAB_TEST = {
  testCode: "",
  testName: "",
  description: "",
  price: 0,
  status: "ACTIVE",
};

export default function LabTestManagement() {
  const toast = useToast();
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_LAB_TEST);
  const [saving, setSaving] = useState(false);

  const fetchLabTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLabTests({
        keyword,
        status: filterStatus || undefined,
        page: currentPage,
        size: 10,
      });
      setLabTests(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
      setError("");
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh sách xét nghiệm.");
    } finally {
      setLoading(false);
    }
  }, [keyword, filterStatus, currentPage]);

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  const handleOpenModal = (test = null) => {
    if (test) {
      setEditingId(test.labTestId);
      setFormData({
        testCode: test.testCode,
        testName: test.testName,
        description: test.description || "",
        price: test.price,
        status: test.status,
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_LAB_TEST);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_LAB_TEST);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.testCode.trim() || !formData.testName.trim()) {
      toast.error("Vui lòng điền mã và tên xét nghiệm.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateLabTest(editingId, formData);
        toast.success("Cập nhật thành công.");
      } else {
        await createLabTest(formData);
        toast.success("Thêm xét nghiệm thành công.");
      }
      handleCloseModal();
      fetchLabTests();
    } catch (err) {
      toast.error(err, "Không thể lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa xét nghiệm: ${name}?`)) return;
    try {
      await deleteLabTest(id);
      toast.success("Đã xóa xét nghiệm.");
      fetchLabTests();
    } catch (err) {
      toast.error(err, "Lỗi khi xóa");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-10 px-4 sm:px-6">
      <PageHeader
        title="Danh Mục Xét Nghiệm"
        icon={Stethoscope}
        iconColor="text-teal-500"
        subtitle="Quản lý danh sách các loại xét nghiệm, cập nhật mã và giá niêm yết."
      />

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between mb-6 w-full">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setCurrentPage(0); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0); }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl pl-10 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all appearance-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#1DB896] hover:bg-[#159a7c] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
        >
          <Plus size={18} /> Thêm xét nghiệm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/75 border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] w-36">Mã XN</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Tên Xét Nghiệm</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Mô tả</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] text-right w-36">Giá tiền</th>
                <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] text-center w-36">Trạng thái</th>
                <th className="p-4 pr-6 font-extrabold text-slate-500 uppercase tracking-wider text-[11px] text-right w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Đang tải dữ liệu...</td>
                </tr>
              ) : labTests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Không tìm thấy xét nghiệm nào.</td>
                </tr>
              ) : (
                labTests.map((t) => (
                  <tr key={t.labTestId} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors duration-200">
                    <td className="p-4 pl-6 font-bold text-[#1DB896]">{t.testCode}</td>
                    <td className="p-4 font-bold text-slate-800">{t.testName}</td>
                    <td className="p-4 text-slate-500 truncate max-w-[240px] text-xs font-semibold">{t.description || "—"}</td>
                    <td className="p-4 font-bold text-slate-700 text-right">
                      {t.price.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {t.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'NGỪNG HĐ'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(t)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.labTestId, t.testName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-center gap-2 border-t border-slate-100">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm border border-slate-200 cursor-pointer"
            >
              Trước
            </button>
            <span className="text-xs font-semibold text-slate-500 px-2 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm border border-slate-200 cursor-pointer"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4" onClick={handleCloseModal}>
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl relative border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-teal-600">
                <Stethoscope size={16} />
              </div>
              {editingId ? "Cập nhật xét nghiệm" : "Thêm xét nghiệm mới"}
            </h3>

            <form onSubmit={handleSave} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Mã Xét Nghiệm *</label>
                  <input
                    required
                    type="text"
                    value={formData.testCode}
                    onChange={(e) => setFormData({ ...formData, testCode: e.target.value.toUpperCase() })}
                    placeholder="VD: XN01"
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Giá tiền (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Tên Xét Nghiệm *</label>
                <input
                  required
                  type="text"
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  placeholder="VD: Xét nghiệm sinh hóa máu..."
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Mô tả</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Chức năng, lưu ý của loại xét nghiệm này..."
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold transition-all"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold transition-all text-sm cursor-pointer"
                  onClick={handleCloseModal}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {saving ? "Đang lưu..." : "Lưu dữ liệu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
