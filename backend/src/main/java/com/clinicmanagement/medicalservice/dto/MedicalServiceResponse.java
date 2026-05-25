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
    public static MedicalServiceResponse from(MedicalService service) {
        return new MedicalServiceResponse(
                service.getServiceId(),
                service.getServiceCode(),
                service.getServiceName(),
                service.getServiceType(),
                service.getPrice(),
                service.getDescription(),
                service.getStatus(),
                service.getCreatedAt()
        );
    }
}
