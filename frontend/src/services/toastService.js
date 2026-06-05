export const TOAST_EVENT = "clinic-toast";

export function emitToast(toast) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: toast }));
}

export function getErrorMessage(error, fallback = "Đã xảy ra lỗi. Vui lòng thử lại.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback
  );
}

export function notifyError(error, fallback) {
  emitToast({
    type: "error",
    title: "Không thể thực hiện thao tác",
    message: getErrorMessage(error, fallback),
  });
}
