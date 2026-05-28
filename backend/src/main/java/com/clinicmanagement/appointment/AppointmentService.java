package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;

import com.clinicmanagement.appointment.dto.BookAppointmentRequest;

public interface AppointmentService {

    PageResponse<AppointmentResponse> getAppointments(
            Long patientId,
            Long doctorId,
            LocalDate date,
            String status,
            Pageable pageable
    );

    AppointmentResponse getAppointmentById(Long id, Long currentUserId, boolean isPatient);

    PageResponse<AppointmentResponse> getMyAppointments(
            Long userId,
            boolean upcoming,
            Pageable pageable
    );

    AppointmentResponse bookAppointment(BookAppointmentRequest request, Long userId);

    AppointmentResponse checkInAppointment(Long appointmentId, Long receptionistId);

    PageResponse<AppointmentResponse> searchAppointmentsForReceptionist(
            String keyword,
            LocalDate date,
            String status,
            Pageable pageable
    );
}
