package com.clinicmanagement.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record WalkInAppointmentRequest(

        @NotBlank(message = "Họ tên bệnh nhân không được để trống")
        @Size(max = 150, message = "Họ tên không được vượt quá 150 ký tự")
        String fullName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^(0|\\+84)[0-9]{8,10}$", message = "Số điện thoại không hợp lệ")
        String phone,

        LocalDate dateOfBirth,

        @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Giới tính phải là MALE, FEMALE hoặc OTHER")
        String gender,

        @NotNull(message = "ID bác sĩ không được để trống")
        Long doctorId,

        @NotNull(message = "Ngày khám không được để trống")
        LocalDate appointmentDate,

        @NotNull(message = "ID ca khám không được để trống")
        Long slotId,

        String reasonForVisit,

        String initialSymptoms
) {}
