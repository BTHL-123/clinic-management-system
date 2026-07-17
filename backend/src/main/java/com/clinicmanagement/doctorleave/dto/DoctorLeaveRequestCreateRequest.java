package com.clinicmanagement.doctorleave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record DoctorLeaveRequestCreateRequest(

        @NotNull(message = "Loại yêu cầu không được để trống")
        String requestType,

        @NotNull(message = "Ngày nghỉ không được để trống")
        LocalDate leaveDate,

        @NotNull(message = "Giờ bắt đầu không được để trống")
        LocalTime startTime,

        @NotNull(message = "Giờ kết thúc không được để trống")
        LocalTime endTime,

        @NotBlank(message = "Lý do không được để trống")
        String reason
) {}
