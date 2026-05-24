import { useState } from "react";

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thanh toán</h1>
        <p className="text-gray-600 mt-1">Xử lý thanh toán hóa đơn và hoàn tiền.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`${
                activeTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Chờ thanh toán
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Lịch sử giao dịch
            </button>
          </nav>
        </div>

        {activeTab === "pending" && (
          <div className="text-center py-10">
            <p className="text-gray-500">Đang tải danh sách hóa đơn chờ thanh toán...</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="text-center py-10">
            <p className="text-gray-500">Chưa có lịch sử giao dịch nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
