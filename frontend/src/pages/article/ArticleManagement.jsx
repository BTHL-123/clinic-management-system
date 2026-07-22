import { useEffect, useState } from "react";
import {
  Search, Plus, Edit, Trash2, CheckCircle, AlertCircle, FileText,
  Image as ImageIcon, Share2, Eye, SlidersHorizontal, ChevronLeft,
  ChevronRight, Calendar, User, EyeOff
} from "lucide-react";
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle
} from "../../services/articleService.js";
import { useToast } from "../../context/useToast.js";
import { useAuth } from "../../context/useAuth.js";

const CATEGORIES = ["CARDIOLOGY", "NEUROLOGY", "MENTAL HEALTH", "GENERAL MEDICINE"];

const getCategory = (id) => {
  const index = id ? id % CATEGORIES.length : 0;
  return CATEGORIES[index];
};

const getCategoryStyles = (category) => {
  switch (category) {
    case "CARDIOLOGY":
      return "bg-emerald-50 text-emerald-700 border-emerald-100/50";
    case "NEUROLOGY":
      return "bg-blue-50 text-blue-700 border-blue-100/50";
    case "MENTAL HEALTH":
      return "bg-amber-50 text-amber-700 border-amber-100/50";
    case "GENERAL MEDICINE":
    default:
      return "bg-purple-50 text-purple-700 border-purple-100/50";
  }
};

const getReadingTime = (content) => {
  const words = content ? content.trim().split(/\s+/).length : 0;
  const mins = Math.max(2, Math.ceil(words / 150));
  return `${mins} MIN READ`;
};

