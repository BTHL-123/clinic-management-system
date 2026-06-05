package com.clinicmanagement.appointment;

import com.clinicmanagement.common.event.PaymentCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentPaymentListener {

    private final AppointmentRepository appointmentRepository;

    @EventListener
    @Transactional
    public void handlePaymentCompletedEvent(PaymentCompletedEvent event) {
        if (event.getAppointmentId() != null) {
            log.info("Nhận sự kiện thanh toán hoàn tất cho Appointment ID: {}", event.getAppointmentId());
            appointmentRepository.findById(event.getAppointmentId()).ifPresent(appointment -> {
                if ("PENDING_PAYMENT".equalsIgnoreCase(appointment.getStatus())) {
                    appointment.setStatus("CONFIRMED");
                    appointmentRepository.save(appointment);
                    log.info("Cập nhật Appointment ID: {} thành CONFIRMED", appointment.getAppointmentId());
                }
            });
        }
    }
}
