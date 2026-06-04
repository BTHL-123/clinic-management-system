# Kịch Bản Test Cho Các Chức Năng Của M4 (Tasks 78 - 81)

Dưới đây là các kịch bản kiểm thử (test scenarios) chi tiết từng bước cho 4 chức năng mới vừa được gộp. Hãy làm theo từng bước để đảm bảo luồng nghiệp vụ hoạt động trơn tru.

---

## 1. Kịch Bản: Hoàn tất phiên khám & Tạo Đơn Thuốc (Task 81 & một phần Task 78)
**Mục đích:** Đảm bảo Bác sĩ có thể nhập đơn thuốc, kiểm tra tương tác thuốc, hoàn tất ca khám và hệ thống tự động cập nhật trạng thái lịch hẹn/phiên khám sang "COMPLETED".
**Tài khoản sử dụng:** Bác sĩ (Doctor)

**Các bước thực hiện:**
1. **Đăng nhập** vào hệ thống bằng tài khoản **Bác sĩ**.
2. Truy cập vào **Lịch khám hôm nay** (hoặc danh sách ca khám đang ở trạng thái `IN_PROGRESS` / `WAITING`).
3. Click **Khám bệnh** để vào trang chi tiết khám bệnh (Examination Page).
4. Tại phần **3. Kê đơn thuốc (Prescription)**:
   - Thêm một vài loại thuốc từ danh sách (ví dụ: Paracetamol, Amoxicillin).
   - Nhập số lượng, liều dùng (Sáng, Trưa, Tối, Đêm), và số ngày uống.
   - Nhập ghi chú đơn thuốc.
5. Click nút **"Kiểm tra tương tác thuốc"**:
   - Chờ hệ thống gọi API kiểm tra. 
   - Đảm bảo hệ thống hiển thị thông báo "An toàn" hoặc các cảnh báo tương tác thuốc nếu có.
6. Click nút **"Lưu đơn thuốc"** để tạo đơn thuốc cho bệnh nhân.
7. Sau khi đơn thuốc được lưu, cuộn xuống dưới cùng và click nút **"Hoàn tất phiên khám"** (Complete Consultation).
8. **Kiểm tra kết quả:**
   - Hệ thống thông báo hoàn tất thành công và tự động chuyển về trang danh sách ca khám.
   - Trạng thái của ca khám đó chuyển sang **"Hoàn thành" (COMPLETED)**.
   - Trong màn hình Chi tiết khám, đơn thuốc không thể chỉnh sửa nữa.

---

## 2. Kịch Bản: Dược sĩ xem và cấp phát thuốc (Task 79)
**Mục đích:** Đảm bảo Dược sĩ có thể xem danh sách các đơn thuốc đang chờ cấp phát, xem chi tiết và xác nhận cấp phát để xuất kho.
**Tài khoản sử dụng:** Dược sĩ (Pharmacist) hoặc Admin có quyền tương đương.

**Các bước thực hiện:**
1. **Đăng nhập** vào hệ thống bằng tài khoản **Dược sĩ / Admin**.
2. Ở Sidebar menu, tìm và click vào mục **Quản lý cấp phát thuốc** (hoặc `pharmacist/prescriptions`).
3. **Kiểm tra danh sách đơn thuốc:**
   - Bạn sẽ thấy đơn thuốc vừa được Bác sĩ tạo ở Kịch bản 1 đang ở trạng thái **Chờ cấp phát (CREATED)** hoặc **Đã kiểm tra (CHECKED)**.
   - Bạn có thể dùng bộ lọc trạng thái để lọc các đơn "Chờ cấp phát".
4. **Xem chi tiết đơn thuốc:**
   - Click nút **"Xem"** (biểu tượng con mắt) trên đơn thuốc đó.
   - Màn hình chuyển sang trang Chi tiết Đơn Thuốc (Prescription Detail Page - **Task 78**).
   - Kiểm tra xem các loại thuốc, liều lượng, số lượng và các cảnh báo tương tác thuốc có hiển thị đầy đủ và đúng như bác sĩ đã kê hay không.