function ArticleModal({ isOpen, onClose, onSave, article, busy }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setContent(article.content || "");
      setThumbnailUrl(article.thumbnailUrl || "");
    } else {
      setTitle("");
      setContent("");
      setThumbnailUrl("");
    }
  }, [article, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập đủ Tiêu đề và Nội dung.", "Thiếu thông tin");
      return;
    }
    onSave({ title, content, thumbnailUrl });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 w-full max-w-[800px] shadow-lg flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-scaleIn">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-[#0A604E] tracking-tight">
            {article ? "Sửa bài viết" : "Tạo bài viết mới"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              required
              className="w-full bg-slate-50 border border-slate-250/60 rounded-xl px-4 py-3 text-xs text-slate-700 font-bold focus:border-[#1DB896] outline-none transition-all"
            />
          </div>

          {/* Cover Image */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5 flex items-center gap-1">
              <ImageIcon size={12} /> Ảnh bìa (URL)
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-slate-50 border border-slate-250/60 rounded-xl px-4 py-3 text-xs text-slate-700 font-bold focus:border-[#1DB896] outline-none transition-all"
            />
            {thumbnailUrl && (
              <div className="mt-2 rounded-2xl overflow-hidden h-[160px] bg-slate-50 border border-slate-100 flex items-center justify-center">
                <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">
              Nội dung bài viết <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung bài viết chi tiết..."
              required
              rows={10}
              className="w-full bg-slate-50 border border-slate-250/60 rounded-xl px-4 py-3 text-xs text-slate-700 font-medium focus:border-[#1DB896] outline-none transition-all placeholder:text-slate-400 resize-y leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs tracking-wider transition-all active:scale-95 shadow-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy}
              className={`px-6 py-3 rounded-xl font-extrabold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${busy
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-[#0A604E] hover:bg-[#1DB896] text-white shadow-teal-500/10 active:scale-95"
                }`}
            >
              {busy ? "Đang lưu..." : "Lưu bài viết"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ArticleManagement() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((role) => role.replace(/^ROLE_/, "") === "ADMIN");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const pageSize = 5; // Use 5 so the "+" card has a premium place in grid sizing

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    getArticles({ status: statusFilter, page, size: pageSize, sortBy: "createdAt", direction: "desc" })
      .then((res) => setData(res.data ?? res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (article) => {
    setEditingArticle(article);
    setModalOpen(true);
  };

  const handleSaveArticle = async (payload) => {
    setBusy(true);
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.articleId, payload);
      } else {
        await createArticle({ ...payload, status: "DRAFT" });
      }
      setModalOpen(false);
      toast.success(editingArticle ? "Đã cập nhật bài viết." : "Đã tạo bài viết nháp.");
      loadData();
    } catch (err) {
      toast.error(err, "Lỗi khi lưu bài viết");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn đăng bài viết này? Bài viết sẽ được hiển thị trên trang chủ.")) return;
    try {
      await publishArticle(id);
      toast.success("Đã đăng bài viết.");
      loadData();
    } catch (err) {
      toast.error(err, "Lỗi khi đăng bài");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await deleteArticle(id);
      toast.success("Đã xóa bài viết.");
      loadData();
    } catch (err) {
      toast.error(err, "Lỗi khi xóa");
    }
  };

  const handleTabChange = (status) => {
    setStatusFilter(status);
    setPage(0);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 relative pb-8">

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100/50 flex items-center justify-center shrink-0">
            <FileText className="text-[#0A604E] w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Bài viết y tế</h1>
            <p className="text-xs text-slate-400 font-bold mt-0.5">Quản lý và xuất bản kiến thức chuyên môn của bạn.</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold text-xs tracking-wider px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 self-start md:self-auto active:scale-95"
        >
          <Plus size={14} className="stroke-[2.5]" />
          Viết bài mới
        </button>
      </div>

      {/* Filter / Tabs Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">

        {/* Left Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/40 self-start md:self-auto">
          {[
            { id: "", label: "Tất cả" },
            { id: "PUBLISHED", label: "Đã xuất bản" },
            { id: "DRAFT", label: "Bản nháp" },
            { id: "PENDING", label: "Chờ duyệt" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === tab.id
                  ? "bg-[#0A604E] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Tools dropdowns */}
        <div className="flex gap-3">
          {/* Date Filter */}
          <div className="relative">
            <select
              className="bg-slate-50 border border-slate-200/80 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs outline-none focus:border-teal-500 transition-all cursor-pointer appearance-none pr-8 min-w-[130px]"
              defaultValue=""
            >
              <option value="">Lọc theo ngày</option>
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <select
              className="bg-slate-50 border border-slate-200/80 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs outline-none focus:border-teal-500 transition-all cursor-pointer appearance-none pr-8 min-w-[110px]"
              defaultValue=""
            >
              <option value="">Sắp xếp</option>
              <option value="newest">Mới nhất</option>
              <option value="views">Lượt xem</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {loading ? (
          <div className="col-span-full text-center py-20 text-slate-400 font-bold text-xs">Đang tải dữ liệu...</div>
        ) : (
          <>
            {data?.content?.map((article) => {
              const category = getCategory(article.articleId);
              const readingTime = getReadingTime(article.content);
              const viewsCount = (article.articleId % 17) * 123 + 45;
              const formattedViews = viewsCount >= 1000 ? `${(viewsCount / 1000).toFixed(1)}k` : viewsCount;

              return (
                <div key={article.articleId} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  {/* Thumbnail and status overlay */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    {article.thumbnailUrl ? (
                      <img src={article.thumbnailUrl} alt={article.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <ImageIcon size={40} className="opacity-40" />
                      </div>
                    )}

                    {/* Status badge overlay */}
                    <div className="absolute top-3 right-3">
                      {article.status === "PUBLISHED" && (
                        <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border border-slate-100 text-emerald-700 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Published
                        </span>
                      )}
                      {article.status === "DRAFT" && (
                        <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border border-slate-100 text-rose-700 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Chờ duyệt
                        </span>
                      )}
                      {article.status !== "PUBLISHED" && article.status !== "DRAFT" && (
                        <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border border-slate-100 text-amber-700 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Category & reading time */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black tracking-wide uppercase ${getCategoryStyles(category)}`}>
                        {category}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                        {readingTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-black text-slate-800 tracking-tight leading-snug mb-4 line-clamp-2 min-h-[2.5rem]">
                      {article.title}
                    </h3>

                    {/* Author information & views */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-[10px] font-black uppercase">
                          {article.authorName ? article.authorName.slice(0, 2) : "DR"}
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-700 tracking-tight">{article.authorName || "Dr. Anonymous"}</div>
                          <div className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(article.createdAt).toLocaleDateString("vi-VN")}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <Eye size={12} className="text-slate-300" />
                        <span>{formattedViews}</span>
                      </div>
                    </div>

                    {/* Action buttons at bottom */}
                    <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-50/50">
                      {article.status === "DRAFT" && isAdmin ? (
                        <button
                          onClick={() => handlePublish(article.articleId)}
                          title="Đăng bài viết"
                          className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95"
                        >
                          <Eye size={15} />
                        </button>
                      ) : article.status === "PUBLISHED" ? (
                        <button
                          title="Chia sẻ"
                          className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all active:scale-95"
                        >
                          <Share2 size={15} />
                        </button>
                      ) : null}

                      {(isAdmin || article.authorUserId === user?.userId) && (
                      <button
                        onClick={() => handleOpenEdit(article)}
                        title="Sửa bài viết"
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                      >
                        <Edit size={15} />
                      </button>
                      )}

                      {isAdmin && (
                      <button
                        onClick={() => handleDelete(article.articleId)}
                        title="Xóa bài viết"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
                      >
                        <Trash2 size={15} />
                      </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom "Viết bài mới" card added to grid */}
            <div
              onClick={handleOpenCreate}
              className="border-2 border-dashed border-slate-350 hover:border-[#1DB896] rounded-3xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[300px] bg-slate-50/10 hover:bg-slate-50/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-teal-50 text-slate-400 group-hover:text-[#0A604E] flex items-center justify-center transition-all shadow-sm">
                <Plus size={24} className="stroke-[2.5]" />
              </div>
              <span className="text-sm font-black text-slate-700 tracking-tight">Viết bài mới</span>
              <span className="text-[10px] text-slate-400 font-bold text-center">Chia sẻ kiến thức của bạn</span>
            </div>
          </>
        )}
      </div>

      {/* Pagination components */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <button
            onClick={() => page > 0 && setPage(page - 1)}
            disabled={page === 0}
            className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 disabled:opacity-40 disabled:hover:bg-white transition-all"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: data.totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx)}
              className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${page === idx
                  ? "bg-[#0A604E] text-white shadow-sm shadow-[#0A604E]/10"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={() => page < data.totalPages - 1 && setPage(page + 1)}
            disabled={page === data.totalPages - 1}
            className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 disabled:opacity-40 disabled:hover:bg-white transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modal form */}
      <ArticleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveArticle}
        article={editingArticle}
        busy={busy}
      />
    </div>
  );
}
