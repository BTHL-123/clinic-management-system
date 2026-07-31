import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import {
  Search, MapPin, Calendar, PhoneCall, FileText,
  Clock, ShieldCheck, Stethoscope, UserCircle2,
  CheckCircle2, ChevronRight, Activity, HeartPulse, Brain, Eye, Droplet,
  Bone, Wind, TestTube, Smile, Sparkles, Star
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveDepartments } from '../services/departmentService';
import { getDoctors } from '../services/doctorService';
import { getMedicalServices } from '../services/medicalServiceService';
import { getArticles } from '../services/articleService';
import DoctorDetailModal from '../components/DoctorDetailModal';
import ArticleDetailModal from '../components/ArticleDetailModal';

const LogoSVG = ({ className, scrolled }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" style={{ filter: scrolled ? 'none' : 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}>
    <mask id="crossMask">
      <path d="M32 15 h36 v22 h22 v26 h-22 v22 h-36 v-22 h-22 v-26 h22 z" fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round" />
    </mask>
    <g mask="url(#crossMask)">
      <rect x="0" y="0" width="100" height="100" fill="#12c3d6" />
      <path d="M0 0 H100 V20 C45 35, 30 55, 20 100 H0 Z" fill="#064e8a" />
      <path d="M20 100 C30 55, 45 35, 100 20" stroke="white" strokeWidth="6" fill="none" />
    </g>
  </svg>
);

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [packages, setPackages] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depRes, docRes, pkgRes, artRes] = await Promise.all([
          getActiveDepartments(),
          getDoctors({ size: 10, status: 'ACTIVE' }),
          getMedicalServices({ page: 0, size: 10, type: 'PACKAGE' }),
          getArticles({ status: 'PUBLISHED', page: 0, size: 3, sortBy: 'createdAt', direction: 'desc' })
        ]);
        setDepartments(depRes.data || []);
        setDoctors(docRes.data?.content || []);
        setPackages(pkgRes.data?.content || []);
        setArticles(artRes.data?.content || []);
      } catch (error) {
        console.error("Error fetching landing page data:", error);
      }
    };
    fetchData();
  }, []);

  const navigateToProtected = (pathname, state) => {
    if (user) {
      navigate(pathname, { state });
      return;
    }

    navigate('/login', {
      state: {
        from: { pathname, state: state || null }
      }
    });
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    navigateToProtected('/dashboard/available-slots', {
      initialSearchQuery: searchQuery.trim()
    });
  };

  // Handle scroll for header glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDepartmentIcon = (name) => {
    if (!name) return Stethoscope;
    const n = name.toLowerCase();
    if (n.includes('tim')) return HeartPulse;
    if (n.includes('tiêu hóa')) return Activity;
    if (n.includes('thần kinh')) return Brain;
    if (n.includes('mắt')) return Eye;
    if (n.includes('nội tiết')) return Droplet;
    if (n.includes('nhi')) return UserCircle2;
    if (n.includes('chấn thương') || n.includes('xương')) return Bone;
    if (n.includes('hô hấp')) return Wind;
    if (n.includes('huyết học') || n.includes('máu')) return TestTube;
    if (n.includes('răng')) return Smile;
    if (n.includes('da liễu')) return Sparkles;
    return Stethoscope;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-200 selection:text-teal-900 overflow-x-hidden relative">
      {/* Global Vector Abstract Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]"></div>
        {/* Abstract Wavy Layers */}
        <div className="absolute bottom-0 left-0 w-full h-[70%]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
            <path fill="#80cbc4" fillOpacity="0.8" d="M0,224 C288,100 600,300 1440,120 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[55%]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
            <path fill="#4db6ac" fillOpacity="0.9" d="M0,160 C400,320 800,100 1440,160 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[40%]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
            <path fill="#26a69a" fillOpacity="1" d="M0,288 C500,100 900,320 1440,240 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[25%]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
            <path fill="#00897b" fillOpacity="1" d="M0,320 C300,150 800,200 1440,100 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </div>

      {/* Premium Header */}
      <header className={`fixed z-50 w-full transition-all duration-700 left-1/2 -translate-x-1/2 ${scrolled ? 'top-4 max-w-[1100px] xl:max-w-[1200px] bg-white/50 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-2 rounded-full px-4 md:px-6' : 'top-0 max-w-[100%] 2xl:max-w-[1600px] bg-transparent py-8 px-6 md:px-12'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <LogoSVG
              scrolled={scrolled}
              className={`transition-all duration-700 drop-shadow-md group-hover:scale-105 ${scrolled ? 'w-10 h-10 md:w-12 md:h-12' : 'w-14 h-14 md:w-20 md:h-20'}`}
            />
            <div className={`flex flex-col justify-center leading-none transition-all duration-700 ${scrolled ? 'scale-90 origin-left text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500' : 'scale-100 text-white'}`}>
              <span className="font-extrabold text-[1.5rem] md:text-[2rem] tracking-tight">Medical</span>
              <span className={`font-semibold text-[1rem] md:text-[1.3rem] tracking-widest ${scrolled ? 'text-teal-600' : 'text-teal-500'}`}>Clinic</span>
            </div>
          </div>

          <nav className={`hidden lg:flex flex-1 items-center justify-evenly transition-all duration-700 font-bold ${scrolled ? 'px-4 text-[15px]' : 'px-12 text-lg'}`}>
            {[
              { label: 'Đội ngũ bác sĩ', sectionId: 'doctors' },
              { label: 'Dịch vụ y tế', sectionId: 'services' },
              { label: 'Gói khám', sectionId: 'packages' },
              { label: 'Tin tức', sectionId: 'articles' },
              { label: 'Hướng dẫn', sectionId: 'guide' }
            ].map((item) => (
              <button
                key={item.sectionId}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className={`transition-colors relative group py-2 whitespace-nowrap ${scrolled ? 'text-teal-700 hover:text-teal-500' : ''}`}
              >
                <span className={scrolled ? "" : "text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-100 to-emerald-200 drop-shadow-[0_0_8px_rgba(94,234,212,0.4)] transition-all group-hover:from-white group-hover:via-white group-hover:to-white"}>
                  {item.label}
                </span>
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] transition-all group-hover:w-full rounded-full ${scrolled ? 'bg-teal-500' : 'bg-gradient-to-r from-teal-300 to-emerald-200'}`}></span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <Button className={`bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white rounded-full transition-all duration-700 font-bold border border-teal-400/20 shadow-lg hover:-translate-y-0.5 ${scrolled ? 'px-6 h-10 text-sm' : 'px-10 h-14 text-lg'}`} onClick={() => navigate('/dashboard')}>
                {user.fullName || user.email || "Dashboard"}
              </Button>
            ) : (
              <>
                <Button variant="ghost" className={`hidden sm:flex font-extrabold hover:bg-teal-50/20 rounded-full transition-all duration-700 ${scrolled ? 'text-teal-700 hover:text-teal-500 text-sm px-4 h-10' : 'text-lg px-6 h-14'}`} onClick={() => navigate('/login')}>
                  <span className={scrolled ? "" : "text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-100 to-emerald-200 drop-shadow-[0_0_8px_rgba(94,234,212,0.4)] transition-all group-hover:from-white group-hover:via-white group-hover:to-white"}>
                    Tài khoản
                  </span>
                </Button>
                <Button className={`bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white rounded-full transition-all duration-700 font-bold border border-teal-400/20 shadow-lg hover:-translate-y-0.5 ${scrolled ? 'px-6 h-10 text-sm' : 'px-10 h-14 text-lg'}`} onClick={() => navigate('/login')}>
                  Đăng nhập
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Ultra-Premium Hero Section */}
      <section className="relative pt-32 pb-48 lg:pt-40 lg:pb-60">
        {/* SAFE Z-INDEX BACKGROUND WRAPPER */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Deep, rich radial gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-teal-900 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-700/80 via-teal-900/80 to-transparent"></div>
          </div>

          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] mix-blend-overlay"></div>

          {/* Ambient glowing orbs */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-teal-500/30 rounded-full blur-[100px] mix-blend-screen"></div>
          <div className="absolute bottom-40 right-10 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen"></div>

          {/* Layered SVG Waves for 3D depth */}
          <div className="absolute bottom-[-2px] left-0 w-full overflow-hidden leading-none text-[#e0f2f1]">
            <svg className="relative block w-full h-[150px] md:h-[250px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path fill="currentColor" opacity="0.1" d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z"></path>
              <path fill="currentColor" opacity="0.3" d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z"></path>
              <path fill="currentColor" d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V120H0Z"></path>
            </svg>
          </div>
        </div>

        {/* Foreground Content */}
        <div className="container mx-auto px-4 max-w-[1400px] text-center relative z-10">

          {/* Decorative badges */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-100 text-sm font-semibold backdrop-blur-md">
              <Activity size={16} className="text-teal-400" /> Hệ thống đạt chuẩn Quốc tế
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-100 text-sm font-semibold backdrop-blur-md">
              <HeartPulse size={16} className="text-blue-400" /> +10.000 Bệnh nhân hài lòng
            </div>
          </div>

          <div className="max-w-5xl mx-auto space-y-10">
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-extrabold text-white tracking-tight leading-[1.05] drop-shadow-2xl">
              Chăm sóc Sức khỏe <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-100 to-emerald-200 drop-shadow-sm">
                Toàn diện & Tận tâm
              </span>
            </h1>

            <p className="text-lg md:text-xl text-teal-50/80 font-medium max-w-2xl mx-auto drop-shadow-md">
              Nền tảng đặt lịch khám thông minh, kết nối bạn với hàng ngàn bác sĩ chuyên khoa và cơ sở y tế uy tín hàng đầu.
            </p>

            {/* Glassmorphic Search Bar */}
            <form onSubmit={handleSearch} className="relative flex items-center max-w-3xl mx-auto group mt-8">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-teal-600">
                <Search size={24} />
              </div>
              <Input
                className="w-full h-16 pl-16 pr-40 rounded-full text-lg border-4 border-white/20 bg-white/90 backdrop-blur-xl focus-visible:ring-4 focus-visible:ring-teal-400/50 placeholder:text-slate-500 font-medium text-slate-900 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all"
                placeholder="Tìm bác sĩ hoặc chuyên khoa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 rounded-full bg-teal-800 hover:bg-teal-950 text-white font-bold px-8 transition-colors"
              >
                Tìm kiếm
              </Button>
            </form>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-teal-100 font-semibold pt-6 opacity-90">
              <p className="flex items-center gap-2"><CheckCircle2 size={18} className="text-teal-400" /> Hoàn tiền linh hoạt</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={18} className="text-teal-400" /> Cam kết bảo mật HIPAA</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={18} className="text-teal-400" /> Hỗ trợ 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Quick Actions (Overlapping Hero) */}
      <div className="relative z-20 container mx-auto px-4 max-w-[1400px] -mt-32 md:-mt-40 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {[
            { icon: Calendar, label: "Đặt Lịch\nKhám", path: "/dashboard/available-slots", color: "text-teal-600", glow: "from-teal-400 to-teal-600" },
            { icon: Stethoscope, label: "Khám\nChuyên Khoa", path: "/dashboard/our-doctors", color: "text-teal-600", glow: "from-teal-400 to-teal-600" },
            { icon: Sparkles, label: "Trợ Lý\nSức Khỏe AI", path: "/dashboard/ai-chat", color: "text-teal-600", glow: "from-teal-400 to-teal-600" },
            { icon: TestTube, label: "Kết Quả\nXét Nghiệm", path: "/dashboard/my-medical-history?tab=history", color: "text-teal-600", glow: "from-teal-400 to-teal-600" },
            { icon: Clock, label: "Lịch Hẹn\nCủa Tôi", path: "/dashboard/my-appointments", color: "text-teal-600", glow: "from-teal-400 to-teal-600" },
            { icon: FileText, label: "Bảng Giá\nDịch Vụ", path: "/dashboard/service-prices", color: "text-teal-600", glow: "from-teal-400 to-teal-600" }
          ].map((service, i) => (
            <button type="button" key={i} onClick={() => navigateToProtected(service.path)} className="group relative rounded-[2.5rem] transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] hover:z-30 cursor-pointer shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)]">

              {/* Softer Permanent Glowing Border */}
              <div className={`absolute inset-[-3px] rounded-[2.6rem] bg-gradient-to-br ${service.glow} opacity-20 group-hover:opacity-60 transition-opacity duration-500 blur-lg`}></div>
              <div className={`absolute inset-[-1px] rounded-[2.6rem] bg-gradient-to-br ${service.glow} opacity-40 group-hover:opacity-80 transition-opacity duration-500`}></div>

              {/* Inner Card content (Highly Transparent Glass) */}
              <div className="relative h-full w-full bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[inset_0_0_30px_rgba(255,255,255,0.6)] rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center justify-center gap-6 overflow-hidden">

                {/* Softer Inner Ambient Glow */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${service.glow} rounded-full blur-[40px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none`}></div>
                <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br ${service.glow} rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`}></div>

                {/* Watermark Icon in background */}
                <service.icon size={140} strokeWidth={1} className="absolute -bottom-8 -right-8 text-slate-800 opacity-[0.03] group-hover:opacity-[0.08] group-hover:-rotate-12 group-hover:scale-110 transition-all duration-700 pointer-events-none" />

                {/* Highly Creative Floating Icon Bubble */}
                <div className="relative z-10 w-20 h-20 rounded-[1.8rem] rotate-3 group-hover:rotate-0 bg-gradient-to-br from-white/90 to-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-[1.5px] border-white/80 flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-3 transition-all duration-500 backdrop-blur-xl">
                  {/* Glowing core inside bubble */}
                  <div className={`absolute inset-0 rounded-[1.8rem] bg-gradient-to-br ${service.glow} opacity-10 group-hover:opacity-30 transition-opacity duration-500`}></div>
                  <service.icon size={36} strokeWidth={2.5} className={`${service.color} drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:drop-shadow-[0_0_20px_currentColor] transition-all duration-500 relative z-10`} />
                </div>

                {/* Solid High-Contrast Text */}
                <span className="text-[17px] font-extrabold text-slate-800 whitespace-pre-line text-center leading-tight transition-all duration-500 relative z-10 drop-shadow-sm group-hover:scale-105">
                  {service.label}
                </span>

                {/* Always-on bottom indicator line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-gradient-to-r ${service.glow} group-hover:w-full transition-all duration-500 rounded-t-full opacity-80 group-hover:opacity-100`}></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Specialties */}
      <section id="specialties" className="py-24 bg-transparent relative overflow-hidden scroll-mt-24">
        {/* SAFE Z-INDEX BACKGROUND */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[20%] left-[-10%] right-[30%] h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-40 shadow-[0_0_15px_rgba(45,212,191,0.8)] -rotate-3"></div>
          <div className="absolute bottom-[20%] left-[30%] right-[-10%] h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-40 shadow-[0_0_15px_rgba(59,130,246,0.8)] rotate-2"></div>
        </div>

        <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
          <div className="text-center mb-16 flex flex-col items-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight uppercase drop-shadow-sm mb-4">
              Chuyên Khoa <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Nổi Bật</span>
            </h2>
            <p className="text-slate-600 font-medium text-lg max-w-2xl mx-auto mb-6">
              Tìm kiếm bác sĩ theo từng chuyên khoa cụ thể
            </p>
            <Button 
              onClick={() => navigateToProtected('/dashboard/our-doctors')}
              variant="ghost" 
              className="text-teal-700 font-bold hover:text-teal-800 hover:bg-white/50 group backdrop-blur-md rounded-full px-6 border border-teal-200/50 shadow-sm"
            >
              Xem tất cả <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" size={18} />
            </Button>
          </div>

          <div className="relative">
            {/* Ambient glow behind the whole section */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-r from-teal-400/20 via-emerald-300/10 to-teal-500/20 blur-[80px] rounded-[4rem] -z-10 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {(() => {
                  if (departments.length === 0) return [
                    { departmentName: "Tim mạch" }, { departmentName: "Tiêu hóa" }, { departmentName: "Thần kinh" },
                    { departmentName: "Mắt" }, { departmentName: "Nội tiết" }, { departmentName: "Đa khoa" }
                  ];
                  
                  const uniqueDepts = [];
                  const seen = new Set();
                  for (const d of departments) {
                    if (!d.departmentName) continue;
                    const cleanName = d.departmentName.replace(/:$/, '').trim();
                    if (!seen.has(cleanName.toLowerCase())) {
                      seen.add(cleanName.toLowerCase());
                      uniqueDepts.push({ ...d, departmentName: cleanName });
                    }
                  }
                  return uniqueDepts.slice(0, 6);
                })().map((spec, i) => {
                  const Icon = getDepartmentIcon(spec.departmentName);
                  return (
                  <button type="button" key={spec.departmentId || i} onClick={() => navigateToProtected('/dashboard/available-slots', { prefillDepartmentName: spec.departmentName })} className="group bg-white/95 backdrop-blur-xl rounded-[1.5rem] p-8 flex flex-col items-center justify-center gap-5 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(20,184,166,0.1)] transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-white">

                    <div className="relative">
                      {/* Ambient hover glow behind icon */}
                      <div className="absolute inset-0 bg-teal-400 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-300 rounded-full scale-150"></div>
                      <Icon size={56} strokeWidth={1.5} className="text-teal-700 relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
                    </div>

                    <span className="font-extrabold text-slate-800 text-[16px] text-center leading-tight transition-colors duration-300 group-hover:text-teal-800">
                      {spec.departmentName}
                    </span>

                  </button>
                )})}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="py-32 relative overflow-hidden bg-transparent scroll-mt-24">
        {/* SAFE Z-INDEX BACKGROUND */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-teal-200/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-cyan-200/25 rounded-full blur-[120px]"></div>
          {/* Abstract curve */}
          <svg className="absolute top-0 right-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 0 C 400 300 800 0 1200 400 L 1200 0 Z" fill="url(#grad1)" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Laser Lines */}
          <div className="absolute top-[30%] left-[-20%] w-[140%] h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.8)] rotate-[4deg]"></div>
          <div className="absolute bottom-[25%] left-[-20%] w-[140%] h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50 shadow-[0_0_15px_rgba(20,184,166,0.8)] -rotate-[6deg]"></div>
        </div>

        <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight uppercase">Đội ngũ Bác sĩ <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">Đầu Ngành</span></h2>
            <p className="text-slate-500 mt-6 font-medium text-xl max-w-2xl mx-auto">Các chuyên gia giàu kinh nghiệm luôn sẵn sàng tư vấn và điều trị cho bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[1400px] mx-auto w-full">
            {doctors.length > 0 ? doctors.slice(0, 5).map((doc, i) => {
              return (
              <Card key={i} onClick={() => setSelectedDoctor(doc)} className="group bg-white/90 backdrop-blur-xl border-2 border-white shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-15px_rgba(20,184,166,0.15)] transition-all duration-500 rounded-[2rem] flex flex-col hover:-translate-y-2 relative cursor-pointer mt-12 w-full overflow-hidden">

                {/* Top Banner Gradient */}
                <div className="absolute top-0 left-0 w-full h-[110px] bg-gradient-to-br from-teal-500 to-emerald-400 opacity-90 group-hover:opacity-100 transition-opacity"></div>

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black text-amber-500 shadow-sm flex items-center gap-1 z-20">
                  <Star className="fill-amber-500 text-amber-500" size={14} /> 5.0
                </div>

                {/* Avatar overlapping banner */}
                <div className="relative pt-8 px-6 flex flex-col items-center z-10">
                  <div className="relative w-32 h-32 rounded-full p-1.5 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-500">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img 
                        src={doc.avatarUrl && doc.avatarUrl !== "null" && doc.avatarUrl.trim() !== "" ? doc.avatarUrl : "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop"} 
                        alt={doc.fullName} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.onerror = null; // Prevent infinite loop
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.fullName || "Doctor")}&background=e2e8f0&color=0f172a&size=200`;
                        }}
                      />
                    </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 text-center space-y-4 flex-1 relative z-10 bg-transparent">
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">{doc.fullName}</h3>
                    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-50/80 text-teal-700 rounded-xl text-sm font-bold mt-3 border border-teal-100/50">
                       <Stethoscope size={14}/> {doc.departmentName || doc.specialization}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium">
                    <Clock size={14} />
                    <span>{doc.yearsOfExperience} năm kinh nghiệm</span>
                  </div>
                </CardContent>

                <div className="p-6 pt-0 relative z-10">
                  <Button 
                    onClick={(e) => { e.stopPropagation(); navigateToProtected('/dashboard/available-slots', { prefillDoctorId: doc.doctorId }); }}
                    className="w-full rounded-full bg-slate-900 hover:bg-teal-700 text-white font-extrabold h-14 text-[15px] shadow-lg group-hover:shadow-teal-700/30 transition-all"
                  >
                    Đặt lịch hẹn ngay
                  </Button>
                </div>
              </Card>
            )}) : (
              <p className="col-span-full py-8 text-center text-lg font-medium text-slate-500">
                Đội ngũ bác sĩ sẽ được cập nhật sớm.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 relative overflow-hidden bg-transparent scroll-mt-24">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[30%] h-[40%] bg-blue-300/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[50%] bg-teal-300/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight uppercase">Dịch vụ <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Y Tế</span></h2>
            <p className="text-slate-500 mt-4 font-medium text-lg max-w-2xl mx-auto">Đa dạng các dịch vụ khám, xét nghiệm và tầm soát với công nghệ hiện đại nhất.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { serviceName: "Khám Tổng quát", description: "Đánh giá toàn diện chức năng các cơ quan", price: 500000 },
              { serviceName: "Nội soi Tiêu hóa", description: "Công nghệ NBI phóng đại không đau", price: 1200000 },
              { serviceName: "Xét nghiệm Máu", description: "Bộ 20 chỉ số cơ bản và nâng cao", price: 350000 },
              { serviceName: "Siêu âm 4D", description: "Tầm soát dị tật thai nhi chính xác cao", price: 400000 },
              { serviceName: "Chụp X-Quang", description: "Hệ thống X-Quang kỹ thuật số liều thấp", price: 200000 },
              { serviceName: "Điện tim (ECG)", description: "Phát hiện sớm các bất thường về tim mạch", price: 150000 }
            ].map((srv, i) => {
              const icons = [Stethoscope, Activity, TestTube, Smile, Bone, HeartPulse];
              const Icon = icons[i % icons.length];
              return (
                <button type="button" key={i} onClick={() => navigateToProtected('/dashboard/service-prices')} className="group text-left bg-white/80 backdrop-blur-xl rounded-3xl p-6 border-2 border-white shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(20,184,166,0.15)] transition-all duration-300 hover:-translate-y-2 cursor-pointer flex gap-5 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300 shadow-sm border border-teal-100/50">
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 mb-1 group-hover:text-teal-700 transition-colors">{srv.serviceName}</h3>
                    <p className="text-slate-500 font-medium text-xs leading-relaxed mb-1 line-clamp-2">{srv.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-12 text-center">
            <Button onClick={() => navigateToProtected('/dashboard/service-prices')} variant="outline" className="rounded-full px-8 h-12 font-bold border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-colors shadow-sm bg-white/50 backdrop-blur-md">
              Xem tất cả dịch vụ
            </Button>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-32 relative overflow-hidden bg-transparent scroll-mt-24">
        {/* Creative mesh background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-gradient-to-r from-emerald-100/40 to-teal-100/40 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] bg-gradient-to-r from-blue-100/30 to-violet-100/30 rounded-full blur-[120px]"></div>

          {/* Laser Lines */}
          <div className="absolute top-[15%] left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-30 shadow-[0_0_20px_rgba(139,92,246,0.8)]"></div>
          <div className="absolute top-[75%] left-[-10%] w-[120%] h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-40 shadow-[0_0_15px_rgba(59,130,246,0.8)] rotate-2"></div>
        </div>

        <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight uppercase">Gói Khám <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Sức Khỏe</span></h2>
            <p className="text-slate-500 mt-6 font-medium text-xl max-w-2xl mx-auto">Đầu tư cho sức khỏe với các gói khám được thiết kế chuyên biệt, tiết kiệm tối đa chi phí.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto items-center">
            {(packages.length > 0 ? packages.slice(0, 3) : [
              { serviceName: "Cơ Bản", price: 2500000, description: "Phù hợp kiểm tra sức khỏe định kỳ hàng năm.", popular: false },
              { serviceName: "Tiêu Chuẩn", price: 5800000, description: "Khám chuyên sâu các chức năng cơ thể, tầm soát bệnh lý phổ biến.", popular: true },
              { serviceName: "Nâng Cao", price: 8500000, description: "Khám toàn diện kết hợp công nghệ cao MRI/CT.", popular: false }
            ]).map((pkg, i) => {
              const icons = [ShieldCheck, CheckCircle2, UserCircle2];
              const Icon = icons[i % icons.length];
              const isPopular = pkg.popular !== undefined ? pkg.popular : (i === 1);
              
              return (
              <Card key={i} className={`relative border-0 rounded-[3rem] flex flex-col transition-all duration-500 overflow-hidden ${isPopular ? 'bg-gradient-to-b from-slate-900 to-teal-950 text-white shadow-[0_30px_60px_-15px_rgba(20,184,166,0.4)] md:scale-110 z-20 ring-4 ring-teal-500/30 hover:shadow-[0_40px_80px_-15px_rgba(20,184,166,0.5)] hover:-translate-y-2' : 'bg-white/60 backdrop-blur-2xl border-2 border-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 z-10'}`}>
                {/* Glow effect inside card */}
                {isPopular && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-teal-500/20 blur-[60px] pointer-events-none"></div>}
                {!isPopular && <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-teal-50 blur-[60px] pointer-events-none`}></div>}

                {isPopular && (
                  <div className="absolute top-6 right-6 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-2 rounded-full text-sm font-extrabold shadow-xl z-30 animate-pulse">
                    Phổ Biến Nhất
                  </div>
                )}

                <div className={`p-10 md:p-12 text-center relative z-20 ${isPopular ? 'border-b border-white/10' : 'border-b border-slate-200/50'}`}>
                  <div className={`w-20 h-20 mx-auto rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg bg-gradient-to-br from-teal-400 to-teal-600 text-white`}>
                    <Icon size={40} />
                  </div>
                  <h3 className={`font-extrabold text-2xl mb-4 ${isPopular ? 'text-teal-50' : 'text-slate-800'}`}>{pkg.serviceName}</h3>
                  <div className="flex items-start justify-center gap-1">
                    <span className="text-4xl lg:text-5xl font-extrabold tracking-tighter drop-shadow-sm">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pkg.price)}
                    </span>
                  </div>
                  <p className={`mt-6 text-base font-medium leading-relaxed ${isPopular ? 'text-teal-200' : 'text-slate-500'}`}>{pkg.description}</p>
                </div>

                <CardContent className="p-10 md:p-12 flex-1 relative z-20">
                  <ul className={`space-y-6 text-lg font-bold ${isPopular ? 'text-slate-200' : 'text-slate-700'}`}>
                    <li className="flex items-center gap-4"><CheckCircle2 size={24} className={isPopular ? 'text-teal-400' : 'text-blue-500'} /> Khám lâm sàng tổng quát</li>
                    <li className="flex items-center gap-4"><CheckCircle2 size={24} className={isPopular ? 'text-teal-400' : 'text-blue-500'} /> Xét nghiệm máu cơ bản</li>
                    <li className="flex items-center gap-4"><CheckCircle2 size={24} className={isPopular ? 'text-teal-400' : 'text-blue-500'} /> Siêu âm ổ bụng</li>
                    <li className="flex items-center gap-4"><CheckCircle2 size={24} className={isPopular ? 'text-teal-400' : 'text-blue-500'} /> Chụp X-Quang tim phổi</li>
                  </ul>
                </CardContent>
                <div className="p-10 pt-0 relative z-20">
                  <Button 
                    onClick={(e) => { e.stopPropagation(); navigateToProtected('/dashboard/service-prices'); }}
                    className={`w-full rounded-full h-16 text-lg font-extrabold transition-all hover:scale-105 shadow-xl ${isPopular ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-teal-950 hover:from-teal-300 hover:to-emerald-300 hover:shadow-teal-400/50' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                    Chọn gói này
                  </Button>
                </div>
              </Card>
            )})}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section id="articles" className="py-32 relative overflow-hidden bg-transparent scroll-mt-24">
        {/* Abstract background elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-teal-200/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-emerald-200/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight uppercase">Bài Viết <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Y Tế</span></h2>
            <p className="text-slate-500 mt-6 font-medium text-xl max-w-2xl mx-auto">Cập nhật những kiến thức y khoa, thông tin sức khỏe mới nhất từ các chuyên gia.</p>
          </div>

          {articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
              {articles.map((article, i) => {
                const displayAvatar = article.thumbnailUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80";
                return (
                  <div key={article.articleId || i} onClick={() => setSelectedArticle(article)} className="group flex flex-col bg-white rounded-[2rem] border-2 border-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(20,184,166,0.15)] transition-all duration-500 hover:-translate-y-3 overflow-hidden cursor-pointer">
                    <div className="w-full h-56 relative overflow-hidden">
                      <img src={displayAvatar} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold text-teal-600 shadow-sm flex items-center gap-1 z-20">
                        Kiến thức
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-sm text-slate-500 font-medium mb-4">
                        <span>{article.createdAt ? new Date(article.createdAt).toLocaleDateString("vi-VN") : "Mới cập nhật"}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <span>{article.authorName || "Đội ngũ y bác sĩ"}</span>
                      </div>
                      <h3 className="font-extrabold text-2xl text-slate-900 leading-snug group-hover:text-teal-700 transition-colors line-clamp-3 mb-6 flex-1">
                        {article.title}
                      </h3>
                      <Button 
                        onClick={(e) => { e.stopPropagation(); setSelectedArticle(article); }}
                        variant="ghost" 
                        className="w-full justify-between px-0 hover:bg-transparent text-teal-700 font-bold group/btn mt-auto"
                      >
                        <span>Đọc tiếp</span>
                        <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-500 font-medium">Đang cập nhật bài viết mới...</div>
          )}
        </div>
      </section>

      {/* 3 Step Process */}
      <section id="guide" className="py-32 relative overflow-hidden bg-transparent scroll-mt-24">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          {/* Laser Lines */}
          <div className="absolute top-[80%] left-[-20%] w-[140%] h-[3px] bg-gradient-to-r from-transparent via-rose-300 to-transparent opacity-30 shadow-[0_0_15px_rgba(251,113,133,0.8)] -rotate-[4deg]"></div>
        </div>
        <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
          <div className="text-center mb-28">
            <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight uppercase">Trải nghiệm <span className="text-teal-600">Dễ dàng</span></h2>
            <p className="text-slate-500 mt-6 font-medium text-xl max-w-2xl mx-auto">Chỉ với 3 bước đơn giản, bạn đã hoàn tất việc kết nối với chuyên gia y tế.</p>
          </div>

          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-16 relative">
            {/* Animated glowing line for desktop */}
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-1 bg-gradient-to-r from-blue-200 via-teal-400 to-emerald-200 z-0 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.5)]"></div>

            {[
              { step: "01", icon: Search, title: "Tìm kiếm", desc: "Lựa chọn bác sĩ, chuyên khoa hoặc dịch vụ phù hợp với nhu cầu của bạn.", color: "text-teal-600", glow: "shadow-teal-500/30" },
              { step: "02", icon: Calendar, title: "Đặt lịch", desc: "Chọn ngày giờ trống và điền thông tin cá nhân cơ bản cực kỳ nhanh chóng.", color: "text-teal-600", glow: "shadow-teal-500/30" },
              { step: "03", icon: CheckCircle2, title: "Đến khám", desc: "Nhận tin nhắn xác nhận và đến khám ngay, không cần chờ đợi bốc số.", color: "text-teal-600", glow: "shadow-teal-500/30" }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center relative z-10 w-full md:w-1/3 group">
                <div className={`w-32 h-32 rounded-[2.5rem] bg-white/80 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] flex items-center justify-center ${s.color} mb-10 border-4 border-white group-hover:-translate-y-4 group-hover:scale-110 group-hover:${s.glow} transition-all duration-500 relative`}>
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-lg shadow-xl group-hover:bg-teal-500 transition-colors">
                    {s.step}
                  </div>
                  <s.icon size={48} strokeWidth={1.5} className="group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <h3 className="font-extrabold text-3xl text-slate-900 mb-4 group-hover:text-teal-600 transition-colors">{s.title}</h3>
                <p className="text-slate-500 font-semibold text-lg leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-10 pb-8 relative overflow-hidden">
        {/* SAFE Z-INDEX BACKGROUND */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-teal-600/20 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 max-w-[1400px] relative z-10">

          {/* Footer Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10 pt-0">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <LogoSVG className="w-12 h-12 md:w-16 md:h-16 drop-shadow-lg" />
                <div className="flex flex-col justify-center leading-none text-white">
                  <span className="font-extrabold text-[1.8rem] tracking-tight">Medical</span>
                  <span className="font-semibold text-[1.2rem] tracking-widest text-teal-400">Clinic</span>
                </div>
              </div>
              <p className="text-base text-slate-400 font-medium max-w-sm leading-relaxed">
                Nền tảng y tế số hàng đầu, mang đến trải nghiệm chăm sóc sức khỏe tiện lợi, minh bạch và an toàn tuyệt đối.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-white uppercase tracking-wider text-sm">Khám phá</h4>
              <ul className="space-y-4 text-base font-semibold">
                <li><button type="button" onClick={() => scrollToSection('doctors')} className="hover:text-teal-400 transition-colors">Đội ngũ bác sĩ</button></li>
                <li><button type="button" onClick={() => scrollToSection('articles')} className="hover:text-teal-400 transition-colors">Bài viết y tế</button></li>
                <li><button type="button" onClick={() => scrollToSection('guide')} className="hover:text-teal-400 transition-colors">Hướng dẫn đặt lịch</button></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-white uppercase tracking-wider text-sm">Dịch vụ</h4>
              <ul className="space-y-4 text-base font-semibold">
                <li><button type="button" onClick={() => navigateToProtected('/dashboard/available-slots')} className="hover:text-teal-400 transition-colors">Đặt lịch khám</button></li>
                <li><button type="button" onClick={() => navigateToProtected('/dashboard/service-prices')} className="hover:text-teal-400 transition-colors">Bảng giá dịch vụ</button></li>
                <li><button type="button" onClick={() => navigateToProtected('/dashboard/ai-chat')} className="hover:text-teal-400 transition-colors">Trợ lý sức khỏe AI</button></li>
              </ul>
            </div>

            <div className="space-y-6 col-span-2 md:col-span-4 lg:col-span-1">
              <h4 className="font-bold text-white uppercase tracking-wider text-sm">Liên hệ</h4>
              <ul className="space-y-4 text-base font-semibold">
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Tòa nhà Medical, 123 Health Ave, Đà Nẵng</span>
                </li>
                <li className="flex items-center gap-3">
                  <PhoneCall size={20} className="text-teal-500 shrink-0" />
                  <span>1900 1234</span>
                </li>
                <li className="flex items-center gap-3">
                  <FileText size={20} className="text-teal-500 shrink-0" />
                  <span>support@medicure.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium">
            <p>© 2026 Medical Clinic. All rights reserved.</p>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={14} /> HIPAA Compliant
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-blue-400 flex items-center gap-1">
                <ShieldCheck size={14} /> GDPR Ready
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedDoctor && (
        <DoctorDetailModal 
          selectedDoctor={selectedDoctor} 
          onClose={() => setSelectedDoctor(null)}
          onBookClick={() => {
            setSelectedDoctor(null);
            navigateToProtected('/dashboard/available-slots', { prefillDoctorId: selectedDoctor.doctorId });
          }}
        />
      )}

      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
};

export default LandingPage;
