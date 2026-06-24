package com.clinicmanagement.email;

import com.clinicmanagement.appointment.Appointment;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Async
    @Override
    public void sendBookingConfirmation(Appointment appointment) {
        if (!mailEnabled || appointment.getPatient() == null || appointment.getPatient().getUser() == null || appointment.getPatient().getUser().getEmail() == null) {
            log.info("Bỏ qua gửi email xác nhận đặt lịch. Mail enable = {}, Email = {}", mailEnabled, appointment.getPatient() != null && appointment.getPatient().getUser() != null ? appointment.getPatient().getUser().getEmail() : "null");
            return;
        }

        String to = appointment.getPatient().getUser().getEmail();
        String subject = "Xác nhận đặt lịch hẹn - Clinic Management";
        String content = "<div style=\"font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;\">"
                + "<div style=\"background-color: #0d9488; color: #ffffff; padding: 20px; text-align: center;\">"
                + "  <h2 style=\"margin: 0;\">Xác nhận đặt lịch khám thành công</h2>"
                + "</div>"
                + "<div style=\"padding: 20px; color: #333333;\">"
                + "  <p>Xin chào <strong>" + appointment.getPatient().getUser().getFullName() + "</strong>,</p>"
                + "  <p>Cảm ơn bạn đã tin tưởng và đặt lịch tại Clinic Management. Dưới đây là thông tin lịch hẹn của bệnh nhân <strong>" + appointment.getPatient().getFullName() + "</strong>:</p>"
                + "  <div style=\"background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;\">"
                + "    <p><strong>Mã lịch hẹn:</strong> <span style=\"color: #0d9488; font-weight: bold;\">" + appointment.getAppointmentCode() + "</span></p>"
                + "    <p><strong>Ngày khám:</strong> " + appointment.getAppointmentDate() + "</p>"
                + "    <p><strong>Giờ khám:</strong> " + appointment.getStartTime() + "</p>"
                + "    <p><strong>Bác sĩ:</strong> " + appointment.getDoctor().getUser().getFullName() + " - " + appointment.getDoctor().getSpecialization() + "</p>"
                + "    <p><strong>Chuyên khoa:</strong> " + appointment.getDepartment().getDepartmentName() + "</p>"
                + "  </div>"
                + "  <p>Vui lòng đến trước giờ khám khoảng 15 phút để hoàn tất các thủ tục check-in.</p>"
                + "  <p>Trân trọng,<br>Đội ngũ Clinic Management</p>"
                + "</div>"
                + "</div>";

        sendHtmlEmail(to, subject, content);
    }

    @Async
    @Override
    public void sendAppointmentReminder(Appointment appointment) {
        if (!mailEnabled || appointment.getPatient() == null || appointment.getPatient().getUser() == null || appointment.getPatient().getUser().getEmail() == null) {
            log.info("Bỏ qua gửi email nhắc nhở. Mail enable = {}, Email = {}", mailEnabled, appointment.getPatient() != null && appointment.getPatient().getUser() != null ? appointment.getPatient().getUser().getEmail() : "null");
            return;
        }

        String to = appointment.getPatient().getUser().getEmail();
        String subject = "Nhắc nhở: Lịch khám sắp tới - Clinic Management";
        String content = "<div style=\"font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;\">"
                + "<div style=\"background-color: #f59e0b; color: #ffffff; padding: 20px; text-align: center;\">"
                + "  <h2 style=\"margin: 0;\">Nhắc nhở lịch khám sắp tới</h2>"
                + "</div>"
                + "<div style=\"padding: 20px; color: #333333;\">"
                + "  <p>Xin chào <strong>" + appointment.getPatient().getUser().getFullName() + "</strong>,</p>"
                + "  <p>Đây là lời nhắc nhở tự động từ Clinic Management. Lịch khám của bệnh nhân <strong>" + appointment.getPatient().getFullName() + "</strong> sắp diễn ra.</p>"
                + "  <div style=\"background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;\">"
                + "    <p><strong>Mã lịch hẹn:</strong> <span style=\"color: #b45309; font-weight: bold;\">" + appointment.getAppointmentCode() + "</span></p>"
                + "    <p><strong>Ngày khám:</strong> " + appointment.getAppointmentDate() + "</p>"
                + "    <p><strong>Giờ khám:</strong> " + appointment.getStartTime() + "</p>"
                + "    <p><strong>Bác sĩ:</strong> " + appointment.getDoctor().getUser().getFullName() + " - " + appointment.getDoctor().getSpecialization() + "</p>"
                + "    <p><strong>Chuyên khoa:</strong> " + appointment.getDepartment().getDepartmentName() + "</p>"
                + "  </div>"
                + "  <p>Vui lòng đến đúng giờ để tránh ảnh hưởng đến thứ tự thăm khám.</p>"
                + "  <p>Trân trọng,<br>Đội ngũ Clinic Management</p>"
                + "</div>"
                + "</div>";

        sendHtmlEmail(to, subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String content) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            
            javaMailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
        }
    }
}
