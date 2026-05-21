package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.appointment.dto.CreateAppointmentRequest;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request, Long actorUserId) {
        TimeSlot slot = timeSlotRepository.findById(request.slotId())
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám không tồn tại với id: " + request.slotId()));

        if (!"LOCKED".equals(slot.getStatus())) {
            throw new BusinessException("Ca khám này chưa được giữ chỗ hoặc không thể đặt lịch.");
        }

        if (slot.getLockedUntil() != null && slot.getLockedUntil().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Phiên giữ chỗ của ca khám này đã hết hạn.");
        }

        Patient patient = null;
        if (request.phone() != null && !request.phone().isBlank()) {
            patient = patientRepository.findByPhone(request.phone()).orElse(null);
        }
        if (patient == null && request.email() != null && !request.email().isBlank()) {
            patient = patientRepository.findByEmail(request.email()).orElse(null);
        }

        if (patient == null) {
            patient = new Patient();
            Long nextId = patientRepository.findTopByOrderByPatientIdDesc()
                    .map(p -> p.getPatientId() + 1)
                    .orElse(1L);
            patient.setPatientCode("PAT%06d".formatted(nextId));
            patient.setFullName(request.fullName());
            patient.setPhone(request.phone());
            patient.setEmail(request.email());
            patient.setGender(request.gender() != null ? request.gender().toUpperCase() : "OTHER");
            patient.setDateOfBirth(request.dateOfBirth());
            patient = patientRepository.save(patient);
        }

        Doctor doctor = doctorRepository.findById(slot.getDoctorSchedule().getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Bác sĩ không tồn tại."));

        Department department = departmentRepository.findById(doctor.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Khoa khám không tồn tại."));

        Long nextApptId = appointmentRepository.findTopByOrderByIdDesc()
                .map(appt -> appt.getId() + 1)
                .orElse(1L);
        String appointmentCode = "APT%06d".formatted(nextApptId);

        Appointment appointment = new Appointment();
        appointment.setAppointmentCode(appointmentCode);
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setDepartment(department);
        appointment.setTimeSlot(slot);
        appointment.setAppointmentDate(slot.getDoctorSchedule().getWorkDate());
        appointment.setStartTime(slot.getStartTime());
        appointment.setEndTime(slot.getEndTime());
        appointment.setBookingType(request.bookingType() != null ? request.bookingType().toUpperCase() : "ONLINE");
        appointment.setReasonForVisit(request.reasonForVisit());
        appointment.setStatus("CONFIRMED");
        appointment.setDepositAmount(BigDecimal.ZERO);
        appointment.setCreatedBy(actorUserId);

        appointment = appointmentRepository.save(appointment);

        slot.setStatus("BOOKED");
        slot.setLockedUntil(null);
        slot.setLockedByPatientId(null);
        timeSlotRepository.save(slot);

        return new AppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentCode(),
                patient.getPatientId(),
                patient.getFullName(),
                doctor.getDoctorId(),
                department.getDepartmentId(),
                slot.getId(),
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getBookingType(),
                appointment.getReasonForVisit(),
                appointment.getStatus(),
                appointment.getDepositAmount()
        );
    }
}
