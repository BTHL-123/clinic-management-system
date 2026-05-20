import { Lock, Plus, RefreshCw, Search, Trash2, Unlock, UserRoundPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createUser,
  deleteUser,
  getUsers,
  lockUser,
  unlockUser,
  updateUser,
} from "../../services/userService";

const roleOptions = ["ADMIN", "RECEPTIONIST", "DOCTOR", "PHARMACIST", "LAB_TECHNICIAN", "PATIENT"];
const emptyForm = {
  fullName: "",
  email: "",
  password: "123456",
  phone: "",
  role: "RECEPTIONIST",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [filters, setFilters] = useState({ keyword: "", status: "", role: "" });
  const [form, setForm] = useState(emptyForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      size: 8,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      role: filters.role || undefined,
    }),
    [filters, pagination.page],
  );

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getUsers(queryParams);
      setUsers(response.data.content);
      setPagination((current) => ({
        ...current,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // The page needs to fetch users whenever filters or pagination change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUserId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          fullName: form.fullName,
          phone: form.phone,
          status: "ACTIVE",
        });
        setMessage("User updated successfully.");
      } else {
        await createUser({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          roles: [form.role],
        });
        setMessage("User created successfully.");
      }
      resetForm();
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.userId);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      phone: user.phone || "",
      role: user.roles?.[0] || "RECEPTIONIST",
    });
  };

  const runAction = async (action, successMessage) => {
    setMessage("");
    setError("");
    try {
      await action();
      setMessage(successMessage);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <h1>User Management</h1>
          <p className="muted">Create staff accounts, scan users, and lock or unlock access.</p>
        </div>
        <button className="primary-button compact" onClick={resetForm}>
          <Plus size={17} />
          New user
        </button>
      </section>

      <section className="panel">
        <form className="toolbar" onSubmit={(event) => event.preventDefault()}>
          <label className="search-box">
            <Search size={17} />
            <input
              value={filters.keyword}
              onChange={(event) => {
                setPagination((current) => ({ ...current, page: 0 }));
                setFilters({ ...filters, keyword: event.target.value });
              }}
              placeholder="Search name or email"
            />
          </label>
          <select
            value={filters.status}
            onChange={(event) => {
              setPagination((current) => ({ ...current, page: 0 }));
              setFilters({ ...filters, status: event.target.value });
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={filters.role}
            onChange={(event) => {
              setPagination((current) => ({ ...current, page: 0 }));
              setFilters({ ...filters, role: event.target.value });
            }}
          >
            <option value="">All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button className="icon-button" type="button" aria-label="Refresh users" onClick={loadUsers}>
            <RefreshCw size={17} />
          </button>
        </form>
      </section>

      {(message || error) && (
        <div className={error ? "error-box" : "success-box"}>{error || message}</div>
      )}

      <section className="split-layout">
        <div className="panel">
          <h2>{editingUserId ? "Edit user" : "Create user"}</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="userFullName">Full name</label>
              <input
                id="userFullName"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="userEmail">Email</label>
              <input
                id="userEmail"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                disabled={Boolean(editingUserId)}
                required
              />
            </div>
            {!editingUserId && (
              <div className="field">
                <label htmlFor="userPassword">Temporary password</label>
                <input
                  id="userPassword"
                  type="password"
                  value={form.password}
                  minLength={6}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="userPhone">Phone</label>
              <input
                id="userPhone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            {!editingUserId && (
              <div className="field">
                <label htmlFor="userRole">Role</label>
                <select
                  id="userRole"
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-actions">
              <button className="primary-button" type="submit">
                <UserRoundPlus size={17} />
                {editingUserId ? "Save changes" : "Create user"}
              </button>
              {editingUserId && (
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel table-panel">
          <div className="table-header">
            <h2>Users</h2>
            <span className="muted">{pagination.totalElements} total</span>
          </div>
          <div className="data-table" role="table" aria-label="Users">
            <div className="table-row table-head" role="row">
              <span>Name</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {loading ? (
              <div className="empty-state">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">No users found.</div>
            ) : (
              users.map((user) => (
                <div className="table-row" role="row" key={user.userId}>
                  <button className="text-button" type="button" onClick={() => startEdit(user)}>
                    <strong>{user.fullName}</strong>
                    <span>{user.email}</span>
                  </button>
                  <span>{user.roles?.join(", ")}</span>
                  <span className={`status-pill ${user.status?.toLowerCase()}`}>{user.status}</span>
                  <span className="row-actions">
                    {user.status === "LOCKED" ? (
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="Unlock user"
                        onClick={() => runAction(() => unlockUser(user.userId), "User unlocked.")}
                      >
                        <Unlock size={16} />
                      </button>
                    ) : (
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="Lock user"
                        onClick={() => runAction(() => lockUser(user.userId), "User locked.")}
                      >
                        <Lock size={16} />
                      </button>
                    )}
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label="Delete user"
                      onClick={() => runAction(() => deleteUser(user.userId), "User deleted.")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="pagination">
            <button
              className="ghost-button"
              type="button"
              disabled={pagination.page === 0}
              onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
            >
              Previous
            </button>
            <span>
              Page {pagination.page + 1} of {Math.max(pagination.totalPages, 1)}
            </span>
            <button
              className="ghost-button"
              type="button"
              disabled={pagination.page + 1 >= pagination.totalPages}
              onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
