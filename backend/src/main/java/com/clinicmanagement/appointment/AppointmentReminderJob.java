package com.clinicmanagement.appointment;

import com.clinicmanagement.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentReminderJob {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    // Chạy mỗi phút (60000 ms)
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void sendReminders() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        // Lấy danh sách khám trong vòng 2 tiếng tới
        LocalTime twoHoursLater = now.plusHours(2);

        List<Appointment> upcomingAppointments = appointmentRepository.findAppointmentsForReminder(
                today,
                now,
                twoHoursLater
        );

        if (!upcomingAppointments.isEmpty()) {
            log.info("Found {} appointments needing reminders.", upcomingAppointments.size());
            for (Appointment app : upcomingAppointments) {
                try {
                    emailService.sendAppointmentReminder(app);
                    app.setReminderSent(true);
                    appointmentRepository.save(app);
                } catch (Exception e) {
                    log.error("Lỗi khi gửi thư nhắc nhở cho mã lịch hẹn {}", app.getAppointmentCode(), e);
                }
            }
        }
    }
}
