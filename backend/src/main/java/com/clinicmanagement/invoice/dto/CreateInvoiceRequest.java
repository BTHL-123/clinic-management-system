package com.clinicmanagement.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record CreateInvoiceRequest(

        @NotNull(message = "Patient ID không được để trống")
        Long patientId,

        Long appointmentId,

        @DecimalMin(value = "0.0", message = "Giảm giá phải lớn hơn hoặc bằng 0")
        BigDecimal discountAmount,

        @NotEmpty(message = "Danh sách dịch vụ/thuốc của hóa đơn không được để trống")
        @Valid
        List<InvoiceItemRequest> items
) {

    public record InvoiceItemRequest(
            @NotBlank(message = "Loại dịch vụ không được để trống")
            String itemType,

            Long referenceId,

            @NotBlank(message = "Tên dịch vụ không được để trống")
            String itemName,

            @NotNull(message = "Số lượng không được để trống")
            Integer quantity,

            @NotNull(message = "Đơn giá không được để trống")
            @DecimalMin(value = "0.0", message = "Đơn giá phải lớn hơn hoặc bằng 0")
            BigDecimal unitPrice
    ) {}
}