5. **Thực hiện cấp phát:**
   - Quay lại trang Quản lý cấp phát (hoặc click nút "Cấp phát" ngay trong trang chi tiết nếu có).
   - Tại danh sách, click nút **"Cấp phát"** (biểu tượng Check) màu xanh lá.
   - Một hộp thoại xác nhận hiện lên: *"Xác nhận cấp phát đơn thuốc...? Thao tác này sẽ xuất kho tự động."* -> Click **OK**.
6. **Kiểm tra kết quả:**
   - Hệ thống báo thành công.
   - Trạng thái đơn thuốc chuyển sang **"Đã cấp phát" (DISPENSED)**.
   - (Tùy chọn) Có thể vào phần quản lý Kho thuốc (Inventory) để kiểm tra xem số lượng thuốc đã bị trừ đi tương ứng hay chưa.

---

## 3. Kịch Bản: Bệnh nhân xem chi tiết Đơn Thuốc (Task 78)
**Mục đích:** Bệnh nhân xem được đơn thuốc mà bác sĩ đã kê cho mình.
**Tài khoản sử dụng:** Bệnh nhân (Patient)

**Các bước thực hiện:**
1. **Đăng nhập** bằng tài khoản **Bệnh nhân** (tài khoản đã được bác sĩ kê đơn ở Kịch bản 1).
2. Truy cập vào phần **Lịch sử khám bệnh** (hoặc My Appointments / Lịch sử hẹn).
3. Chọn ca khám vừa hoàn tất để xem chi tiết.
4. Tìm đến phần **Đơn thuốc**, click vào nút xem đơn thuốc.
5. **Kiểm tra kết quả:**
   - Trang **Chi tiết Đơn Thuốc** hiện ra, hiển thị đầy đủ mã đơn, thông tin bác sĩ kê, danh sách thuốc, liều lượng và trạng thái (Đã cấp phát).
   - Giao diện phải đẹp, dễ đọc, phù hợp với bệnh nhân.

---

## 4. Kịch Bản: Bệnh nhân xem kết quả Xét Nghiệm (Task 80)
**Mục đích:** Bệnh nhân có thể tự xem lại các kết quả xét nghiệm (Lab Results) của mình mà không cần hỏi lại bác sĩ.
**Tài khoản sử dụng:** Bệnh nhân (Patient)

**Tiền đề:** Cần đảm bảo bệnh nhân này đã có một phiếu yêu cầu xét nghiệm (Lab Request) và phiếu đó đã được Kỹ thuật viên (Lab Technician) điền kết quả + chuyển trạng thái sang **Hoàn thành (COMPLETED)**.

**Các bước thực hiện:**
1. **Đăng nhập** bằng tài khoản **Bệnh nhân**.
2. Ở giao diện Sidebar của bệnh nhân, click vào mục **Kết quả xét nghiệm** (My Lab Results).
3. **Kiểm tra danh sách:**
   - Màn hình hiển thị danh sách các phiếu yêu cầu xét nghiệm.
   - Nếu phiếu chưa có kết quả, trạng thái sẽ là "Đang thực hiện" hoặc "Chờ xử lý".
4. **Xem chi tiết kết quả:**
   - Click trực tiếp vào một dòng phiếu xét nghiệm đã **Hoàn thành**.
   - Bảng chi tiết sẽ mở rộng xuống dưới (Accordion / Dropdown).
   - Kiểm tra các cột hiển thị: *Tên xét nghiệm, Kết quả (Value), Đơn vị, Khoảng bình thường, Kết luận*.
5. **Kiểm tra kết quả:**
   - Đảm bảo kết quả hiển thị rõ ràng.
   - Các xét nghiệm chưa có kết quả sẽ hiển thị chữ *"Chưa có kết quả"*.
   - Phân trang (Pagination) hoạt động tốt nếu bệnh nhân có nhiều hơn 10 phiếu xét nghiệm.
