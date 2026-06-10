import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, RefreshCw, Settings, Trash2, X } from "lucide-react";
import {
  deleteSystemSetting,
  getSystemSettings,
  upsertSystemSetting,
} from "../../services/systemSettingService.js";
import { emitToast } from "../../services/toastService.js";

const PAGE_SIZE = 10;
const emptyForm = { settingKey: "", settingValue: "", description: "" };
const keyPattern = /^[a-zA-Z0-9._-]+$/;

const suggestedSettings = [
  "clinic.name",
  "clinic.phone",
  "clinic.email",
  "appointment.slotDurationMinutes",
  "appointment.maxAdvanceBookingDays",
  "feature.aiChat.enabled",
];

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  });
};

function formatValuePreview(value) {
  if (!value) return "—";
  if (value.length <= 90) return value;
  return `${value.slice(0, 90)}...`;
}

function validateForm(form) {
  const settingKey = form.settingKey.trim();
  if (!settingKey) return "Vui lòng nhập khóa cấu hình.";
  if (settingKey.length > 100) return "Khóa cấu hình không được vượt quá 100 ký tự.";
  if (!keyPattern.test(settingKey)) {
    return "Khóa cấu hình chỉ được chứa chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.";
  }
  if (form.settingValue.length > 5000) return "Giá trị cấu hình không được vượt quá 5000 ký tự.";
  if (form.description.length > 1000) return "Mô tả không được vượt quá 1000 ký tự.";
  return "";
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryParams = useMemo(() => ({
    page: pagination.page,
    size: PAGE_SIZE,
    sort: "updatedAt,desc",
  }), [pagination.page]);

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSystemSettings(queryParams);
      const data = response.data;
      setSettings(data.content || []);
      setPagination((current) => ({
        ...current,
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0,
      }));
    } catch (err) {
      setError(err.message || "Không thể tải cấu hình hệ thống.");
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormError("");
    setModalMode("create");
  };

  const openEditModal = (setting) => {
    setForm({
      settingKey: setting.settingKey || "",
      settingValue: setting.settingValue || "",
      description: setting.description || "",
    });
    setFormError("");
    setModalMode("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateForm(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await upsertSystemSetting(form.settingKey.trim(), {
        settingValue: form.settingValue,
        description: form.description,
      });
      emitToast({
        type: "success",
        title: "Đã lưu cấu hình",
        message: "Cấu hình hệ thống đã được cập nhật.",
      });
      closeModal();
      await loadSettings();
    } catch (err) {
      setFormError(err.message || "Không thể lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteSystemSetting(deleteTarget.settingKey);
      emitToast({
        type: "success",
        title: "Đã xóa cấu hình",
        message: `${deleteTarget.settingKey} đã được xóa khỏi hệ thống.`,
      });
      setDeleteTarget(null);
      setPagination((current) => ({
        ...current,
        page: settings.length === 1 ? Math.max(current.page - 1, 0) : current.page,
      }));
      await loadSettings();
    } catch (err) {
      setError(err.message || "Không thể xóa cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="flex flex-col items-center w-full mb-6">
        <div className="flex flex-col items-center">
          <h1 className="flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><Settings size={26} /></span>
            <span style={{ color: "#0f766e" }} className="text-2xl font-bold tracking-wide">Cấu hình hệ thống</span>
          </h1>
          <p className="text-white/70 font-medium mt-3 drop-shadow-sm">
            Quản lý các thiết lập vận hành dùng chung trong hệ thống.
          </p>
        </div>
        <div className="heading-actions absolute right-0 top-1/2 -translate-y-1/2">
          <button className="ghost-button" type="button" onClick={loadSettings} disabled={loading}>
            <RefreshCw size={17} />
            Làm mới
          </button>
          <button className="primary-button" type="button" onClick={openCreateModal}>
            <Plus size={17} />
            Thêm cấu hình
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="table-header" style={{ alignItems: "flex-start" }}>
          <div>
            <h2>Gợi ý key cấu hình</h2>
            <p className="muted" style={{ margin: 0 }}>Có thể tạo các key này nếu hệ thống cần dùng về sau.</p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {suggestedSettings.map((settingKey) => (
            <button
              key={settingKey}
              className="ghost-button"
              type="button"
              onClick={() => {
                setForm({ ...emptyForm, settingKey });
                setFormError("");
                setModalMode("create");
              }}
            >
              {settingKey}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="panel table-panel">
        <div className="table-header">
          <h2>Danh sách cấu hình</h2>
          <span className="muted">{pagination.totalElements} cấu hình</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table fixed-table">
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Key</th>
                <th>Giá trị</th>
                <th>Mô tả</th>
                <th>Cập nhật lần cuối</th>
                <th style={{ textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty-row">Đang tải cấu hình hệ thống...</td>
                </tr>
              ) : settings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">Chưa có cấu hình hệ thống.</td>
                </tr>
              ) : (
                settings.map((setting) => (
                  <tr key={setting.settingId || setting.settingKey}>
                    <td>
                      <strong style={{ color: "#0f172a" }}>{setting.settingKey}</strong>
                    </td>
                    <td style={{ maxWidth: 320, overflowWrap: "anywhere" }}>
                      {formatValuePreview(setting.settingValue)}
                    </td>
                    <td style={{ maxWidth: 320, overflowWrap: "anywhere" }}>
                      {setting.description || "—"}
                    </td>
                    <td>{formatDateTime(setting.updatedAt)}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        <button
                          className="icon-button"
                          type="button"
                          title="Chỉnh sửa"
                          aria-label={`Chỉnh sửa ${setting.settingKey}`}
                          onClick={() => openEditModal(setting)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          title="Xóa"
                          aria-label={`Xóa ${setting.settingKey}`}
                          onClick={() => setDeleteTarget(setting)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            className="ghost-button"
            type="button"
            disabled={pagination.page === 0 || loading}
            onClick={() => setPagination((current) => ({ ...current, page: Math.max(current.page - 1, 0) }))}
          >
            Trước
          </button>
          <span className="muted">
            Trang {pagination.page + 1} / {Math.max(pagination.totalPages, 1)}
          </span>
          <button
            className="ghost-button"
            type="button"
            disabled={pagination.page + 1 >= pagination.totalPages || loading}
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
          >
            Sau
          </button>
        </div>
      </section>

      {modalMode && (
        <div className="modal-overlay" onClick={closeModal}>
          <form className="modal-card modal-lg" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Settings size={20} />
                {modalMode === "create" ? "Thêm cấu hình" : "Cập nhật cấu hình"}
              </h2>
              <button className="icon-button" type="button" onClick={closeModal} disabled={saving}>
                <X size={18} />
              </button>
            </div>

            {formError && <div className="error-box">{formError}</div>}

            <div className="form-grid">
              <label>
                Key cấu hình
                <input
                  value={form.settingKey}
                  onChange={(event) => setForm((current) => ({ ...current, settingKey: event.target.value }))}
                  placeholder="clinic.name"
                  disabled={modalMode === "edit" || saving}
                />
              </label>
              <label>
                Mô tả
                <input
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Tên phòng khám hiển thị trong hệ thống"
                  disabled={saving}
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: 8, marginTop: 14 }}>
              Giá trị cấu hình
              <textarea
                value={form.settingValue}
                onChange={(event) => setForm((current) => ({ ...current, settingValue: event.target.value }))}
                placeholder="Nhập giá trị cấu hình"
                rows={8}
                disabled={saving}
                style={{ resize: "vertical" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button className="ghost-button" type="button" onClick={closeModal} disabled={saving}>
                Hủy
              </button>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !saving && setDeleteTarget(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Xóa cấu hình</h2>
              <button className="icon-button" type="button" onClick={() => setDeleteTarget(null)} disabled={saving}>
                <X size={18} />
              </button>
            </div>
            <p>
              Xác nhận xóa cấu hình <strong>{deleteTarget.settingKey}</strong> khỏi hệ thống?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button className="ghost-button" type="button" onClick={() => setDeleteTarget(null)} disabled={saving}>
                Hủy
              </button>
              <button className="danger-button" type="button" onClick={handleDelete} disabled={saving}>
                {saving ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
