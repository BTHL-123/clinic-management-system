import { Lock, Plus, RefreshCw, Search, Trash2, Unlock, UserRoundPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getActiveDepartments } from "../../services/departmentService";
import {
  createUser,
  deleteUser,
  getUsers,
  lockUser,
  unlockUser,
  updateUser,
} from "../../services/userService";

const roleOptions = ["ADMIN", "RECEPTIONIST", "DOCTOR", "PHARMACIST", "LAB_TECHNICIAN", "PATIENT"];
const createEmptyForm = () => ({
  fullName: "",
  email: "",
  password: "123456",
  phone: "",
  role: "RECEPTIONIST",
  doctorProfile: {
    departmentId: "",
    doctorCode: "",
    degree: "",
    specialization: "",
    yearsOfExperience: 0,
    consultationFee: 0,
  },
});

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [filters, setFilters] = useState({ keyword: "", status: "", role: "" });
  const [form, setForm] = useState(createEmptyForm);
  const [departments, setDepartments] = useState([]);
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

  useEffect(() => {
    getActiveDepartments()
      .then((response) => setDepartments(response.data ?? []))
      .catch((err) => setError(err.message));
  }, []);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingUserId(null);
  };

  const updateDoctorProfile = (field, value) => {
    setForm((current) => ({
      ...current,
      doctorProfile: {
        ...current.doctorProfile,
        [field]: value,
      },
    }));
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
        setMessage("Cập nhật tài khoản thành công.");
      } else {
        const roles = [form.role];
        const doctorProfile = form.role === "DOCTOR"
          ? {
              ...form.doctorProfile,
              departmentId: Number(form.doctorProfile.departmentId),
              doctorCode: form.doctorProfile.doctorCode || null,
              yearsOfExperience: Number(form.doctorProfile.yearsOfExperience || 0),
              consultationFee: Number(form.doctorProfile.consultationFee || 0),
              status: "ACTIVE",
            }
          : null;

        await createUser({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          roles,
          doctorProfile,
        });
        setMessage("Tạo tài khoản thành công.");
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
      doctorProfile: createEmptyForm().doctorProfile,
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
          <h1>Quản lý Tài khoản</h1>
          <p className="muted">Tạo tài khoản nhân viên, tìm kiếm và quản lý quyền truy cập.</p>
        </div>
        <button className="primary-button compact" onClick={resetForm}>
          <Plus size={17} />
          Tạo tài khoản
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
              placeholder="Tìm tên hoặc email"
            />
          </label>
          <select
            value={filters.status}
            onChange={(event) => {
              setPagination((current) => ({ ...current, page: 0 }));
              setFilters({ ...filters, status: event.target.value });
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
          <select
            value={filters.role}
            onChange={(event) => {
              setPagination((current) => ({ ...current, page: 0 }));
              setFilters({ ...filters, role: event.target.value });
            }}
          >
            <option value="">Tất cả vai trò</option>
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
          <h2>{editingUserId ? "Sửa tài khoản" : "Tạo tài khoản"}</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="userFullName">Họ và tên</label>
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
                <label htmlFor="userPassword">Mật khẩu tạm thời</label>
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
              <label htmlFor="userPhone">Số điện thoại</label>
              <input
                id="userPhone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            {!editingUserId && (
              <div className="field">
                <label htmlFor="userRole">Vai trò</label>
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
            {!editingUserId && form.role === "DOCTOR" && (
              <>
                <div className="field">
                  <label htmlFor="doctorDepartment">Chuyên khoa</label>
                  <select
                    id="doctorDepartment"
                    value={form.doctorProfile.departmentId}
                    onChange={(event) => updateDoctorProfile("departmentId", event.target.value)}
                    required
                  >
                    <option value="">Chọn chuyên khoa</option>
                    {departments.map((department) => (
                      <option key={department.departmentId} value={department.departmentId}>
                        {department.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="doctorCode">Mã bác sĩ</label>
                  <input
                    id="doctorCode"
                    value={form.doctorProfile.doctorCode}
                    onChange={(event) => updateDoctorProfile("doctorCode", event.target.value)}
                    placeholder="Tự động tạo nếu để trống"
                  />
                </div>
                <div className="field">
                  <label htmlFor="doctorDegree">Học vị</label>
                  <input
                    id="doctorDegree"
                    value={form.doctorProfile.degree}
                    onChange={(event) => updateDoctorProfile("degree", event.target.value)}
                    placeholder="MD, BS.CKI, ThS..."
                  />
                </div>
                <div className="field">
                  <label htmlFor="doctorSpecialization">Chuyên môn</label>
                  <input
                    id="doctorSpecialization"
                    value={form.doctorProfile.specialization}
                    onChange={(event) => updateDoctorProfile("specialization", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="doctorExperience">Số năm kinh nghiệm</label>
                  <input
                    id="doctorExperience"
                    type="number"
                    min="0"
                    value={form.doctorProfile.yearsOfExperience}
                    onChange={(event) => updateDoctorProfile("yearsOfExperience", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="doctorFee">Phí khám</label>
                  <input
                    id="doctorFee"
                    type="number"
                    min="0"
                    value={form.doctorProfile.consultationFee}
                    onChange={(event) => updateDoctorProfile("consultationFee", event.target.value)}
                  />
                </div>
              </>
            )}
            <div className="form-actions">
              <button className="primary-button" type="submit">
                <UserRoundPlus size={17} />
                {editingUserId ? "Lưu thay đổi" : "Tạo tài khoản"}
              </button>
              {editingUserId && (
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel table-panel">
          <div className="table-header">
            <h2>Danh sách tài khoản</h2>
            <span className="muted">{pagination.totalElements} tài khoản</span>
          </div>
          <div className="data-table" role="table" aria-label="Users">
            <div className="table-row table-head" role="row">
              <span>Tên</span>
              <span>Vai trò</span>
              <span>Trạng thái</span>
              <span>Thao tác</span>
            </div>
            {loading ? (
              <div className="empty-state">Đang tải danh sách...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">Không tìm thấy tài khoản nào.</div>
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
                        onClick={() => runAction(() => unlockUser(user.userId), "Đã mở khóa tài khoản.")}
                      >
                        <Unlock size={16} />
                      </button>
                    ) : (
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="Lock user"
                        onClick={() => runAction(() => lockUser(user.userId), "Đã khóa tài khoản.")}
                      >
                        <Lock size={16} />
                      </button>
                    )}
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label="Delete user"
                      onClick={() => runAction(() => deleteUser(user.userId), "Đã xóa tài khoản.")}
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
              Trước
            </button>
            <span>
              Trang {pagination.page + 1} / {Math.max(pagination.totalPages, 1)}
            </span>
            <button
              className="ghost-button"
              type="button"
              disabled={pagination.page + 1 >= pagination.totalPages}
              onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
            >
              Tiếp
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
