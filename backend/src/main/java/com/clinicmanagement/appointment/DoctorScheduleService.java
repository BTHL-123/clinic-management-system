package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.DoctorScheduleRequest;
import com.clinicmanagement.appointment.dto.DoctorScheduleResponse;

import java.time.LocalDate;
import java.util.List;
import com.clinicmanagement.appointment.dto.GenerateSlotsResponse;

public interface DoctorScheduleService {
    DoctorScheduleResponse createSchedule(DoctorScheduleRequest request);
    DoctorScheduleResponse updateSchedule(Long id, DoctorScheduleRequest request);
    List<DoctorScheduleResponse> getSchedules(Long doctorId, LocalDate fromDate, LocalDate toDate, String status);
    DoctorScheduleResponse getScheduleById(Long id);
    DoctorScheduleResponse cancelSchedule(Long id, String reason);
    GenerateSlotsResponse generateSlots(Long id, int slotDurationMinutes);
}
