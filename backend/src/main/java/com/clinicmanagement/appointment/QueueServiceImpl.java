package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.QueueTicketResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QueueServiceImpl implements QueueService {

    private final QueueTicketRepository queueTicketRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationSessionRepository consultationSessionRepository;
    private final ApplicationContext applicationContext;

    @Override
    @Transactional(readOnly = true)
    public List<QueueTicketResponse> getQueue(LocalDate date, Long doctorId, String status) {
        LocalDate searchDate = date != null ? date : LocalDate.now();
        Specification<QueueTicket> spec = QueueTicketSpecifications.searchQueueTickets(searchDate, doctorId, status);
        return queueTicketRepository.findAll(spec).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public QueueTicketResponse callPatient(Long queueTicketId) {
        QueueTicket ticket = findOrThrow(queueTicketId);

        String status = ticket.getStatus();
        if ("COMPLETED".equals(status) || "DONE".equals(status)) {
            throw new BusinessException("Không thể gọi bệnh nhân đã hoàn thành khám.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Không thể gọi bệnh nhân đã hủy khám.");
        }

        ticket.setStatus("CALLED");
        ticket.setCalledAt(LocalDateTime.now());
        QueueTicket saved = queueTicketRepository.save(ticket);

        sendNotificationSafely(saved, "Lượt khám của bạn",
                "Bạn đã được gọi vào phòng khám của bác sĩ "
                        + getDoctorName(saved) + ". Số thứ tự: #" + saved.getQueueNumber() + ".");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public QueueTicketResponse skipPatient(Long queueTicketId) {
        QueueTicket ticket = findOrThrow(queueTicketId);

        String status = ticket.getStatus();
        if ("COMPLETED".equals(status) || "DONE".equals(status)) {
            throw new BusinessException("Không thể bỏ qua bệnh nhân đã hoàn thành khám.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Không thể bỏ qua bệnh nhân đã hủy khám.");
        }
        if ("SKIPPED".equals(status)) {
            throw new BusinessException("Bệnh nhân này đã được bỏ qua trước đó.");
        }

        ticket.setStatus("SKIPPED");
        return mapToResponse(queueTicketRepository.save(ticket));
    }

    @Override
    @Transactional
    public QueueTicketResponse completePatient(Long queueTicketId) {
        QueueTicket ticket = findOrThrow(queueTicketId);

        String status = ticket.getStatus();
        if ("COMPLETED".equals(status) || "DONE".equals(status)) {
            throw new BusinessException("Bệnh nhân này đã hoàn thành khám.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Không thể hoàn tất cho bệnh nhân đã hủy khám.");
        }

        ticket.setStatus("DONE");
        ticket.setCompletedAt(LocalDateTime.now());
        QueueTicket saved = queueTicketRepository.save(ticket);

        if (ticket.getAppointment() != null) {
            ticket.getAppointment().setStatus("COMPLETED");
            appointmentRepository.save(ticket.getAppointment());
        }

        sendNotificationSafely(saved, "Hoàn thành khám bệnh",
                "Ca khám của bạn với bác sĩ " + getDoctorName(saved) + " đã hoàn tất. Chúc bạn luôn mạnh khỏe!");

        return mapToResponse(saved);
    }

    // ── FIX: dùng from() thay vì constructor trực tiếp ───────────────────────
    private QueueTicketResponse mapToResponse(QueueTicket qt) {
        Long consultationId = null;
        if (qt.getAppointment() != null) {
            consultationId = consultationSessionRepository
                    .findByAppointmentId(qt.getAppointment().getAppointmentId())
                    .map(ConsultationSession::getConsultationId)
                    .orElse(null);
        }
        return QueueTicketResponse.from(qt, consultationId);
    }

    private QueueTicket findOrThrow(Long id) {
        return queueTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vé xếp hàng không tồn tại với ID: " + id));
    }

    private String getDoctorName(QueueTicket ticket) {
        if (ticket.getDoctor() != null && ticket.getDoctor().getUser() != null) {
            return ticket.getDoctor().getUser().getFullName();
        }
        return "Bác sĩ";
    }

    private void sendNotificationSafely(QueueTicket ticket, String title, String message) {
        try {
            if (ticket.getPatient() == null || ticket.getPatient().getUser() == null) return;
            // Dùng ApplicationContext để tránh hard dependency khi NotificationService chưa có
            var notificationService = applicationContext.getBean("notificationServiceImpl");
            notificationService.getClass()
                    .getMethod("createNotification", Long.class, String.class, String.class, String.class)
                    .invoke(notificationService, ticket.getPatient().getUser().getUserId(), title, message, "APPOINTMENT");
        } catch (Exception e) {
            System.err.println("Notification skipped: " + e.getMessage());
        }
    }
}
