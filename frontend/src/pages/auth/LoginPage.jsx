import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { MedicalCross } from "../../components/Logo.jsx";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response.credential) {
        setError("Google không trả về token đăng nhập.");
        return;
      }

      setError("");
      setSubmitting(true);
      try {
        await loginWithGoogle(response.credential);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    },
    [loginWithGoogle, navigate],
  );

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return undefined;
    }

    let isMounted = true;
    const scriptUrl = "https://accounts.google.com/gsi/client";

    const initializeGoogleLogin = () => {
      if (!isMounted || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "signin_with",
        shape: "rectangular",
        width: 360,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogleLogin();
    } else {
      let script = document.querySelector(`script[src="${scriptUrl}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
      script.addEventListener("load", initializeGoogleLogin);

      return () => {
        isMounted = false;
        script.removeEventListener("load", initializeGoogleLogin);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [googleClientId, handleGoogleCredential]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-teal-500 selection:bg-teal-200 selection:text-teal-900 font-sans">
      
      {/* Abstract Wave Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Lighter waves top-left */}
        <div className="absolute top-[-30%] left-[-10%] w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] bg-teal-400 rounded-full opacity-90 shadow-2xl"></div>
        <div className="absolute top-[-20%] left-[-30%] w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] bg-teal-300 rounded-full opacity-60"></div>
        
        {/* Darker waves bottom-right */}
        <div className="absolute bottom-[-40%] right-[-10%] w-[100vw] h-[100vw] md:w-[80vw] md:h-[80vw] bg-teal-600 rounded-full opacity-90 shadow-[0_0_80px_rgba(13,148,136,0.5)]"></div>
        <div className="absolute bottom-[-50%] right-[-20%] w-[90vw] h-[90vw] md:w-[70vw] md:h-[70vw] bg-teal-700 rounded-full opacity-70"></div>
        
        {/* Subtle grid pattern for texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] mix-blend-overlay"></div>
      </div>

      {/* Central Glass Card */}
      <div className="w-full max-w-[480px] relative z-10">

        {/* The Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/80 p-8 md:p-12 overflow-hidden relative">

          {/* Subtle inner highlight */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80"></div>

          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="flex items-center justify-center gap-3 cursor-pointer group mb-6" onClick={() => navigate('/')}>
              <MedicalCross size={44} className="drop-shadow-md group-hover:scale-105 transition-transform" />
              <div className="flex flex-col justify-center leading-none text-slate-900 text-left">
                <span className="font-extrabold text-[1.8rem] tracking-tight">Medical</span>
                <span className="font-semibold text-[1.1rem] tracking-widest text-teal-500">Clinic</span>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chào mừng trở lại</h2>
            <p className="text-slate-500 font-medium mt-2">Vui lòng đăng nhập để tiếp tục</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 ml-1">Email</label>
              <input
                id="email"
                type="email"
                className="w-full h-14 bg-white/50 border border-slate-200/60 text-slate-900 rounded-2xl px-5 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">Mật khẩu</label>
                <Link className="text-sm font-bold text-teal-600 hover:text-teal-500 transition-colors" to="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="w-full h-14 bg-white/50 border border-slate-200/60 text-slate-900 rounded-2xl px-5 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                placeholder="••••••••"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>

            <button
              className="w-full h-14 mt-8 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-2xl font-extrabold text-lg shadow-[0_10px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_10px_25px_rgba(20,184,166,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            {googleClientId && (
              <>
                <div className="flex items-center gap-4 my-8">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hoặc</span>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <div className="flex justify-center w-full [&>div]:w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/50 hover:bg-white transition-colors shadow-sm" ref={googleButtonRef} />
              </>
            )}
          </form>
        </div>

        {/* Bottom Link */}
        <p className="text-center font-medium text-slate-500 mt-8">
          Chưa có tài khoản?{" "}
          <Link className="font-bold text-teal-600 hover:text-teal-500 transition-colors" to="/register">
            Tạo tài khoản mới
          </Link>
        </p>
      </div>

    </div>
  );
}
