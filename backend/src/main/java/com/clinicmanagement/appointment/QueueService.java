package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.PatientQueueStatusResponse;
import com.clinicmanagement.appointment.dto.QueueTicketResponse;
import java.time.LocalDate;
import java.util.List;

public interface QueueService {
    List<QueueTicketResponse> getQueue(LocalDate date, Long doctorId, String status);
    QueueTicketResponse callPatient(Long queueTicketId);
    QueueTicketResponse skipPatient(Long queueTicketId);
    QueueTicketResponse completePatient(Long queueTicketId);
    PatientQueueStatusResponse getPatientQueueStatus(Long userId);
}

