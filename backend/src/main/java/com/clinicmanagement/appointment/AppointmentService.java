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

    AppointmentResponse getAppointmentById(Long id);

    PageResponse<AppointmentResponse> getMyAppointments(
            Long userId,
            boolean upcoming,
            Pageable pageable
    );

    AppointmentResponse bookAppointment(BookAppointmentRequest request, Long userId);
}
