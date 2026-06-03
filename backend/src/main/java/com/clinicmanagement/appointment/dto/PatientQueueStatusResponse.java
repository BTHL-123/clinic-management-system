package com.clinicmanagement.appointment.dto;

public record PatientQueueStatusResponse(
        String patientName,
        String doctorName,
        String appointmentCode,
        Integer myQueueNumber,
        Integer currentServingNumber,
        Integer patientsAhead,
        Integer estimatedWaitMinutes,
        String queueStatus
) {}
