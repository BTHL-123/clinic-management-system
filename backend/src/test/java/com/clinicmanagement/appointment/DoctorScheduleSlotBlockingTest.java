package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.TimeSlotResponse;
import com.clinicmanagement.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DoctorScheduleSlotBlockingTest {

    @Autowired
    private DoctorScheduleService doctorScheduleService;

    @Autowired
    private DoctorScheduleRepository doctorScheduleRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Test
    void blockAndUnblockAvailableSlot() {
        TimeSlot slot = createSlot("AVAILABLE");

        TimeSlotResponse blocked = doctorScheduleService.blockSlot(slot.getId());
        assertEquals("BLOCKED", blocked.status());

        TimeSlotResponse available = doctorScheduleService.unblockSlot(slot.getId());
        assertEquals("AVAILABLE", available.status());
    }

    @Test
    void cannotBlockBookedSlot() {
        TimeSlot slot = createSlot("BOOKED");

        assertThrows(BusinessException.class, () -> doctorScheduleService.blockSlot(slot.getId()));
    }

    private TimeSlot createSlot(String status) {
        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setDoctorId(1L);
        schedule.setWorkDate(LocalDate.now().plusDays(30));
        schedule.setStartTime(LocalTime.of(8, 0));
        schedule.setEndTime(LocalTime.of(10, 0));
        schedule.setStatus("AVAILABLE");
        schedule = doctorScheduleRepository.save(schedule);

        TimeSlot slot = new TimeSlot();
        slot.setDoctorSchedule(schedule);
        slot.setStartTime(LocalTime.of(8, 30));
        slot.setEndTime(LocalTime.of(9, 0));
        slot.setStatus(status);
        return timeSlotRepository.save(slot);
    }
}
