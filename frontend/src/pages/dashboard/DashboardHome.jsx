const metrics = [
  ["Người dùng", "Auth core"],
  ["Phân quyền", "Role/Permission"],
  ["Bảo mật", "JWT"],
  ["Cấu hình", "System settings"],
];

export default function DashboardHome() {
  return (
    <>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p className="muted">
        Core layout cho Người 1 đã sẵn sàng để nối các màn admin và module khác.
      </p>
      <div className="metric-grid">
        {metrics.map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}
