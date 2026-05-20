package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.DoctorScheduleRequest;
import com.clinicmanagement.appointment.dto.DoctorScheduleResponse;
import com.clinicmanagement.appointment.dto.GenerateSlotsResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorScheduleServiceImpl implements DoctorScheduleService {

    private final DoctorScheduleRepository doctorScheduleRepository;
    private final TimeSlotRepository timeSlotRepository;

    public DoctorScheduleServiceImpl(DoctorScheduleRepository doctorScheduleRepository, TimeSlotRepository timeSlotRepository) {
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.timeSlotRepository = timeSlotRepository;
    }

    @Override
    @Transactional
    public DoctorScheduleResponse createSchedule(DoctorScheduleRequest request) {
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

        DoctorSchedule savedSchedule = doctorScheduleRepository.save(schedule);

        // Generate default 30-minute slots
        List<TimeSlot> timeSlots = new ArrayList<>();
        LocalTime currentSlotTime = request.startTime();

        while (currentSlotTime.plusMinutes(30).isBefore(request.endTime()) || 
               currentSlotTime.plusMinutes(30).equals(request.endTime())) {
            TimeSlot timeSlot = new TimeSlot();
            timeSlot.setDoctorSchedule(savedSchedule);
            timeSlot.setStartTime(currentSlotTime);
            timeSlot.setEndTime(currentSlotTime.plusMinutes(30));
            timeSlot.setStatus("AVAILABLE");
            timeSlots.add(timeSlot);

            currentSlotTime = currentSlotTime.plusMinutes(30);
        }

        timeSlotRepository.saveAll(timeSlots);

        return mapToResponse(savedSchedule);
    }

    @Override
    @Transactional
    public DoctorScheduleResponse updateSchedule(Long id, DoctorScheduleRequest request) {
        DoctorSchedule schedule = doctorScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor schedule not found with id: " + id));

        if ("CANCELLED".equals(schedule.getStatus())) {
            throw new BusinessException("Cannot update a cancelled schedule");
        }

        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException("Start time must be before end time");
        }

        List<DoctorSchedule> overlappingSchedules = doctorScheduleRepository.findActiveSchedulesByDoctorAndDateExcluding(
                request.doctorId(), request.workDate(), id);
        for (DoctorSchedule existing : overlappingSchedules) {
            if (request.startTime().isBefore(existing.getEndTime()) && request.endTime().isAfter(existing.getStartTime())) {
                throw new BusinessException("Doctor already has an overlapping schedule on this day");
            }
        }

        boolean timeOrDateChanged = !schedule.getWorkDate().equals(request.workDate()) ||
                                   !schedule.getStartTime().equals(request.startTime()) ||
                                   !schedule.getEndTime().equals(request.endTime());

        if (timeOrDateChanged) {
            boolean hasBookedSlots = timeSlotRepository.existsByScheduleIdAndStatus(id, "BOOKED");
            if (hasBookedSlots) {
                throw new BusinessException("Cannot change schedule date or time because there are already booked appointments");
            }
        }

        schedule.setDoctorId(request.doctorId());
        schedule.setWorkDate(request.workDate());
        schedule.setStartTime(request.startTime());
        schedule.setEndTime(request.endTime());
        schedule.setMaxPatients(request.maxPatients() != null ? request.maxPatients() : 20);

        DoctorSchedule savedSchedule = doctorScheduleRepository.save(schedule);

        if (timeOrDateChanged) {
            List<TimeSlot> existingSlots = timeSlotRepository.findByScheduleId(id);
            timeSlotRepository.deleteAll(existingSlots);

            // Generate default 30-minute slots
            List<TimeSlot> newSlots = new ArrayList<>();
            LocalTime currentSlotTime = request.startTime();

            while (currentSlotTime.plusMinutes(30).isBefore(request.endTime()) || 
                   currentSlotTime.plusMinutes(30).equals(request.endTime())) {
                TimeSlot timeSlot = new TimeSlot();
                timeSlot.setDoctorSchedule(savedSchedule);
                timeSlot.setStartTime(currentSlotTime);
                timeSlot.setEndTime(currentSlotTime.plusMinutes(30));
                timeSlot.setStatus("AVAILABLE");
                newSlots.add(timeSlot);

                currentSlotTime = currentSlotTime.plusMinutes(30);
            }
            timeSlotRepository.saveAll(newSlots);
        }

        return mapToResponse(savedSchedule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getSchedules(Long doctorId, LocalDate fromDate, LocalDate toDate, String status) {
        return doctorScheduleRepository.findAllSchedules(doctorId, fromDate, toDate, status)
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

        if ("CANCELLED".equals(schedule.getStatus())) {
            throw new BusinessException("Schedule is already cancelled");
        }

        schedule.setStatus("CANCELLED");
        DoctorSchedule savedSchedule = doctorScheduleRepository.save(schedule);

        List<TimeSlot> slots = timeSlotRepository.findByScheduleId(id);
        for (TimeSlot slot : slots) {
            slot.setStatus("CANCELLED");
        }
        timeSlotRepository.saveAll(slots);

        return mapToResponse(savedSchedule);
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

        List<TimeSlot> existingSlots = timeSlotRepository.findByScheduleId(id);
        timeSlotRepository.deleteAll(existingSlots);

        List<TimeSlot> newSlots = new ArrayList<>();
        LocalTime currentSlotTime = schedule.getStartTime();

        while (currentSlotTime.plusMinutes(slotDurationMinutes).isBefore(schedule.getEndTime()) || 
               currentSlotTime.plusMinutes(slotDurationMinutes).equals(schedule.getEndTime())) {
            TimeSlot timeSlot = new TimeSlot();
            timeSlot.setDoctorSchedule(schedule);
            timeSlot.setStartTime(currentSlotTime);
            timeSlot.setEndTime(currentSlotTime.plusMinutes(slotDurationMinutes));
            timeSlot.setStatus("AVAILABLE");
            newSlots.add(timeSlot);

            currentSlotTime = currentSlotTime.plusMinutes(slotDurationMinutes);
        }

        timeSlotRepository.saveAll(newSlots);

        return new GenerateSlotsResponse(id, newSlots.size());
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
}