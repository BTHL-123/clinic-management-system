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
            throw new BusinessException("Kh├┤ng thß╗â gß╗ìi bß╗çnh nh├ón ─æ├ú ho├án th├ánh kh├ím.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Kh├┤ng thß╗â gß╗ìi bß╗çnh nh├ón ─æ├ú hß╗ºy kh├ím.");
        }

        ticket.setStatus("CALLED");
        ticket.setCalledAt(LocalDateTime.now());
        QueueTicket saved = queueTicketRepository.save(ticket);

        sendNotificationSafely(saved, "L╞░ß╗út kh├ím cß╗ºa bß║ín",
                "Bß║ín ─æ├ú ─æ╞░ß╗úc gß╗ìi v├áo ph├▓ng kh├ím cß╗ºa b├íc s─⌐ "
                        + getDoctorName(saved) + ". Sß╗æ thß╗⌐ tß╗▒: #" + saved.getQueueNumber() + ".");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public QueueTicketResponse skipPatient(Long queueTicketId) {
        QueueTicket ticket = findOrThrow(queueTicketId);

        String status = ticket.getStatus();
        if ("COMPLETED".equals(status) || "DONE".equals(status)) {
            throw new BusinessException("Kh├┤ng thß╗â bß╗Å qua bß╗çnh nh├ón ─æ├ú ho├án th├ánh kh├ím.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Kh├┤ng thß╗â bß╗Å qua bß╗çnh nh├ón ─æ├ú hß╗ºy kh├ím.");
        }
        if ("SKIPPED".equals(status)) {
            throw new BusinessException("Bß╗çnh nh├ón n├áy ─æ├ú ─æ╞░ß╗úc bß╗Å qua tr╞░ß╗¢c ─æ├│.");
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
            throw new BusinessException("Bß╗çnh nh├ón n├áy ─æ├ú ho├án th├ánh kh├ím.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Kh├┤ng thß╗â ho├án tß║Ñt cho bß╗çnh nh├ón ─æ├ú hß╗ºy kh├ím.");
        }

        ticket.setStatus("DONE");
        ticket.setCompletedAt(LocalDateTime.now());
        QueueTicket saved = queueTicketRepository.save(ticket);

        if (ticket.getAppointment() != null) {
            ticket.getAppointment().setStatus("COMPLETED");
            appointmentRepository.save(ticket.getAppointment());
        }

        sendNotificationSafely(saved, "Ho├án th├ánh kh├ím bß╗çnh",
                "Ca kh├ím cß╗ºa bß║ín vß╗¢i b├íc s─⌐ " + getDoctorName(saved) + " ─æ├ú ho├án tß║Ñt. Ch├║c bß║ín lu├┤n mß║ính khß╗Åe!");

        return mapToResponse(saved);
    }

    // ΓöÇΓöÇ FIX: d├╣ng from() thay v├¼ constructor trß╗▒c tiß║┐p ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
                .orElseThrow(() -> new ResourceNotFoundException("V├⌐ xß║┐p h├áng kh├┤ng tß╗ôn tß║íi vß╗¢i ID: " + id));
    }

    private String getDoctorName(QueueTicket ticket) {
        if (ticket.getDoctor() != null && ticket.getDoctor().getUser() != null) {
            return ticket.getDoctor().getUser().getFullName();
        }
        return "B├íc s─⌐";
    }

    private void sendNotificationSafely(QueueTicket ticket, String title, String message) {
        try {
            if (ticket.getPatient() == null || ticket.getPatient().getUser() == null) return;
            // D├╣ng ApplicationContext ─æß╗â tr├ính hard dependency khi NotificationService ch╞░a c├│
            var notificationService = applicationContext.getBean("notificationServiceImpl");
            notificationService.getClass()
                    .getMethod("createNotification", Long.class, String.class, String.class, String.class)
                    .invoke(notificationService, ticket.getPatient().getUser().getUserId(), title, message, "APPOINTMENT");
        } catch (Exception e) {
            System.err.println("Notification skipped: " + e.getMessage());
        }
    }
}
