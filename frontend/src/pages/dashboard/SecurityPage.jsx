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
        setMessage("Role updated successfully.");
      } else {
        const response = await createRole(roleForm);
        savedRole = response.data;
        setMessage("Role created successfully.");
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
      setMessage("Role deleted successfully.");
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
      <section className="page-heading">
        <div>
          <h1>Security</h1>
          <p className="muted">Manage roles and assign permissions for protected modules.</p>
        </div>
        <div className="heading-actions">
          <button className="ghost-button" type="button" onClick={loadSecurity}>
            <RefreshCw size={17} />
            Refresh
          </button>
          <button className="primary-button compact" type="button" onClick={resetRoleForm}>
            <Plus size={17} />
            New role
          </button>
        </div>
      </section>

      {(message || error) && (
        <div className={error ? "error-box" : "success-box"}>{error || message}</div>
      )}

      <section className="split-layout security-layout">
        <div className="panel table-panel">
          <div className="table-header">
            <h2>Roles</h2>
            <span className="muted">{roles.length} total</span>
          </div>
          <div className="role-list">
            {loading ? (
              <div className="empty-state">Loading roles...</div>
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
                  <span>
                    <strong>{role.roleName}</strong>
                    <small>{role.description || "No description"}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="table-header">
            <h2>{selectedRole ? "Role details" : "Create role"}</h2>
            {selectedRole && (
              <button className="icon-button danger" type="button" onClick={handleDeleteRole}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <form className="form-grid" onSubmit={handleSaveRole}>
            <div className="field">
              <label htmlFor="roleName">Role name</label>
              <input
                id="roleName"
                value={roleForm.roleName}
                onChange={(event) => setRoleForm({ ...roleForm, roleName: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="roleDescription">Description</label>
              <input
                id="roleDescription"
                value={roleForm.description}
                onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
              />
            </div>

            <div className="permission-section">
              <div className="table-header">
                <h3>Permissions</h3>
                <span className="muted">{selectedPermissions.length} selected</span>
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
                      <small>{permission.description || "No description"}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                <Save size={17} />
                Save role
              </button>
              <button className="ghost-button" type="button" onClick={resetRoleForm}>
                Clear
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
