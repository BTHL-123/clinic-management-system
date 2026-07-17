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
public class DoctorPerformanceResponse {
    private Long doctorId;
    private String doctorName;
    private Long totalAppointments;
    private BigDecimal totalRevenue;
    private Double averageRating;
}
