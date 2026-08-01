package com.clinicmanagement.appointment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.clinicmanagement.appointment.dto.WalkInAppointmentRequest;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.payment.PaymentPolicyService;
import com.clinicmanagement.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PastTimeSlotProtectionTest {

    @Test
    void walkInCannotBookSlotThatHasAlreadyStarted() {
        AppointmentRepository appointmentRepository = mock(AppointmentRepository.class);
        TimeSlotRepository timeSlotRepository = mock(TimeSlotRepository.class);
        DoctorRepository doctorRepository = mock(DoctorRepository.class);
        WalkInAppointmentServiceImpl service = new WalkInAppointmentServiceImpl(
                appointmentRepository,
                timeSlotRepository,
                mock(PatientRepository.class),
                doctorRepository,
                mock(QueueTicketRepository.class)
        );

        Doctor doctor = new Doctor();
        doctor.setDoctorId(7L);
        doctor.setStatus("ACTIVE");
        TimeSlot slot = slotAt(LocalDate.now(), LocalTime.now().minusMinutes(1));

        when(doctorRepository.findById(7L)).thenReturn(Optional.of(doctor));
        when(timeSlotRepository.findByIdWithPessimisticLock(11L)).thenReturn(Optional.of(slot));

        WalkInAppointmentRequest request = new WalkInAppointmentRequest(
                "Nguyen Van A",
                "0901234567",
                null,
                "MALE",
                7L,
                LocalDate.now(),
                11L,
                null,
                null
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.createWalkIn(request, 1L)
        );
        assertEquals("Ca khám này đã qua thời gian, không thể đặt.", exception.getMessage());
    }

    @Test
    void scheduledMaintenanceCancelsUnusedPastSlots() {
        TimeSlotRepository timeSlotRepository = mock(TimeSlotRepository.class);
        SlotLockServiceImpl service = new SlotLockServiceImpl(
                timeSlotRepository,
                mock(PatientRepository.class),
                mock(UserRepository.class),
                mock(AppointmentRepository.class),
                mock(PaymentPolicyService.class)
        );
        TimeSlot pastSlot = slotAt(LocalDate.now().minusDays(1), LocalTime.NOON);
        pastSlot.setStatus("AVAILABLE");
        pastSlot.setLockedUntil(LocalDateTime.now().minusMinutes(5));
        pastSlot.setLockedByPatientId(25L);

        when(timeSlotRepository.findPastUnusedSlots(any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(List.of(pastSlot));

        service.expirePastUnusedSlots();

        assertEquals("CANCELLED", pastSlot.getStatus());
        assertNull(pastSlot.getLockedUntil());
        assertNull(pastSlot.getLockedByPatientId());
        verify(timeSlotRepository).saveAll(List.of(pastSlot));
    }

    private TimeSlot slotAt(LocalDate date, LocalTime startTime) {
        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setDoctorId(7L);
        schedule.setWorkDate(date);

        TimeSlot slot = new TimeSlot();
        slot.setId(11L);
        slot.setDoctorSchedule(schedule);
        slot.setStartTime(startTime);
        slot.setEndTime(startTime.plusMinutes(30));
        slot.setStatus("AVAILABLE");
        return slot;
    }
}
