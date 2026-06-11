package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.DoctorScheduleRequest;
import com.clinicmanagement.appointment.dto.DoctorScheduleResponse;
import com.clinicmanagement.appointment.dto.GenerateSlotsResponse;
import com.clinicmanagement.appointment.dto.TimeSlotResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.doctor.DoctorRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorScheduleServiceImpl implements DoctorScheduleService {

    private final DoctorScheduleRepository doctorScheduleRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final DoctorRepository doctorRepository;
    private final com.clinicmanagement.systemsetting.SystemSettingRepository systemSettingRepository;
    private final com.clinicmanagement.auditlog.AuditLogRepository auditLogRepository;
    private final com.clinicmanagement.user.UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public DoctorScheduleServiceImpl(
            DoctorScheduleRepository doctorScheduleRepository,
            TimeSlotRepository timeSlotRepository,
            DoctorRepository doctorRepository,
            com.clinicmanagement.systemsetting.SystemSettingRepository systemSettingRepository,
            com.clinicmanagement.auditlog.AuditLogRepository auditLogRepository,
            com.clinicmanagement.user.UserRepository userRepository
    ) {
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.doctorRepository = doctorRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    private int getSlotDurationMinutes(Integer requestedDuration) {
        if (requestedDuration != null && requestedDuration > 0) {
            return requestedDuration;
        }
        return systemSettingRepository.findBySettingKey("DEFAULT_SLOT_DURATION_MINUTES")
                .map(setting -> {
                    try {
                        return Integer.parseInt(setting.getSettingValue());
                    } catch (NumberFormatException e) {
                        return 30;
                    }
                })
                .orElse(30);
    }

    @Override
    @Transactional
    public DoctorScheduleResponse createSchedule(DoctorScheduleRequest request) {
        ensureDoctorExists(request.doctorId());

        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException("Start time must be before end time");
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        if (request.workDate().isBefore(today)) {
            throw new BusinessException("Cannot schedule for a past date");
        }
        if (request.workDate().equals(today) && request.startTime().isBefore(java.time.LocalTime.now())) {
            throw new BusinessException("Cannot schedule for a past time today");
        }

        List<DoctorSchedule> existingSchedules = doctorScheduleRepository.findActiveSchedulesByDoctorAndDate(request.doctorId(), request.workDate());
        for (DoctorSchedule existing : existingSchedules) {
            if (request.startTime().isBefore(existing.getEndTime()) && request.endTime().isAfter(existing.getStartTime())) {
                throw new BusinessException("Doctor already has an overlapping schedule on this day");
            }
        }

        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setDoctorId(request.doctorId());
        schedule.setWorkDate(request.workDate());
        schedule.setStartTime(request.startTime());
        schedule.setEndTime(request.endTime());
        schedule.setMaxPatients(request.maxPatients() != null ? request.maxPatients() : 20);
        schedule.setStatus("AVAILABLE");

        int slotDuration = getSlotDurationMinutes(request.slotDurationMinutes());

        LocalTime currentSlotTime = request.startTime();
        while (currentSlotTime.plusMinutes(slotDuration).isBefore(request.endTime()) ||
               currentSlotTime.plusMinutes(slotDuration).equals(request.endTime())) {
            TimeSlot timeSlot = new TimeSlot();
            timeSlot.setDoctorSchedule(schedule);
            timeSlot.setStartTime(currentSlotTime);
            timeSlot.setEndTime(currentSlotTime.plusMinutes(slotDuration));
            timeSlot.setStatus("AVAILABLE");
            schedule.getTimeSlots().add(timeSlot);
            currentSlotTime = currentSlotTime.plusMinutes(slotDuration);
        }

        DoctorSchedule savedSchedule = doctorScheduleRepository.save(schedule);
        return mapToResponse(savedSchedule);
    }

    @Override
    @Transactional
    public List<DoctorScheduleResponse> createBulkSchedules(com.clinicmanagement.appointment.dto.BulkScheduleRequest request) {
        ensureDoctorExists(request.doctorId());

        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException("Start time must be before end time");
        }
        if (request.fromDate().isAfter(request.toDate())) {
            throw new BusinessException("From date must be before or equal to To date");
        }

        List<DoctorScheduleResponse> responses = new java.util.ArrayList<>();
        int slotDuration = getSlotDurationMinutes(request.slotDurationMinutes());

        // 1. Validation phase: check for overlapping dates
        LocalDate validateDate = request.fromDate();
        List<LocalDate> overlappingDates = new java.util.ArrayList<>();
        while (!validateDate.isAfter(request.toDate())) {
            if (request.daysOfWeek().contains(validateDate.getDayOfWeek())) {
                boolean exists = doctorScheduleRepository.findActiveSchedulesByDoctorAndDate(request.doctorId(), validateDate)
                        .stream()
                        .anyMatch(s -> 
                            (request.startTime().isBefore(s.getEndTime()) && request.endTime().isAfter(s.getStartTime()))
                        );
                if (exists) {
                    overlappingDates.add(validateDate);
                }
            }
            validateDate = validateDate.plusDays(1);
        }

        if (!overlappingDates.isEmpty()) {
            String datesStr = overlappingDates.stream()
                .map(d -> d.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .collect(Collectors.joining(", "));
            throw new BusinessException("Trùng lặp lịch làm việc vào các ngày: " + datesStr + ". Vui lòng kiểm tra lại để tránh đè lịch.");
        }

        // 2. Creation phase
        LocalDate currentDate = request.fromDate();
        while (!currentDate.isAfter(request.toDate())) {
            if (request.daysOfWeek().contains(currentDate.getDayOfWeek())) {
                if (!currentDate.isBefore(LocalDate.now())) {
                    DoctorSchedule schedule = new DoctorSchedule();
                    schedule.setDoctorId(request.doctorId());
                    schedule.setWorkDate(currentDate);
                    schedule.setStartTime(request.startTime());
                    schedule.setEndTime(request.endTime());
                    schedule.setMaxPatients(request.maxPatients() != null ? request.maxPatients() : 20);
                    schedule.setStatus("AVAILABLE");

                    LocalTime currentSlotTime = request.startTime();
                    while (currentSlotTime.plusMinutes(slotDuration).isBefore(request.endTime()) ||
                           currentSlotTime.plusMinutes(slotDuration).equals(request.endTime())) {
                        TimeSlot timeSlot = new TimeSlot();
                        timeSlot.setDoctorSchedule(schedule);
                        timeSlot.setStartTime(currentSlotTime);
                        timeSlot.setEndTime(currentSlotTime.plusMinutes(slotDuration));
                        timeSlot.setStatus("AVAILABLE");
                        schedule.getTimeSlots().add(timeSlot);
                        currentSlotTime = currentSlotTime.plusMinutes(slotDuration);
                    }

                    DoctorSchedule savedSchedule = doctorScheduleRepository.save(schedule);
                    responses.add(mapToResponse(savedSchedule));
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        if (responses.isEmpty()) {
            throw new BusinessException("Không có lịch nào được tạo. Vui lòng kiểm tra lại (có thể bạn chọn ngày trong quá khứ).");
        }

        return responses;
    }

    @Override
    @Transactional
    public DoctorScheduleResponse updateSchedule(Long id, DoctorScheduleRequest request) {
        ensureDoctorExists(request.doctorId());

        DoctorSchedule schedule = doctorScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor schedule not found with id: " + id));

        if ("CANCELLED".equals(schedule.getStatus())) {
            throw new BusinessException("Cannot update a cancelled schedule");
        }
        
        java.time.LocalDate today = java.time.LocalDate.now();
        if (schedule.getWorkDate().isBefore(today) || 
           (schedule.getWorkDate().equals(today) && schedule.getStartTime().isBefore(java.time.LocalTime.now()))) {
            throw new BusinessException("Cannot update a schedule that has already started or passed");
        }

        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException("Start time must be before end time");
        }
        if (request.workDate().isBefore(today)) {
            throw new BusinessException("Cannot schedule for a past date");
        }
        if (request.workDate().equals(today) && request.startTime().isBefore(java.time.LocalTime.now())) {
            throw new BusinessException("Cannot schedule for a past time today");
        }

        boolean hasBookedSlots = timeSlotRepository.existsByScheduleIdAndStatus(id, "BOOKED");
        if (hasBookedSlots) {
            throw new BusinessException("Cannot update schedule because there are already booked appointments");
        }

        List<DoctorSchedule> overlappingSchedules = doctorScheduleRepository.findActiveSchedulesByDoctorAndDateExcluding(
                request.doctorId(), request.workDate(), id);
        for (DoctorSchedule existing : overlappingSchedules) {
            if (request.startTime().isBefore(existing.getEndTime()) && request.endTime().isAfter(existing.getStartTime())) {
                throw new BusinessException("Doctor already has an overlapping schedule on this day");
            }
        }

        timeSlotRepository.deleteAllByScheduleId(id);
        entityManager.flush();

        schedule.getTimeSlots().clear();
        schedule.setDoctorId(request.doctorId());
        schedule.setWorkDate(request.workDate());
        schedule.setStartTime(request.startTime());
        schedule.setEndTime(request.endTime());
        schedule.setMaxPatients(request.maxPatients() != null ? request.maxPatients() : 20);

        int slotDuration = getSlotDurationMinutes(request.slotDurationMinutes());

        LocalTime currentSlotTime = request.startTime();
        while (currentSlotTime.plusMinutes(slotDuration).isBefore(request.endTime()) ||
               currentSlotTime.plusMinutes(slotDuration).equals(request.endTime())) {
            TimeSlot timeSlot = new TimeSlot();
            timeSlot.setDoctorSchedule(schedule);
            timeSlot.setStartTime(currentSlotTime);
            timeSlot.setEndTime(currentSlotTime.plusMinutes(slotDuration));
            timeSlot.setStatus("AVAILABLE");
            schedule.getTimeSlots().add(timeSlot);
            currentSlotTime = currentSlotTime.plusMinutes(slotDuration);
        }

        DoctorSchedule savedSchedule = doctorScheduleRepository.save(schedule);
        return mapToResponse(savedSchedule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getSchedules(Long doctorId, LocalDate fromDate, LocalDate toDate, String status) {
        return findSchedules(doctorId, fromDate, toDate, status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorScheduleResponse getScheduleById(Long id) {
        DoctorSchedule schedule = doctorScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor schedule not found with id: " + id));
        return mapToResponse(schedule);
    }

    @Override
    @Transactional
    public DoctorScheduleResponse cancelSchedule(Long id, String reason) {
        DoctorSchedule schedule = doctorScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor schedule not found with id: " + id));

        boolean hasBookedSlots = timeSlotRepository.existsByScheduleIdAndStatus(id, "BOOKED");
        if (hasBookedSlots) {
            throw new BusinessException("Cannot cancel schedule because there are already booked appointments");
        }

        DoctorScheduleResponse response = new DoctorScheduleResponse(
                schedule.getId(),
                schedule.getDoctorId(),
                schedule.getWorkDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getMaxPatients(),
                "CANCELLED"
        );

        doctorScheduleRepository.delete(schedule);
        return response;
    }

    @Override
    @Transactional
    public GenerateSlotsResponse generateSlots(Long id, int slotDurationMinutes) {
        if (slotDurationMinutes <= 0) {
            throw new BusinessException("Slot duration must be greater than 0 minutes");
        }

        DoctorSchedule schedule = doctorScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor schedule not found with id: " + id));

        if ("CANCELLED".equals(schedule.getStatus())) {
            throw new BusinessException("Cannot generate slots for a cancelled schedule");
        }

        boolean hasBookedSlots = timeSlotRepository.existsByScheduleIdAndStatus(id, "BOOKED");
        if (hasBookedSlots) {
            throw new BusinessException("Cannot regenerate slots because there are already booked appointments");
        }

        schedule.getTimeSlots().clear();
        doctorScheduleRepository.save(schedule);

        LocalTime currentSlotTime = schedule.getStartTime();
        int slotCount = 0;
        while (currentSlotTime.plusMinutes(slotDurationMinutes).isBefore(schedule.getEndTime()) ||
               currentSlotTime.plusMinutes(slotDurationMinutes).equals(schedule.getEndTime())) {
            TimeSlot timeSlot = new TimeSlot();
            timeSlot.setDoctorSchedule(schedule);
            timeSlot.setStartTime(currentSlotTime);
            timeSlot.setEndTime(currentSlotTime.plusMinutes(slotDurationMinutes));
            timeSlot.setStatus("AVAILABLE");
            schedule.getTimeSlots().add(timeSlot);
            slotCount++;
            currentSlotTime = currentSlotTime.plusMinutes(slotDurationMinutes);
        }

        doctorScheduleRepository.save(schedule);
        return new GenerateSlotsResponse(id, slotCount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeSlotResponse> getSlotsByScheduleId(Long scheduleId) {
        doctorScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor schedule not found with id: " + scheduleId));
        return timeSlotRepository.findByDoctorScheduleId(scheduleId).stream()
                .map(ts -> new TimeSlotResponse(
                        ts.getId(),
                        scheduleId,
                        ts.getStartTime(),
                        ts.getEndTime(),
                        ts.getStatus()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<TimeSlotResponse> getAvailableSlots(Long doctorId, LocalDate workDate, boolean isPatient) {
        ensureDoctorExists(doctorId);

        List<TimeSlot> slots = timeSlotRepository.findAllSlotsByDoctorAndDate(doctorId, workDate);
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalTime currentTime = LocalTime.now();
        boolean isToday = workDate.equals(today);

        return slots.stream()
                .filter(ts -> !"CANCELLED".equals(ts.getStatus()))
                .filter(ts -> {
                    // For patient, filter out BLOCKED slots completely
                    if (isPatient && "BLOCKED".equals(ts.getStatus())) {
                        return false;
                    }
                    // For patient, filter out EXPIRED slots completely (where endTime has passed today)
                    if (isPatient && isToday && ts.getEndTime().isBefore(currentTime)) {
                        return false;
                    }
                    return true;
                })
                .map(ts -> {
                    String status = ts.getStatus();
                    
                    if ("LOCKED".equals(status) && ts.getLockedUntil() != null && ts.getLockedUntil().isBefore(now)) {
                        status = "AVAILABLE";
                    }

                    // For receptionist, map past AVAILABLE/LOCKED slots to EXPIRED for clear UI indication
                    if (!isPatient && isToday && ts.getEndTime().isBefore(currentTime)) {
                        if ("AVAILABLE".equals(status) || "LOCKED".equals(status)) {
                            status = "EXPIRED";
                        }
                    }

                    return new TimeSlotResponse(
                            ts.getId(),
                            ts.getDoctorSchedule().getId(),
                            ts.getStartTime(),
                            ts.getEndTime(),
                            status
                    );
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TimeSlotResponse blockSlot(Long slotId) {
        TimeSlot slot = timeSlotRepository.findByIdWithPessimisticLock(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám không tồn tại với id: " + slotId));

        if ("BLOCKED".equals(slot.getStatus())) {
            return mapSlotToResponse(slot);
        }
        if (!"AVAILABLE".equals(slot.getStatus())) {
            throw new BusinessException("Chỉ có thể khóa ca khám đang trống");
        }

        slot.setStatus("BLOCKED");
        slot.setLockedUntil(null);
        slot.setLockedByPatientId(null);
        
        TimeSlot savedSlot = timeSlotRepository.save(slot);
        logAudit("BLOCK_SLOT", "TimeSlot", slotId, "Khóa ca khám");
        return mapSlotToResponse(savedSlot);
    }

    @Override
    @Transactional
    public TimeSlotResponse unblockSlot(Long slotId) {
        TimeSlot slot = timeSlotRepository.findByIdWithPessimisticLock(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám không tồn tại với id: " + slotId));

        if ("AVAILABLE".equals(slot.getStatus())) {
            return mapSlotToResponse(slot);
        }
        if (!"BLOCKED".equals(slot.getStatus())) {
            throw new BusinessException("Chỉ có thể mở lại ca khám đã bị khóa");
        }

        slot.setStatus("AVAILABLE");
        slot.setLockedUntil(null);
        slot.setLockedByPatientId(null);
        
        TimeSlot savedSlot = timeSlotRepository.save(slot);
        logAudit("UNBLOCK_SLOT", "TimeSlot", slotId, "Mở lại ca khám");
        return mapSlotToResponse(savedSlot);
    }

    private void logAudit(String action, String tableName, Long recordId, String details) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        com.clinicmanagement.user.User user = null;
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof com.clinicmanagement.security.CustomUserDetails) {
            com.clinicmanagement.security.CustomUserDetails userDetails = (com.clinicmanagement.security.CustomUserDetails) auth.getPrincipal();
            user = userRepository.findById(userDetails.getUser().getUserId()).orElse(null);
        }

        com.clinicmanagement.auditlog.AuditLog log = new com.clinicmanagement.auditlog.AuditLog();
        log.setUser(user);
        log.setAction(action);
        log.setTableName(tableName);
        log.setRecordId(recordId);
        log.setNewValue("{\"details\": \"" + details + "\"}");
        auditLogRepository.save(log);
    }

    private TimeSlotResponse mapSlotToResponse(TimeSlot slot) {
        return new TimeSlotResponse(
                slot.getId(),
                slot.getDoctorSchedule().getId(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getStatus()
        );
    }

    private DoctorScheduleResponse mapToResponse(DoctorSchedule schedule) {
        return new DoctorScheduleResponse(
                schedule.getId(),
                schedule.getDoctorId(),
                schedule.getWorkDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getMaxPatients(),
                schedule.getStatus()
        );
    }

    private List<DoctorSchedule> findSchedules(Long doctorId, LocalDate fromDate, LocalDate toDate, String status) {
        Sort sort = Sort.by(Sort.Direction.ASC, "workDate", "startTime");
        String normalizedStatus = status == null || status.isBlank() ? null : status.trim();
        boolean hasDoctor = doctorId != null;
        boolean hasStatus = normalizedStatus != null;
        boolean hasDateRange = fromDate != null || toDate != null;

        if (!hasDateRange) {
            if (hasDoctor && hasStatus) {
                return doctorScheduleRepository.findByDoctorIdAndStatus(doctorId, normalizedStatus, sort);
            }
            if (hasDoctor) {
                return doctorScheduleRepository.findByDoctorId(doctorId, sort);
            }
            if (hasStatus) {
                return doctorScheduleRepository.findByStatus(normalizedStatus, sort);
            }
            return doctorScheduleRepository.findAll(sort);
        }

        LocalDate startDate = fromDate != null ? fromDate : LocalDate.of(1900, 1, 1);
        LocalDate endDate = toDate != null ? toDate : LocalDate.of(9999, 12, 31);
        if (startDate.isAfter(endDate)) {
            throw new BusinessException("From date must be before or equal to to date");
        }

        if (hasDoctor && hasStatus) {
            return doctorScheduleRepository.findByDoctorIdAndWorkDateBetweenAndStatus(
                    doctorId,
                    startDate,
                    endDate,
                    normalizedStatus,
                    sort
            );
        }
        if (hasDoctor) {
            return doctorScheduleRepository.findByDoctorIdAndWorkDateBetween(doctorId, startDate, endDate, sort);
        }
        if (hasStatus) {
            return doctorScheduleRepository.findByWorkDateBetweenAndStatus(startDate, endDate, normalizedStatus, sort);
        }
        return doctorScheduleRepository.findByWorkDateBetween(startDate, endDate, sort);
    }

    private void ensureDoctorExists(Long doctorId) {
        if (doctorId == null || !doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + doctorId);
        }
    }
}
