package com.clinicmanagement.report.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RevenueSummaryResponse {
    private BigDecimal totalRevenue;
    private Long totalInvoices;
    private BigDecimal averagePerInvoice;
}
