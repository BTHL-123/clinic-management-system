import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import Logo from "../../components/Logo.jsx";

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
    <div className="auth-shell">
      <section className="auth-visual">
        <div className="brand-lockup">
          <Logo size={52} textColor="#0f4a8a" />
        </div>
        <h1>Điều phối vận hành phòng khám từ một màn hình rõ ràng.</h1>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Đăng nhập</h2>
          <p className="muted">Dùng tài khoản được cấp để vào hệ thống.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            {googleClientId && (
              <>
                <div className="auth-divider">
                  <span>Hoặc</span>
                </div>
                <div className="google-login-button" ref={googleButtonRef} />
              </>
            )}
            <p className="muted">
              <Link className="secondary-link" to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </p>
            <p className="muted">
              Chưa có tài khoản bệnh nhân?{" "}
              <Link className="secondary-link" to="/register">
                Đăng ký
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
