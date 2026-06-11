import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, CheckCircle, AlertCircle, FileText, Image as ImageIcon } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle
} from "../../services/articleService.js";
import { useToast } from "../../context/useToast.js";

// Custom toolbar options for ReactQuill
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
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
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", padding: "24px", borderRadius: "12px",
        width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}>
        <h3 style={{ margin: "0 0 20px", color: "#0f172a", fontSize: "1.5rem" }}>
          {article ? "Sửa bài viết" : "Tạo bài viết mới"}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px", color: "#334155" }}>
              Tiêu đề <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: "1px solid #cbd5e1", fontSize: "15px", boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontWeight: 600, fontSize: "14px", color: "#334155" }}>
              <ImageIcon size={16} /> Ảnh bìa (URL)
            </label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box"
              }}
            />
            {thumbnailUrl && (
              <div style={{ marginTop: "10px", borderRadius: "8px", overflow: "hidden", height: "120px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={thumbnailUrl} alt="Thumbnail preview" style={{ height: "100%", objectFit: "cover" }} onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px", color: "#334155" }}>
              Nội dung <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <div style={{ background: "#fff" }}>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Nhập nội dung bài viết..."
                style={{ 
                  width: "100%", height: "300px", padding: "12px", 
                  borderRadius: "8px", border: "1px solid #cbd5e1", 
                  fontSize: "14px", resize: "vertical", fontFamily: "inherit",
                  boxSizing: "border-box" 
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1",
                background: "#fff", cursor: "pointer", fontWeight: 600, color: "#475569"
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "10px 20px", borderRadius: "8px", border: "none",
                background: busy ? "#94a3b8" : "#0f766e",
                color: "#fff", cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 600
              }}
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const pageSize = 10;

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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div className="flex flex-col items-center w-full">
          <h1 className="flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><FileText size={24} /></span>
            <span style={{ color: "#0f766e" }} className="text-2xl font-bold tracking-wide">Quản lý Bài viết Y tế</span>
          </h1>
          <p className="text-white/70 font-medium mt-3 drop-shadow-sm">
            Soạn thảo và quản lý các bài viết tin tức, kiến thức y khoa.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "#0f766e", color: "#fff", border: "none",
            padding: "10px 16px", borderRadius: "8px", fontWeight: 600,
            cursor: "pointer", fontSize: "14px"
          }}
        >
          <Plus size={18} />
          Tạo bài viết
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", outline: "none", fontSize: "14px" }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="PUBLISHED">Đã đăng (PUBLISHED)</option>
          <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
        </select>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 18px", color: "#dc2626", marginBottom: "20px", fontSize: "14px" }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {loading ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#94a3b8" }}>Đang tải dữ liệu...</div>
        ) : !data || data.content.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#ffffff", fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>Không có bài viết nào.</div>
        ) : (
          data.content.map((article) => (
            <div key={article.articleId} style={{
              background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", 
              overflow: "hidden", display: "flex", flexDirection: "column",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ height: "160px", background: "#f1f5f9", position: "relative" }}>
                {article.thumbnailUrl ? (
                  <img src={article.thumbnailUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    <ImageIcon size={40} opacity={0.5} />
                  </div>
                )}
                <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                    background: article.status === "PUBLISHED" ? "#10b981" : article.status === "DRAFT" ? "#f59e0b" : "#64748b",
                    color: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    {article.status}
                  </span>
                </div>
              </div>
              
              <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", color: "#0f172a", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {article.title}
                </h3>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                  <div>Tác giả: <span style={{ fontWeight: 600 }}>{article.authorName}</span></div>
                  <div>Tạo ngày: {new Date(article.createdAt).toLocaleDateString("vi-VN")}</div>
                  {article.publishedAt && (
                    <div>Đăng ngày: {new Date(article.publishedAt).toLocaleDateString("vi-VN")}</div>
                  )}
                </div>
                
                <div style={{ marginTop: "auto", display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  {article.status === "DRAFT" && (
                    <button 
                      onClick={() => handlePublish(article.articleId)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "8px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                    >
                      <CheckCircle size={14} /> Đăng bài
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenEdit(article)}
                    style={{ flex: article.status === "DRAFT" ? "none" : 1, width: article.status === "DRAFT" ? "auto" : "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", background: "#f8fafc", color: "#3b82f6", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                  >
                    <Edit size={14} /> Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(article.articleId)}
                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" }}
                    title="Xóa bài viết"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "30px" }}>
          {/* Pagination controls (omitted for brevity, similar to other pages) */}
        </div>
      )}

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
