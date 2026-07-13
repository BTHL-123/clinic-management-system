package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.SlotLockResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlotLockServiceImpl implements SlotLockService {

    private static final int LOCK_DURATION_MINUTES = 10;

    private final TimeSlotRepository timeSlotRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public SlotLockResponse lockSlot(Long slotId, Long patientUserId) {
        TimeSlot slot = timeSlotRepository.findByIdWithPessimisticLock(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám không tồn tại với id: " + slotId));

        Patient patient = patientRepository.findByUserUserId(patientUserId)
                .orElseGet(() -> {
                    User user = userRepository.findById(patientUserId)
                            .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với id: " + patientUserId));
                    Patient p = new Patient();
                    p.setUser(user);
                    p.setPatientCode("PAT" + System.currentTimeMillis());
                    p.setFullName(user.getFullName());
                    p.setEmail(user.getEmail());
                    p.setPhone(user.getPhone() != null ? user.getPhone() : "0900000000");
                    p.setGender("OTHER");
                    return patientRepository.save(p);
                });

        if ("LOCKED".equals(slot.getStatus())) {
            if (slot.getLockedUntil() != null && slot.getLockedUntil().isAfter(LocalDateTime.now())) {
                throw new BusinessException("Ca khám này đã được người khác giữ chỗ. Vui lòng chọn ca khác.");
            }
        }

        if ("BOOKED".equals(slot.getStatus())) {
            throw new BusinessException("Ca khám này đã được đặt. Vui lòng chọn ca khác.");
        }

        if (!"AVAILABLE".equals(slot.getStatus())) {
            throw new BusinessException("Ca khám không còn trống. Vui lòng chọn ca khác.");
        }

        LocalDateTime expiry = LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES);
        slot.setStatus("LOCKED");
        slot.setLockedUntil(expiry);
        slot.setLockedByPatientId(patient.getPatientId());
        timeSlotRepository.save(slot);

        return new SlotLockResponse(
                slot.getId(),
                slot.getDoctorSchedule().getId(),
                slot.getStartTime().toString(),
                slot.getEndTime().toString(),
                expiry,
                patient.getPatientId()
        );
    }

    @Override
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void releaseExpiredLocks() {
        List<TimeSlot> expired = timeSlotRepository.findExpiredLocks(LocalDateTime.now());
        if (expired.isEmpty()) {
            return;
        }
        for (TimeSlot slot : expired) {
            if (appointmentRepository.findActiveByTimeSlotId(slot.getId()).isPresent()) {
                continue;
            }
            slot.setStatus("AVAILABLE");
            slot.setLockedUntil(null);
            slot.setLockedByPatientId(null);
        }
        timeSlotRepository.saveAll(expired);
        log.info("Released {} expired slot lock(s)", expired.size());
    }

    @Override
    @Transactional
    public void releaseLock(Long slotId, Long patientUserId) {
        TimeSlot slot = timeSlotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám không tồn tại với id: " + slotId));
        Patient patient = patientRepository.findByUserUserId(patientUserId)
                .orElseGet(() -> {
                    User user = userRepository.findById(patientUserId)
                            .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với id: " + patientUserId));
                    Patient p = new Patient();
                    p.setUser(user);
                    p.setPatientCode("PAT" + System.currentTimeMillis());
                    p.setFullName(user.getFullName());
                    p.setEmail(user.getEmail());
                    p.setPhone(user.getPhone() != null ? user.getPhone() : "0900000000");
                    p.setGender("OTHER");
                    return patientRepository.save(p);
                });
        if ("LOCKED".equals(slot.getStatus()) && patient.getPatientId().equals(slot.getLockedByPatientId())) {
            slot.setStatus("AVAILABLE");
            slot.setLockedUntil(null);
            slot.setLockedByPatientId(null);
            timeSlotRepository.save(slot);
        }
    }
}
