import React, { useState, useEffect } from "react";
import { Search, Activity, Stethoscope, FileHeart, Syringe, ListOrdered } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getActiveMedicalServices } from "../../services/medicalServiceService";
import PageHeader from "../../components/PageHeader";

export default function PatientServicePricesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, CONSULTATION, IMAGING, PROCEDURE, TESTING

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await getActiveMedicalServices();
      if (res.data && Array.isArray(res.data)) {
        setServices(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch medical services:", error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case "CONSULTATION": return <Stethoscope size={20} className="text-teal-600" />;
      case "IMAGING": return <Activity size={20} className="text-sky-600" />;
      case "TESTING": return <Syringe size={20} className="text-rose-600" />;
      case "PROCEDURE": return <FileHeart size={20} className="text-amber-600" />;
      default: return <Activity size={20} className="text-slate-600" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "CONSULTATION": return "Khám bệnh";
      case "IMAGING": return "Chẩn đoán hình ảnh";
      case "TESTING": return "Xét nghiệm";
      case "PROCEDURE": return "Thủ thuật";
      default: return "Khác";
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "ALL" || s.serviceType === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="w-full min-h-full p-6 flex flex-col gap-6 patient-clean-page">
      <PageHeader
        title="Bảng giá Dịch vụ Y tế"
        icon={ListOrdered}
        subtitle="Xem chi phí các dịch vụ y tế trong phòng khám."
      />

      {/* Search & Tabs */}
      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm dịch vụ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-1">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "CONSULTATION", label: "Khám bệnh" },
            { id: "IMAGING", label: "CĐ Hình ảnh" },
            { id: "TESTING", label: "Xét nghiệm" },
            { id: "PROCEDURE", label: "Thủ thuật" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? "bg-teal-600 text-white shadow-md" 
                  : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-white/10 rounded-xl border border-white/20">
          <Activity className="w-16 h-16 mx-auto text-white/30 mb-4" />
          <p className="text-white/60 font-medium">Không tìm thấy dịch vụ nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <div 
              key={service.serviceId} 
              className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-110 transition-transform">
                  {getServiceIcon(service.serviceType)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-[15px] leading-tight mb-1">{service.serviceName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-white/70 px-2 py-0.5 rounded-md border border-white/10">
                      {getTypeLabel(service.serviceType)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-white/60 text-[13px] line-clamp-2">{service.description}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-white/10 mt-auto">
                <span className="text-[12px] font-bold text-white/40">Giá dịch vụ</span>
                <span className="text-xl font-black text-teal-300">{service.price.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
