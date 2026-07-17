import React from 'react';
import { X, Clock, User, Calendar } from 'lucide-react';

export default function ArticleDetailModal({ article, onClose }) {
  if (!article) return null;

  const readingTime = Math.max(1, Math.ceil((article.content?.length || 0) / 1000));
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden animate-[slideUp_0.3s_ease]">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header / Cover Image */}
        <div className="h-64 md:h-80 relative shrink-0">
          <img 
            src={article.thumbnailUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80"} 
            alt={article.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 pt-0 text-white">
            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm font-medium text-teal-200 mb-3 md:mb-4">
              <span className="flex items-center gap-1.5"><Calendar size={16}/> {new Date(article.createdAt).toLocaleDateString("vi-VN")}</span>
              <span className="flex items-center gap-1.5"><User size={16}/> {article.authorName || "Đội ngũ y bác sĩ"}</span>
              <span className="flex items-center gap-1.5"><Clock size={16}/> {readingTime} phút đọc</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black leading-tight drop-shadow-md">{article.title}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar bg-slate-50">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
            <div 
              className="prose prose-slate prose-teal max-w-none font-medium leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content || '<p>Nội dung đang được cập nhật...</p>' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
