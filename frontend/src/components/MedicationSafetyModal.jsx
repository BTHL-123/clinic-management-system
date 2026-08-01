import { createPortal } from "react-dom";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";

export default function MedicationSafetyModal({
  open,
  variant = "allergy",
  title,
  subtitle,
  medicineName,
  activeIngredient,
  patientAllergies,
  warningLevel,
  message,
  busy = false,
  onClose,
  onConfirm,
}) {
  if (!open || typeof document === "undefined") return null;

  const isInteraction = variant === "interaction";

  return createPortal(
    <div
      className="medication-safety-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="medication-safety-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <section className={`medication-safety-modal medication-safety-modal--${variant}`}>
        <header className="medication-safety-header">
          <span className="medication-safety-icon" aria-hidden="true">
            {isInteraction ? <ShieldAlert size={24} /> : <AlertTriangle size={24} />}
          </span>
          <div className="medication-safety-heading">
            <h2 id="medication-safety-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            type="button"
            className="medication-safety-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng cảnh báo"
          >
            <X size={19} />
          </button>
        </header>

        <div className="medication-safety-body">
          {warningLevel && (
            <div className="medication-safety-level">
              Mức độ cảnh báo: <strong>{warningLevel}</strong>
            </div>
          )}

          {medicineName && (
            <div className="medication-safety-info-card">
              <span>Thuốc được chọn</span>
              <strong>{medicineName}</strong>
              {activeIngredient && <p>Hoạt chất: {activeIngredient}</p>}
            </div>
          )}

          {patientAllergies && (
            <div className="medication-safety-allergies">
              <span>Tiền sử dị ứng của bệnh nhân</span>
              <p>{patientAllergies}</p>
            </div>
          )}

          <p className="medication-safety-message">{message}</p>
        </div>

        <footer className="medication-safety-actions">
          {isInteraction && (
            <button
              type="button"
              className="medication-safety-button medication-safety-button--secondary"
              onClick={onClose}
              disabled={busy}
            >
              Quay lại chỉnh đơn
            </button>
          )}
          <button
            type="button"
            className="medication-safety-button medication-safety-button--primary"
            onClick={isInteraction ? onConfirm : onClose}
            disabled={busy}
          >
            {busy ? "Đang xử lý..." : isInteraction ? "Vẫn tiếp tục kê" : "Đã hiểu, chọn thuốc khác"}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
