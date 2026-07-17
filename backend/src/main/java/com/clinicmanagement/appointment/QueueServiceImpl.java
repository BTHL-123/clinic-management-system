package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.PatientQueueStatusResponse;
import com.clinicmanagement.appointment.dto.QueueTicketResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private final PatientRepository patientRepository;
    private final SimpMessagingTemplate messagingTemplate;

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

        broadcastQueueUpdate();

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
        QueueTicket saved = queueTicketRepository.save(ticket);
        
        broadcastQueueUpdate();
        
        return mapToResponse(saved);
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

        broadcastQueueUpdate();

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

    private void broadcastQueueUpdate() {
        try {
            messagingTemplate.convertAndSend("/topic/queue", "QUEUE_UPDATED");
        } catch (Exception e) {
            System.err.println("WebSocket broadcast failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PatientQueueStatusResponse getPatientQueueStatus(Long userId) {
        // 1. Find patient record for logged-in user
        Patient patient = patientRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh nhân."));

        // 2. Find ALL active tickets for today — ordered: CALLED first, then lowest queueNumber
        LocalDate today = LocalDate.now();
        List<QueueTicket> activeTickets = queueTicketRepository
                .findActiveTicketsByPatientAndDate(patient.getPatientId(), today);

        if (activeTickets.isEmpty()) {
            throw new BusinessException("No active queue found");
        }

        // 3. Priority selection in Java (JPQL does not support CASE in ORDER BY):
        //    a) Prefer CALLED ticket first
        //    b) Otherwise pick earliest WAITING (lowest queueNumber, already sorted by DB)
        QueueTicket ticket = activeTickets.stream()
                .filter(t -> "CALLED".equals(t.getStatus()))
                .findFirst()
                .orElse(activeTickets.get(0));

        int myQueueNumber = ticket.getQueueNumber();
        Long doctorId = ticket.getDoctor().getDoctorId();

        // 4. Find current serving number (smallest CALLED queue number for this doctor today)
        int currentServingNumber = queueTicketRepository.findCurrentServingNumber(doctorId, today);

        // 5. Count patients ahead (WAITING with smaller queue number)
        int patientsAhead = queueTicketRepository.countPatientsAhead(doctorId, today, myQueueNumber);

        // 6. Estimate waiting time: 30 min per patient ahead
        final int AVG_CONSULTATION_MINUTES = 30;
        int estimatedWaitMinutes = patientsAhead * AVG_CONSULTATION_MINUTES;

        // 7. Build DTO
        String patientName = patient.getFullName();
        String doctorName = ticket.getDoctor() != null && ticket.getDoctor().getUser() != null
                ? ticket.getDoctor().getUser().getFullName() : "Bác sĩ";
        String appointmentCode = ticket.getAppointment() != null
                ? ticket.getAppointment().getAppointmentCode() : null;

        return new PatientQueueStatusResponse(
                patientName,
                doctorName,
                appointmentCode,
                myQueueNumber,
                currentServingNumber,
                patientsAhead,
                estimatedWaitMinutes,
                ticket.getStatus()
        );
    }
}
