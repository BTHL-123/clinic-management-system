import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, Search, Filter, Stethoscope, X, Info, DollarSign, Activity, FileText } from "lucide-react";
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
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTestId, setSelectedTestId] = useState(null);

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
        size: 20, // Increased size for a better list experience
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
      setSelectedTestId(null);
      fetchLabTests();
    } catch (err) {
      toast.error(err, "Lỗi khi xóa");
    }
  };

  // Set default selection when data changes
  useEffect(() => {
    if (labTests && labTests.length > 0) {
      const exists = labTests.some(t => t.labTestId === selectedTestId);
      if (!exists) {
        setSelectedTestId(labTests[0].labTestId);
      }
    } else {
      setSelectedTestId(null);
    }
  }, [labTests, selectedTestId]);

  const selectedTest = useMemo(() => {
    return labTests.find(t => t.labTestId === selectedTestId) || null;
  }, [labTests, selectedTestId]);

  const tabs = [
    { key: "ACTIVE", label: "Đang hoạt động" },
    { key: "INACTIVE", label: "Ngừng hoạt động" },
    { key: "", label: "Tất cả danh mục" },
  ];

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-1 relative text-slate-800 pb-8">
      
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shadow-sm">
              <Stethoscope size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh Mục Xét Nghiệm</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">
            Quản lý danh sách danh mục các xét nghiệm cận lâm sàng, cập nhật giá và thông tin mô tả.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setFilterStatus(t.key); setCurrentPage(0); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === t.key 
                ? "bg-[#0A604E] text-white shadow-[0_4px_12px_rgba(10,96,78,0.15)]" 
                : "bg-white border border-slate-200 text-[#4A5D59] hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo mã hoặc tên dịch vụ xét nghiệm..." 
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(0); }}
            className="w-full bg-transparent border-none px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 font-bold"
          />
          {keyword && (
            <button
              onClick={() => { setKeyword(""); setCurrentPage(0); }}
              className="text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold rounded-xl px-5 py-2.5 shadow-md shadow-teal-500/15 text-xs flex items-center justify-center gap-1.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Thêm xét nghiệm mới
        </button>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Main Content Split Columns */}
      <div className="w-full flex-1 min-h-0">
        {loading && labTests.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
          </div>
        ) : labTests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Stethoscope size={48} className="text-slate-300 mx-auto opacity-40 mb-3" />
            <div className="text-sm text-[#4A5D59] font-bold">Không tìm thấy dịch vụ xét nghiệm nào.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: List (5/12 width) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex flex-col gap-4 max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar pr-1">
                {labTests.map((t) => {
                  const isSelected = t.labTestId === selectedTestId;
                  return (
                    <button
                      key={t.labTestId}
                      onClick={() => setSelectedTestId(t.labTestId)}
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
                          {t.testCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                          t.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                            : 'bg-slate-50 text-slate-450 border-slate-200'
                        }`}>
                          {t.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng HĐ'}
                        </span>
                      </div>

                      <div className="h-px bg-slate-100 w-full"></div>

                      {/* Name */}
                      <div className="text-[13px] font-black text-slate-800 leading-relaxed break-words py-1">
                        {t.testName}
                      </div>

                      <div className="h-px bg-slate-50 w-full"></div>

                      {/* Price */}
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>Giá niêm yết:</span>
                        <strong className="text-slate-800 font-black text-sm">
                          {t.price.toLocaleString("vi-VN")} đ
                        </strong>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl shadow-sm">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-default transition-all border border-slate-200 cursor-pointer"
                  >
                    Trước
                  </button>
                  <span className="text-[11px] font-bold text-[#4A5D59] px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    Trang {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-default transition-all border border-slate-200 cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Detail Panel (7/12 width) */}
            <div className="lg:col-span-7 sticky top-6">
              {selectedTest ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 animate-[fadeIn_0.25s_ease]">
                  
                  {/* Detail Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin danh mục</span>
                        <span className="text-[10px] bg-slate-100 text-slate-550 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200/60">
                          #{selectedTest.testCode}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                        <Stethoscope size={18} className="text-[#1DB896] shrink-0" />
                        <span>{selectedTest.testName}</span>
                      </h2>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                      selectedTest.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-50 text-slate-450 border-slate-200'
                    }`}>
                      {selectedTest.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </div>

                  {/* Test Details Card */}
                  <div className="flex flex-col gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Mã danh mục xét nghiệm</span>
                        <strong className="text-slate-800 font-mono text-sm block">{selectedTest.testCode}</strong>
                      </div>
                      <div>
                        <span className="text-slate-450 font-bold block mb-0.5">Giá niêm yết dịch vụ</span>
                        <strong className="text-teal-700 font-black text-base block">
                          {selectedTest.price.toLocaleString("vi-VN")} đ
                        </strong>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60 my-1"></div>

                    <div>
                      <span className="text-slate-450 font-bold block mb-1">Mô tả chi tiết / Hướng dẫn chỉ định</span>
                      <p className="text-slate-700 text-xs font-medium leading-relaxed bg-white border border-slate-150/50 rounded-xl p-3.5 mt-1 min-h-[80px]">
                        {selectedTest.description || "Chưa có thông tin mô tả chi tiết cho loại xét nghiệm này."}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => handleOpenModal(selectedTest)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-[#F0F9F7] hover:text-[#1DB896] hover:border-[#1DB896]/35 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit size={14} /> Chỉnh sửa thông tin
                    </button>
                    <button
                      onClick={() => handleDelete(selectedTest.labTestId, selectedTest.testName)}
                      className="px-5 py-2.5 rounded-xl border border-transparent bg-rose-50 text-rose-700 font-black hover:bg-rose-100 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Trash2 size={14} /> Xóa xét nghiệm
                    </button>
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold flex flex-col items-center gap-3">
                  <Info size={40} className="text-slate-300" />
                  Chọn một dịch vụ xét nghiệm ở danh sách bên trái để xem đầy đủ chi tiết và thực hiện quản lý cập nhật.
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]" onClick={handleCloseModal}>
          <div className="bg-white p-7 rounded-[2rem] w-full max-w-lg shadow-2xl relative border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F0F9F7] text-[#1DB896] border border-[#1DB896]/20">
                  <Stethoscope size={18} />
                </div>
                {editingId ? "Cập nhật thông tin xét nghiệm" : "Thêm xét nghiệm mới"}
              </h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                onClick={handleCloseModal}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#4A5D59] mb-1.5">Mã Xét Nghiệm *</label>
                  <input
                    required
                    type="text"
                    value={formData.testCode}
                    onChange={(e) => setFormData({ ...formData, testCode: e.target.value.toUpperCase() })}
                    placeholder="VD: XN01"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#4A5D59] mb-1.5">Giá tiền (VNĐ)</label>
                  <input
                    type="text"
                    value={formData.price === 0 ? '' : formData.price.toLocaleString("vi-VN")}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, price: Number(rawValue) });
                    }}
                    placeholder="VD: 100,000"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#4A5D59] mb-1.5">Tên Xét Nghiệm *</label>
                <input
                  required
                  type="text"
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  placeholder="VD: Xét nghiệm sinh hóa máu..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#4A5D59] mb-1.5">Mô tả</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Chức năng, lưu ý của loại xét nghiệm này..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#4A5D59] mb-1.5">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-[#4A5D59] cursor-pointer"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                  onClick={handleCloseModal}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#0A604E] hover:bg-[#084f40] text-white font-black hover:shadow-md transition-colors disabled:opacity-50 text-xs flex items-center gap-2 cursor-pointer"
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

