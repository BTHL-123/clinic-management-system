import React, { useState, useEffect } from "react";
import { 
  Search, Filter, UserCircle, Star, ShieldCheck, GraduationCap, Activity, FileText, ThumbsUp, X, Stethoscope
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDoctors } from "../../services/doctorService";
import { getDepartments } from "../../services/departmentService";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../components/PageHeader";

export default function PatientDoctorsPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, deptRes] = await Promise.all([
        getDoctors({ page: 0, size: 200, status: "ACTIVE" }),
        getDepartments({ page: 0, size: 100 })
      ]);
      setDoctors(docRes?.data?.content || []);
      setDepartments(deptRes?.data?.content || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment ? doc.departmentId === Number(selectedDepartment) : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="w-full min-h-full p-6 flex flex-col gap-6 patient-clean-page">
      {/* Header section */}
      <PageHeader
        title="Đội ngũ Bác sĩ & Chuyên khoa"
        icon={Stethoscope}
        subtitle="Tìm kiếm và lựa chọn bác sĩ phù hợp với nhu cầu sức khỏe của bạn."
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm font-medium"
          />
        </div>
        <div className="relative w-full md:w-64 shrink-0">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <Filter size={20} />
          </div>
          <select 
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm appearance-none font-medium text-slate-700 cursor-pointer"
          >
            <option value="">Tất cả chuyên khoa</option>
            {departments.map(dept => (
              <option key={dept.departmentId} value={dept.departmentId}>{dept.departmentName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
          <UserCircle size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy bác sĩ nào</h3>
          <p className="text-slate-500">Vui lòng thử lại với từ khóa hoặc chuyên khoa khác.</p>
          <button 
            onClick={() => {setSearchQuery(''); setSelectedDepartment('');}}
            className="mt-6 px-6 py-2.5 bg-teal-50 text-teal-700 font-bold rounded-xl hover:bg-teal-100 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-10">
          {filteredDoctors.map((doc) => (
            <div key={doc.doctorId} className="bg-white rounded-[2rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(20,184,166,0.1)] transition-all flex flex-col items-center relative overflow-hidden group border border-slate-100 hover:border-teal-200">
              <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-teal-50 to-transparent"></div>
              <div className="w-28 h-28 rounded-full bg-white shadow-md border-4 border-white z-10 flex items-center justify-center overflow-hidden mb-4 relative">
                {doc.avatarUrl ? (
                  <img src={doc.avatarUrl} alt={doc.fullName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                   <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-600">
                      <UserCircle size={48} strokeWidth={1} />
                   </div>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 z-10 text-center mb-1">{doc.fullName}</h3>
              <p className="text-teal-600 font-bold text-sm mb-3 z-10">{doc.departmentName || doc.specialization || "Chuyên khoa"}</p>
              
              <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-500 mb-6 z-10">
                <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200">{doc.degree || "Bác sĩ"}</span>
                <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200">{doc.yearsOfExperience || 0} năm KN</span>
              </div>

              <button 
                onClick={() => setSelectedDoctor(doc)}
                className="w-full mt-auto bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white font-bold py-3 rounded-xl transition-colors z-10 border border-teal-200 hover:border-teal-600 shadow-sm"
              >
                Xem chi tiết
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DOCTOR DETAIL MODAL */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="p-2 bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800 rounded-full transition-colors backdrop-blur-md"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="h-40 bg-gradient-to-r from-teal-500 to-emerald-400 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>

              <div className="px-8 pb-8 relative -mt-16 bg-white rounded-t-[2rem] pt-6 z-10">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-end mb-8">
                  <div className="w-40 h-40 rounded-full bg-white p-2 shadow-xl shrink-0 -mt-20 z-20">
                    <div className="w-full h-full rounded-full overflow-hidden bg-teal-50 flex items-center justify-center">
                      {selectedDoctor.avatarUrl ? (
                        <img src={selectedDoctor.avatarUrl} alt={selectedDoctor.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={80} className="text-teal-400" strokeWidth={1} />
                      )}
                    </div>
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
                      <ShieldCheck size={14} /> Chuyên gia Y tế
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1">{selectedDoctor.fullName}</h2>
                    <p className="text-teal-600 font-bold text-lg">{selectedDoctor.departmentName || selectedDoctor.specialization || "Chuyên khoa"}</p>
                  </div>
                  <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => navigate('/dashboard/available-slots', { state: { prefillDoctorId: selectedDoctor.doctorId } })}
                      className="w-full md:w-auto bg-slate-900 hover:bg-teal-600 text-white font-black py-3 px-8 rounded-xl transition-colors shadow-lg"
                    >
                      Đặt lịch ngay
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-4 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Học vấn</p>
                      <p className="font-bold text-slate-900">{selectedDoctor.degree || "Bác sĩ Chuyên khoa"}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-4 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Kinh nghiệm</p>
                      <p className="font-bold text-slate-900">{selectedDoctor.yearsOfExperience || 0} năm</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-4 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Star size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Đánh giá</p>
                      <p className="font-bold text-slate-900 flex items-center gap-1">4.9/5 <span className="text-slate-400 text-sm font-medium">(120+)</span></p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                      <FileText className="text-teal-500" /> Tiểu sử & Chuyên môn
                    </h3>
                    <div className="text-slate-600 font-medium leading-relaxed bg-white p-5 rounded-lg border border-slate-100">
                      {selectedDoctor.biography ? (
                        <p>{selectedDoctor.biography}</p>
                      ) : (
                        <p>Bác sĩ {selectedDoctor.fullName} là một chuyên gia tận tâm trong lĩnh vực {selectedDoctor.departmentName || "y tế"}. Với {selectedDoctor.yearsOfExperience || "nhiều"} năm kinh nghiệm công tác và làm việc tại các bệnh viện lớn, bác sĩ luôn đề cao y đức và sự tận tâm đối với bệnh nhân. Bác sĩ đã điều trị thành công hàng ngàn ca bệnh và luôn không ngừng cập nhật các phương pháp điều trị tiên tiến nhất để mang lại hiệu quả tốt nhất cho người bệnh.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                      <ThumbsUp className="text-blue-500" /> Hiệu suất & Thành tựu
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100/50">
                        <div className="text-3xl font-black text-blue-600 mb-1">98%</div>
                        <div className="text-sm font-bold text-slate-600">Bệnh nhân hài lòng</div>
                      </div>
                      <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100/50">
                        <div className="text-3xl font-black text-emerald-600 mb-1">1,500+</div>
                        <div className="text-sm font-bold text-slate-600">Ca khám thành công</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
