package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.appointment.dto.RescheduleAppointmentRequest;
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

    AppointmentResponse getAppointmentById(Long id, Long currentUserId, boolean isPatientOrDoctor);

    AppointmentResponse getAppointmentBySlotId(Long slotId, Long userId, boolean isPrivileged);

    PageResponse<AppointmentResponse> getMyAppointments(
            Long userId,
            String keyword,
            Long doctorId,
            Long departmentId,
            Boolean upcoming,
            Pageable pageable
    );

    AppointmentResponse bookAppointment(BookAppointmentRequest request, Long userId);

    AppointmentResponse cancelAppointment(Long appointmentId, String cancellationReason, Long currentUserId, boolean isReceptionist);

    AppointmentResponse rescheduleAppointment(
            Long appointmentId,
            RescheduleAppointmentRequest request,
            Long currentUserId,
            boolean isPrivileged
    );

    AppointmentResponse checkInAppointment(Long appointmentId, Long receptionistId);

    PageResponse<AppointmentResponse> searchAppointmentsForReceptionist(
            String keyword,
            LocalDate date,
            String status,
            Pageable pageable
    );

    java.util.List<AppointmentResponse> getDoctorTodayAppointments(Long userId);

    AppointmentResponse markNoShow(Long appointmentId, String note, Long receptionistId);
}
