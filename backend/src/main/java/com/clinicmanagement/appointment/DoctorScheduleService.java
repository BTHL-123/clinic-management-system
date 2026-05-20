package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.DoctorScheduleRequest;
import com.clinicmanagement.appointment.dto.DoctorScheduleResponse;
import com.clinicmanagement.appointment.dto.GenerateSlotsResponse;
import com.clinicmanagement.appointment.dto.TimeSlotResponse;

import java.time.LocalDate;
import java.util.List;

public interface DoctorScheduleService {
    DoctorScheduleResponse createSchedule(DoctorScheduleRequest request);
    DoctorScheduleResponse updateSchedule(Long id, DoctorScheduleRequest request);
    List<DoctorScheduleResponse> getSchedules(Long doctorId, LocalDate fromDate, LocalDate toDate, String status);
    DoctorScheduleResponse getScheduleById(Long id);
    DoctorScheduleResponse cancelSchedule(Long id, String reason);
    GenerateSlotsResponse generateSlots(Long id, int slotDurationMinutes);
    List<TimeSlotResponse> getSlotsByScheduleId(Long scheduleId);
    List<TimeSlotResponse> getAvailableSlots(Long doctorId, LocalDate workDate);
}
