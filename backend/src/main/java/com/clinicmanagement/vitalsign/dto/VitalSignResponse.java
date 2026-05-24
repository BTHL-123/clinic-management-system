package com.clinicmanagement.vitalsign.dto;

import com.clinicmanagement.vitalsign.VitalSign;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VitalSignResponse(
        Long vitalSignId,
        Long consultationId,
        Long patientId,
        BigDecimal heightCm,
        BigDecimal weightKg,
        BigDecimal temperatureC,
        Integer bloodPressureSystolic,
        Integer bloodPressureDiastolic,
        Integer heartRate,
        Integer respiratoryRate,
        Integer spo2,
        Long measuredBy,
        LocalDateTime measuredAt
) {
    public static VitalSignResponse from(VitalSign v) {
        return new VitalSignResponse(
                v.getVitalSignId(),
                v.getConsultationId(),
                v.getPatientId(),
                v.getHeightCm(),
                v.getWeightKg(),
                v.getTemperatureC(),
                v.getBloodPressureSystolic(),
                v.getBloodPressureDiastolic(),
                v.getHeartRate(),
                v.getRespiratoryRate(),
                v.getSpo2(),
                v.getMeasuredBy(),
                v.getMeasuredAt()
        );
    }
}
