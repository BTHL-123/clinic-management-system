package com.clinicmanagement.medicalservice.dto;

import com.clinicmanagement.medicalservice.MedicalService;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MedicalServiceResponse(
        Long serviceId,
        String serviceCode,
        String serviceName,
        String serviceType,
        BigDecimal price,
        String description,
        String status,
        LocalDateTime createdAt
) {
    public static MedicalServiceResponse from(MedicalService entity) {
        return new MedicalServiceResponse(
                entity.getServiceId(),
                entity.getServiceCode(),
                entity.getServiceName(),
                entity.getServiceType(),
                entity.getPrice(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }
}
