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

    @PersistenceContext
    private EntityManager entityManager;

    public DoctorScheduleServiceImpl(
            DoctorScheduleRepository doctorScheduleRepository,
            TimeSlotRepository timeSlotRepository,
            DoctorRepository doctorRepository
    ) {
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.doctorRepository = doctorRepository;
    }

    @Override
    @Transactional
    public DoctorScheduleResponse createSchedule(DoctorScheduleRequest request) {
        ensureDoctorExists(request.doctorId());

        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException("Start time must be before end time");
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

        LocalTime currentSlotTime = request.startTime();
        while (currentSlotTime.plusMinutes(30).isBefore(request.endTime()) ||
               currentSlotTime.plusMinutes(30).equals(request.endTime())) {
            TimeSlot timeSlot = new TimeSlot();
            timeSlot.setDoctorSchedule(schedule);
            timeSlot.setStartTime(currentSlotTime);
            timeSlot.setEndTime(currentSlotTime.plusMinutes(30));
            timeSlot.setStatus("AVAILABLE");
            schedule.getTimeSlots().add(timeSlot);
            currentSlotTime = currentSlotTime.plusMinutes(30);
        }

        DoctorSchedule savedSchedule = doctorScheduleRepository.save(schedule);
        return mapToResponse(savedSchedule);
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

        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException("Start time must be before end time");
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

        LocalTime currentSlotTime = request.startTime();
        while (currentSlotTime.plusMinutes(30).isBefore(request.endTime()) ||
               currentSlotTime.plusMinutes(30).equals(request.endTime())) {
            TimeSlot timeSlot = new TimeSlot();
            timeSlot.setDoctorSchedule(schedule);
            timeSlot.setStartTime(currentSlotTime);
            timeSlot.setEndTime(currentSlotTime.plusMinutes(30));
            timeSlot.setStatus("AVAILABLE");
            schedule.getTimeSlots().add(timeSlot);
            currentSlotTime = currentSlotTime.plusMinutes(30);
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
    public List<TimeSlotResponse> getAvailableSlots(Long doctorId, LocalDate workDate) {
        ensureDoctorExists(doctorId);

        List<TimeSlot> slots = timeSlotRepository.findAllSlotsByDoctorAndDate(doctorId, workDate);
        LocalDateTime now = LocalDateTime.now();
        return slots.stream()
                .filter(ts -> !"CANCELLED".equals(ts.getStatus()))
                .map(ts -> {
                    String status = ts.getStatus();
                    if ("LOCKED".equals(status) && ts.getLockedUntil() != null && ts.getLockedUntil().isBefore(now)) {
                        status = "AVAILABLE";
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
