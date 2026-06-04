# Kịch Bản Test Cho Role Dược Sĩ (Pharmacist)

Dưới đây là luồng kịch bản kiểm thử (test scenarios) chi tiết dành cho tài khoản **Dược sĩ**. Kịch bản này bao quát toàn bộ vòng đời quản lý kho thuốc từ lúc nhập kho đến lúc cấp phát cho bệnh nhân.

---

## 1. Quản Lý Danh Mục (Thuốc & Nhà Cung Cấp)

**Mục đích:** Đảm bảo Dược sĩ có thể tạo dữ liệu gốc (Master Data) để chuẩn bị cho việc nhập kho.

### Kịch bản 1.1: Tạo Nhà Cung Cấp Mới
1. **Đăng nhập** bằng tài khoản Dược sĩ.
2. Chọn menu **Nhà cung cấp** (Suppliers).
3. Click nút **Thêm nhà cung cấp**.
4. Điền đầy đủ thông tin: *Tên nhà cung cấp, Số điện thoại, Email, Địa chỉ*.
5. Bấm **Lưu**. 
   - **Kết quả mong đợi:** Hệ thống báo thành công, nhà cung cấp mới xuất hiện trong danh sách.

### Kịch bản 1.2: Tạo Thuốc Mới (Sử dụng mã tự động)
1. Chọn menu **Thuốc** (Medicines).
2. Click nút **Thêm thuốc mới**.
3. Bỏ trống ô **Mã thuốc** để test tính năng sinh mã tự động `MED-xxx`.
4. Điền đầy đủ: *Tên thuốc, Hoạt chất, Dạng bào chế, Hàm lượng, Đơn vị, Mô tả*.
5. Bấm **Thêm mới**.
   - **Kết quả mong đợi:** Hệ thống tự tạo mã `MED-xxx` và lưu thuốc thành công.

---

## 2. Quản Lý Kho (Lô Thuốc & Giao Dịch)

**Mục đích:** Nhập thuốc vào kho để có số lượng tồn kho thực tế, đồng thời theo dõi các cảnh báo hết hạn.

### Kịch bản 2.1: Nhập Kho (Tạo lô thuốc mới)
1. Chọn menu **Lô thuốc** (Medicine Batches).
2. Click nút **Nhập lô thuốc mới**.
3. Trong form nhập kho, chọn **Thuốc** và **Nhà cung cấp** vừa tạo ở bước 1.
4. Nhập các thông tin quan trọng:
   - **Số lượng nhập:** (Ví dụ: 100)
   - **Giá nhập, Giá bán:** (Ví dụ: Nhập 10.000đ, Bán 15.000đ)
   - **Ngày sản xuất & Ngày hết hạn:** (Ví dụ: Hết hạn vào tháng sau).
5. Bấm **Lưu/Nhập kho**.
   - **Kết quả mong đợi:** Lô thuốc được tạo với số lượng tồn (Current Quantity) bằng số lượng nhập.
   - **Kiểm tra chéo:** Sang tab **Giao dịch kho** (Inventory Transactions), bạn sẽ thấy tự động sinh ra một giao dịch loại **"Nhập kho" (IN)** với số lượng +100.

### Kịch bản 2.2: Kiểm tra Cảnh báo kho (Inventory Alerts)
1. Chọn menu **Cảnh báo kho** (Inventory Alerts).
2. Kiểm tra xem lô thuốc vừa tạo có nằm trong diện cảnh báo không.
   - Nếu bạn cố tình đặt ngày hết hạn (Expiration Date) rất gần (trong vòng 30 ngày tới), lô thuốc đó sẽ xuất hiện trong danh sách **Sắp hết hạn**.
   - Nếu số lượng tồn kho tụt xuống quá thấp, thuốc sẽ hiện ở danh sách **Sắp hết hàng**.

---

## 3. Cấp Phát Thuốc Cho Bệnh Nhân (Dispense)

**Mục đích:** Test luồng Dược sĩ nhận đơn thuốc từ Bác sĩ và xuất kho thuốc để đưa cho Bệnh nhân.

**Tiền đề:** Cần dùng tài khoản Bác sĩ khám cho 1 bệnh nhân và kê đơn bao gồm loại thuốc bạn vừa nhập kho (có trạng thái đơn thuốc là CREATED/CHECKED).

### Kịch bản 3.1: Xem danh sách và Chi tiết đơn thuốc
1. Chọn menu **Cấp phát thuốc** (Prescriptions / Dispense).
2. Màn hình sẽ hiển thị danh sách các đơn thuốc đang chờ cấp phát.
3. Click vào **biểu tượng Mắt (Xem)** trên đơn thuốc mới nhất.
   - **Kết quả mong đợi:** Màn hình chuyển sang trang Chi tiết đơn thuốc, hiển thị tên bệnh nhân, bác sĩ kê, danh sách các loại thuốc, số lượng và liều dùng.

### Kịch bản 3.2: Thực hiện Cấp Phát (Xuất kho tự động)
1. Trở lại danh sách đơn thuốc chờ cấp phát.
2. Click vào **biểu tượng Check màu xanh** (Cấp phát) trên đơn thuốc.
3. Một popup xác nhận hiện lên: *"Xác nhận cấp phát đơn thuốc...? Thao tác này sẽ xuất kho tự động."* -> Bấm **Đồng ý**.
   - **Kết quả mong đợi:** 
     - Trạng thái đơn thuốc chuyển sang **Đã cấp phát (DISPENSED)**.
     - **Kiểm tra chéo (Rất quan trọng):** 
       1. Vào lại menu **Lô thuốc**, kiểm tra xem số lượng tồn (Current Quantity) của loại thuốc đó có bị trừ đi đúng bằng số lượng bác sĩ kê không.
       2. Vào menu **Giao dịch kho**, kiểm tra xem có một giao dịch loại **"Xuất kho" (OUT)** vừa được tự động sinh ra với nội dung là *"Cấp phát thuốc cho đơn thuốc [Mã Đơn]"* hay không.
