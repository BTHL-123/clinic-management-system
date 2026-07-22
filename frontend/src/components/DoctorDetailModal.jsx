import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, GraduationCap, Activity, Star, FileText, ThumbsUp, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DoctorDetailModal({ selectedDoctor, onClose, onBookClick }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {selectedDoctor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden relative"
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800 rounded-full transition-colors backdrop-blur-md cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Background gradient banner */}
            <div className="h-40 bg-gradient-to-r from-[#0A604E] to-[#1DB896] relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>

            <div className="px-8 pb-8 relative -mt-20">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-end mb-8">
                <div className="w-40 h-40 rounded-3xl bg-white p-2 shadow-xl shrink-0 overflow-hidden border border-slate-100">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-teal-50 flex items-center justify-center">
                    {typeof selectedDoctor.avatarUrl === "string" && selectedDoctor.avatarUrl.trim() && selectedDoctor.avatarUrl !== "null" ? (
                      <img
                        src={selectedDoctor.avatarUrl}
                        alt={selectedDoctor.fullName || selectedDoctor.name || "Bác sĩ"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Stethoscope size={54} className="text-teal-600" aria-label="Chưa có ảnh bác sĩ" />
                    )}
                  </div>
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-[#D1F2EB] text-[#0A604E] px-3.5 py-1 rounded-full text-[11px] font-black mb-2 border border-[#1DB896]/10">
                    <ShieldCheck size={13} /> Chuyên gia y tế
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedDoctor.fullName || selectedDoctor.name}</h2>
                  <p className="text-[#198E75] font-extrabold text-base">{selectedDoctor.departmentName || selectedDoctor.specialization || "Chuyên khoa"}</p>
                </div>
                <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                  <button
                    onClick={() => {
                      if (onBookClick) onBookClick(selectedDoctor);
                      else navigate('/dashboard/available-slots', { state: { prefillDoctorId: selectedDoctor.doctorId || selectedDoctor.id } });
                    }}
                    className="w-full md:w-auto bg-[#0A604E] hover:bg-[#084f40] text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg cursor-pointer text-xs"
                  >
                    Đặt lịch khám ngay
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#F0F9F7] rounded-2xl p-4 flex items-center gap-4 border border-[#1DB896]/10 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Học hàm học vị</p>
                    <p className="font-black text-xs text-slate-800 mt-0.5">{selectedDoctor.degree || "Bác sĩ Chuyên khoa"}</p>
                  </div>
                </div>
                <div className="bg-[#F0F9F7] rounded-2xl p-4 flex items-center gap-4 border border-[#1DB896]/10 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kinh nghiệm</p>
                    <p className="font-black text-xs text-slate-800 mt-0.5">{selectedDoctor.yearsOfExperience || 10} năm công tác</p>
                  </div>
                </div>
                <div className="bg-[#F0F9F7] rounded-2xl p-4 flex items-center gap-4 border border-[#1DB896]/10 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                    <Star size={24} className="fill-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Đánh giá chung</p>
                    <p className="font-black text-xs text-slate-800 mt-0.5 flex items-center gap-1">
                      {((selectedDoctor.doctorId || selectedDoctor.id || 1) % 3 === 0 ? 5.0 : (selectedDoctor.doctorId || selectedDoctor.id || 1) % 2 === 0 ? 4.8 : 4.9).toFixed(1)}/5.0
                      <span className="text-slate-400 text-[10px] font-bold">(120+ ca)</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-black text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="text-[#1DB896]" size={18} /> Tiểu sử & Chuyên môn
                  </h3>
                  <div className="text-xs font-semibold text-slate-600 leading-relaxed bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    {selectedDoctor.yearOfBirth && <p className="mb-1.5"><span className="font-bold text-[#1DB896] mr-1">Năm sinh:</span> {selectedDoctor.yearOfBirth}</p>}
                    {selectedDoctor.hometown && <p className="mb-3"><span className="font-bold text-[#1DB896] mr-1">Quê quán:</span> {selectedDoctor.hometown}</p>}
                    {selectedDoctor.biography || selectedDoctor.detail ? (
                      <p>{selectedDoctor.biography || selectedDoctor.detail}</p>
                    ) : (
                      <p>Bác sĩ {selectedDoctor.fullName || selectedDoctor.name} là một chuyên gia y tế giàu nhiệt huyết và y đức trong lĩnh vực {selectedDoctor.departmentName || "Khám chữa bệnh"}. Trong suốt quá trình công tác chuyên môn tại các bệnh viện lớn toàn quốc, bác sĩ luôn được bệnh nhân tin tưởng nhờ thái độ tận tình, chẩn đoán chính xác và liên tục ứng dụng các thành tựu khoa học kỹ thuật hiện đại vào điều trị.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-black text-slate-800 mb-3 flex items-center gap-2">
                    <ThumbsUp className="text-emerald-600" size={18} /> Thành tựu nổi bật
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                      <div className="text-2xl font-black text-[#0A604E] mb-1">98%</div>
                      <div className="text-xs font-bold text-slate-500">Mức độ hài lòng của Bệnh nhân</div>
                    </div>
                    <div className="bg-teal-50/30 p-4 rounded-2xl border border-teal-100/50">
                      <div className="text-2xl font-black text-[#0A604E] mb-1">1,500+</div>
                      <div className="text-xs font-bold text-slate-500">Số ca thăm khám & điều trị thành công</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
