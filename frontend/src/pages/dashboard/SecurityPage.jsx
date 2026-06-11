import { KeyRound, Plus, RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  assignPermissions,
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  updateRole,
} from "../../services/securityService";

const emptyRole = { roleName: "", description: "" };

const roleDescriptions = {
  "Patient role": "Vai trò Bệnh nhân",
  "Doctor role": "Vai trò Bác sĩ",
  "Receptionist role": "Vai trò Lễ tân",
  "Administrator role": "Vai trò Quản trị viên",
  "Pharmacist role": "Vai trò Dược sĩ",
  "Lab technician role": "Vai trò Kỹ thuật viên xét nghiệm"
};

const permissionDescriptions = {
  "Manage user accounts": "Quản lý tài khoản người dùng",
  "Manage staff information": "Quản lý thông tin nhân viên",
  "View patient medical record": "Xem hồ sơ bệnh án",
  "Manage appointment": "Quản lý lịch khám",
  "Manage medicine stock": "Quản lý kho thuốc",
  "Manage system settings": "Quản lý cài đặt hệ thống",
  "Manage doctor information": "Quản lý thông tin bác sĩ",
  "Manage departments": "Quản lý chuyên khoa",
  "Create appointment": "Tạo lịch khám",
  "Create prescription": "Kê đơn thuốc",
  "View reports": "Xem báo cáo thống kê"
};

export default function SecurityPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.roleId === selectedRoleId),
    [roles, selectedRoleId],
  );

  const selectRole = (role, permissionSource = permissions) => {
    setSelectedRoleId(role.roleId);
    setRoleForm({ roleName: role.roleName, description: role.description || "" });
    const permissionIds = permissionSource
      .filter((permission) => role.permissions?.includes(permission.permissionCode))
      .map((permission) => permission.permissionId);
    setSelectedPermissions(permissionIds);
  };

  const loadSecurity = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(rolesResponse.data);
      setPermissions(permissionsResponse.data);
      if (!selectedRoleId && rolesResponse.data.length > 0) {
        selectRole(rolesResponse.data[0], permissionsResponse.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // The page needs to fetch initial data when it mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSecurity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetRoleForm = () => {
    setSelectedRoleId(null);
    setRoleForm(emptyRole);
    setSelectedPermissions([]);
  };

  const handleSaveRole = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      let savedRole;
      if (selectedRoleId) {
        const response = await updateRole(selectedRoleId, roleForm);
        savedRole = response.data;
        setMessage("Cập nhật vai trò thành công.");
      } else {
        const response = await createRole(roleForm);
        savedRole = response.data;
        setMessage("Tạo vai trò thành công.");
      }
      await assignPermissions(savedRole.roleId, selectedPermissions);
      await loadSecurity();
      setSelectedRoleId(savedRole.roleId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRoleId) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await deleteRole(selectedRoleId);
      setMessage("Xóa vai trò thành công.");
      resetRoleForm();
      await loadSecurity();
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    );
  };

  return (
    <div className="page-stack">
      <div className="flex flex-col items-center w-full mb-6">
        <div className="flex flex-col items-center">
          <h1 className="flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><ShieldCheck size={26} /></span>
            <span style={{ color: "#0f766e" }} className="text-2xl font-bold tracking-wide">Bảo mật &amp; Phân quyền</span>
          </h1>
          <p className="text-white/70 font-medium mt-3 drop-shadow-sm">
            Quản lý vai trò và phân quyền truy cập cho các module hệ thống.
          </p>
        </div>
        <div className="heading-actions absolute right-0 top-1/2 -translate-y-1/2">
          <button className="ghost-button" type="button" onClick={loadSecurity}>
            <RefreshCw size={17} />
            Làm mới
          </button>
          <button className="primary-button compact" type="button" onClick={resetRoleForm}>
            <Plus size={17} />
            Thêm vai trò
          </button>
        </div>
      </div>

      {(message || error) && (
        <div className={error ? "error-box" : "success-box"}>{error || message}</div>
      )}

      <section className="split-layout security-layout">
        <div className="panel table-panel">
          <div className="table-header">
            <h2>Danh sách vai trò</h2>
            <span className="muted">{roles.length} vai trò</span>
          </div>
          <div className="role-list">
            {loading ? (
              <div className="empty-state">Đang tải danh sách vai trò...</div>
            ) : (
              roles.map((role) => (
                <button
                  key={role.roleId}
                  className={`role-card${role.roleId === selectedRoleId ? " selected" : ""}`}
                  type="button"
                  onClick={() => selectRole(role)}
                >
                  <span className="role-icon">
                    <ShieldCheck size={18} />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                    <strong>{role.roleName}</strong>
                    <small>{roleDescriptions[role.description] || role.description || "Không có mô tả"}</small>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="table-header">
            <h2>{selectedRole ? "Chi tiết vai trò" : "Tạo vai trò"}</h2>
            <div className="row-actions">
              <button className="ghost-button" type="button" onClick={loadSecurity}>
                <RefreshCw size={16} />
                Làm mới
              </button>
              <button className="primary-button compact" type="button" onClick={resetRoleForm}>
                <Plus size={16} />
                Thêm vai trò
              </button>
              {selectedRole && (
                <button className="icon-button danger" type="button" onClick={handleDeleteRole}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          <form className="form-grid" onSubmit={handleSaveRole}>
            <div className="field">
              <label htmlFor="roleName">Tên vai trò</label>
              <input
                id="roleName"
                value={roleForm.roleName}
                onChange={(event) => setRoleForm({ ...roleForm, roleName: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="roleDescription">Mô tả</label>
              <input
                id="roleDescription"
                value={roleForm.description}
                onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
              />
            </div>

            <div className="permission-section">
              <div className="table-header">
                <h3>Danh sách quyền</h3>
                <span className="muted">{selectedPermissions.length} đã chọn</span>
              </div>
              <div className="permission-grid">
                {permissions.map((permission) => (
                  <label className="permission-item" key={permission.permissionId}>
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.permissionId)}
                      onChange={() => togglePermission(permission.permissionId)}
                    />
                    <span>
                      <strong>
                        <KeyRound size={15} />
                        {permission.permissionCode}
                      </strong>
                      <small>{permissionDescriptions[permission.description] || permission.description || "Không có mô tả"}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                <Save size={17} />
                Lưu vai trò
              </button>
              <button className="ghost-button" type="button" onClick={resetRoleForm}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
