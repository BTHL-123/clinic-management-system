import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { ToastContext } from "../context/ToastContextObject.js";
import { TOAST_EVENT, emitToast, getErrorMessage } from "../services/toastService.js";

const TOAST_TTL_MS = 4200;

const iconByType = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((toast) => {
    const id = crypto.randomUUID();
    const nextToast = {
      id,
      type: toast.type || "info",
      title: toast.title,
      message: toast.message || "",
    };

    setToasts((current) => [...current, nextToast].slice(-4));
    window.setTimeout(() => dismiss(id), toast.duration || TOAST_TTL_MS);
    return id;
  }, [dismiss]);

  useEffect(() => {
    const handleToast = (event) => show(event.detail || {});
    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, [show]);

  const value = useMemo(() => ({
    show,
    success: (message, title = "Thành công") => show({ type: "success", title, message }),
    error: (error, title = "Không thể thực hiện thao tác") => {
      if (error?.toastShown) return null;
      return show({ type: "error", title, message: getErrorMessage(error) });
    },
    info: (message, title = "Thông báo") => show({ type: "info", title, message }),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = iconByType[toast.type] || Info;
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
              <Icon size={20} className="toast-icon" />
              <div className="toast-copy">
                {toast.title && <strong>{toast.title}</strong>}
                {toast.message && <span>{toast.message}</span>}
              </div>
              <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Đóng thông báo">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export { emitToast };
