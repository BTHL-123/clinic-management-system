package com.clinicmanagement.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.util.List;

public record UpdateInvoiceRequest(

        @DecimalMin(value = "0.0", message = "Giảm giá phải lớn hơn hoặc bằng 0")
        BigDecimal discountAmount,

        @NotEmpty(message = "Danh sách dịch vụ/thuốc của hóa đơn không được để trống")
        @Valid
        List<CreateInvoiceRequest.InvoiceItemRequest> items
) {
}
