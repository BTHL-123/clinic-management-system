package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.WalkInAppointmentRequest;
import com.clinicmanagement.appointment.dto.WalkInAppointmentResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalkInAppointmentServiceImpl implements WalkInAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final QueueTicketRepository queueTicketRepository;

    @Override
    @Transactional
    public WalkInAppointmentResponse createWalkIn(WalkInAppointmentRequest request, Long createdByUserId) {

        // ── 1. Validate appointment date is not in the past ──────────────────
        if (request.appointmentDate().isBefore(LocalDate.now())) {
            throw new BusinessException("Ngày khám không được là ngày trong quá khứ.");
        }

        // ── 2. Validate doctor exists and is active ───────────────────────────
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy bác sĩ với ID: " + request.doctorId()));
        if (!"ACTIVE".equals(doctor.getStatus())) {
            throw new BusinessException("Bác sĩ hiện không hoạt động. Vui lòng chọn bác sĩ khác.");
        }

        // ── 3. Acquire slot with pessimistic lock to prevent race condition ────
        TimeSlot slot = timeSlotRepository.findByIdWithPessimisticLock(request.slotId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy ca khám với ID: " + request.slotId()));

        // ── 3.5. Expired slot protection ──────────────────────────────────────
        LocalDate workDate = slot.getDoctorSchedule().getWorkDate();
        LocalDate today = LocalDate.now();
        if (workDate.isBefore(today) || (workDate.equals(today) && slot.getEndTime().isBefore(LocalTime.now()))) {
            throw new BusinessException("Ca khám này đã qua thời gian, không thể đặt.");
        }

        // ── 4. Validate the slot belongs to the correct doctor and date ────────
        DoctorSchedule schedule = slot.getDoctorSchedule();
        if (!schedule.getDoctorId().equals(request.doctorId())) {
            throw new BusinessException("Ca khám này không thuộc về bác sĩ đã chọn.");
        }
        if (!schedule.getWorkDate().equals(request.appointmentDate())) {
            throw new BusinessException("Ca khám này không thuộc ngày khám đã chọn.");
        }

        // ── 5. Validate slot is available ─────────────────────────────────────
        String slotStatus = slot.getStatus();
        if ("BOOKED".equals(slotStatus)) {
            throw new BusinessException("Ca khám này đã được đặt. Vui lòng chọn ca khác.");
        }
        if ("LOCKED".equals(slotStatus)) {
            boolean lockStillValid = slot.getLockedUntil() != null
                    && LocalDateTime.now().isBefore(slot.getLockedUntil());
            if (lockStillValid) {
                throw new BusinessException("Ca khám này đang được người khác giữ chỗ trực tuyến. Vui lòng chọn ca khác.");
            }
            // Lock đã hết hạn — receptionist có thể override
        }
        if ("CANCELLED".equals(slotStatus)) {
            throw new BusinessException("Ca khám này đã bị hủy.");
        }
        if ("BLOCKED".equals(slotStatus)) {
            throw new BusinessException("Ca khám này đang tạm đóng.");
        }

        // ── 6. Extra duplicate guard at appointment level ─────────────────────
        boolean duplicateExists = appointmentRepository.existsActiveAppointmentForSlot(
                request.doctorId(),
                request.appointmentDate(),
                slot.getStartTime(),
                slot.getEndTime()
        );
        if (duplicateExists) {
            throw new BusinessException("Đã tồn tại lịch hẹn cho ca khám này. Vui lòng chọn ca khác.");
        }

        // ── 7. Find or create patient by phone ────────────────────────────────
        Patient patient = findOrCreatePatient(request);

        // ── 7.5. Validate patient overlap ─────────────────────────────────────
        boolean hasOverlap = appointmentRepository.existsOverlappingAppointmentForPatient(
                patient.getPatientId(),
                request.appointmentDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                null
        );
        if (hasOverlap) {
            throw new BusinessException("Bệnh nhân đã có một lịch hẹn khác trong khoảng thời gian này. Vui lòng chọn ca khám khác.");
        }

        // ── 8. Mark slot as BOOKED ────────────────────────────────────────────
        slot.setStatus("BOOKED");
        slot.setLockedUntil(null);
        slot.setLockedByPatientId(null);
        timeSlotRepository.save(slot);

        // ── 9. Create the appointment ─────────────────────────────────────────
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setDepartment(doctor.getDepartment());
        appointment.setTimeSlot(slot);
        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setStartTime(slot.getStartTime());
        appointment.setEndTime(slot.getEndTime());
        appointment.setBookingType("WALK_IN");
        appointment.setReasonForVisit(request.reasonForVisit());
        appointment.setInitialSymptoms(request.initialSymptoms());
        appointment.setStatus("CONFIRMED");
        appointment.setDepositAmount(
                doctor.getConsultationFee() != null ? doctor.getConsultationFee() : java.math.BigDecimal.ZERO
        );
        appointment.setCreatedBy(createdByUserId);
        appointment.setAppointmentCode("WI-" + System.currentTimeMillis());

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // ── 10. Generate queue ticket ─────────────────────────────────────────
        int nextQueueNumber = queueTicketRepository.findMaxQueueNumberByDoctorAndDate(
                request.doctorId(), request.appointmentDate()
        ) + 1;

        QueueTicket ticket = new QueueTicket();
        ticket.setAppointment(savedAppointment);
        ticket.setPatient(patient);
        ticket.setDoctor(doctor);
        ticket.setDepartment(doctor.getDepartment());
        ticket.setQueueDate(request.appointmentDate());
        ticket.setQueueNumber(nextQueueNumber);
        ticket.setPriorityLevel("NORMAL");
        ticket.setStatus("WAITING");
        queueTicketRepository.save(ticket);

        log.info("Walk-in appointment created: appointmentId={}, patient={}, doctor={}, queueNumber={}",
                savedAppointment.getAppointmentId(), patient.getFullName(),
                doctor.getDoctorCode(), nextQueueNumber);

        return mapToResponse(savedAppointment, patient, doctor, nextQueueNumber);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Patient findOrCreatePatient(WalkInAppointmentRequest request) {
        // Reuse existing patient by phone if found — no duplicate creation
        return patientRepository.findTopByPhone(request.phone().trim())
                .orElseGet(() -> createWalkInPatient(request));
    }

    private Patient createWalkInPatient(WalkInAppointmentRequest request) {
        Patient patient = new Patient();
        patient.setPatientCode("WI-" + System.currentTimeMillis());
        patient.setFullName(request.fullName().trim());
        patient.setPhone(request.phone().trim());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender() != null ? request.gender() : "OTHER");
        return patientRepository.save(patient);
    }

    private WalkInAppointmentResponse mapToResponse(Appointment app, Patient patient, Doctor doctor, int queueNumber) {
        return new WalkInAppointmentResponse(
                app.getAppointmentId(),
                app.getAppointmentCode(),
                patient.getPatientId(),
                patient.getFullName(),
                patient.getPhone(),
                doctor.getDoctorId(),
                doctor.getUser() != null ? doctor.getUser().getFullName() : doctor.getDoctorCode(),
                doctor.getSpecialization(),
                doctor.getDepartment() != null ? doctor.getDepartment().getDepartmentId() : null,
                doctor.getDepartment() != null ? doctor.getDepartment().getDepartmentName() : null,
                app.getTimeSlot() != null ? app.getTimeSlot().getId() : null,
                app.getAppointmentDate(),
                app.getStartTime(),
                app.getEndTime(),
                app.getBookingType(),
                app.getReasonForVisit(),
                app.getInitialSymptoms(),
                app.getStatus(),
                app.getDepositAmount(),
                queueNumber
        );
    }
}
