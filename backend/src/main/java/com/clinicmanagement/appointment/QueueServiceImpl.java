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
            throw new BusinessException("KhΓö£Γöñng th├ƒΓòù├ó g├ƒΓòù├¼i b├ƒΓòù├ºnh nhΓö£├│n ΓöÇ├ªΓö£├║ hoΓö£├ín thΓö£├ính khΓö£├¡m.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("KhΓö£Γöñng th├ƒΓòù├ó g├ƒΓòù├¼i b├ƒΓòù├ºnh nhΓö£├│n ΓöÇ├ªΓö£├║ h├ƒΓòù┬║y khΓö£├¡m.");
        }

        ticket.setStatus("CALLED");
        ticket.setCalledAt(LocalDateTime.now());
        QueueTicket saved = queueTicketRepository.save(ticket);

        sendNotificationSafely(saved, "LΓò₧Γûæ├ƒΓòù├║t khΓö£├¡m c├ƒΓòù┬║a b├ƒΓòæ├¡n",
                "B├ƒΓòæ├¡n ΓöÇ├ªΓö£├║ ΓöÇ├ªΓò₧Γûæ├ƒΓòù├║c g├ƒΓòù├¼i vΓö£├ío phΓö£Γûông khΓö£├¡m c├ƒΓòù┬║a bΓö£├¡c sΓöÇΓîÉ "
                        + getDoctorName(saved) + ". S├ƒΓòù├ª th├ƒΓòùΓîÉ t├ƒΓòùΓûÆ: #" + saved.getQueueNumber() + ".");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public QueueTicketResponse skipPatient(Long queueTicketId) {
        QueueTicket ticket = findOrThrow(queueTicketId);

        String status = ticket.getStatus();
        if ("COMPLETED".equals(status) || "DONE".equals(status)) {
            throw new BusinessException("KhΓö£Γöñng th├ƒΓòù├ó b├ƒΓòù├à qua b├ƒΓòù├ºnh nhΓö£├│n ΓöÇ├ªΓö£├║ hoΓö£├ín thΓö£├ính khΓö£├¡m.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("KhΓö£Γöñng th├ƒΓòù├ó b├ƒΓòù├à qua b├ƒΓòù├ºnh nhΓö£├│n ΓöÇ├ªΓö£├║ h├ƒΓòù┬║y khΓö£├¡m.");
        }
        if ("SKIPPED".equals(status)) {
            throw new BusinessException("B├ƒΓòù├ºnh nhΓö£├│n nΓö£├íy ΓöÇ├ªΓö£├║ ΓöÇ├ªΓò₧Γûæ├ƒΓòù├║c b├ƒΓòù├à qua trΓò₧Γûæ├ƒΓòù┬óc ΓöÇ├ªΓö£Γöé.");
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
            throw new BusinessException("B├ƒΓòù├ºnh nhΓö£├│n nΓö£├íy ΓöÇ├ªΓö£├║ hoΓö£├ín thΓö£├ính khΓö£├¡m.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("KhΓö£Γöñng th├ƒΓòù├ó hoΓö£├ín t├ƒΓòæ├æt cho b├ƒΓòù├ºnh nhΓö£├│n ΓöÇ├ªΓö£├║ h├ƒΓòù┬║y khΓö£├¡m.");
        }

        ticket.setStatus("DONE");
        ticket.setCompletedAt(LocalDateTime.now());
        QueueTicket saved = queueTicketRepository.save(ticket);

        if (ticket.getAppointment() != null) {
            ticket.getAppointment().setStatus("COMPLETED");
            appointmentRepository.save(ticket.getAppointment());
        }

        sendNotificationSafely(saved, "HoΓö£├ín thΓö£├ính khΓö£├¡m b├ƒΓòù├ºnh",
                "Ca khΓö£├¡m c├ƒΓòù┬║a b├ƒΓòæ├¡n v├ƒΓòù┬ói bΓö£├¡c sΓöÇΓîÉ " + getDoctorName(saved) + " ΓöÇ├ªΓö£├║ hoΓö£├ín t├ƒΓòæ├æt. ChΓö£Γòæc b├ƒΓòæ├¡n luΓö£Γöñn m├ƒΓòæ├¡nh kh├ƒΓòù├àe!");

        return mapToResponse(saved);
    }

    // ╬ô├╢├ç╬ô├╢├ç FIX: dΓö£Γòúng from() thay vΓö£┬╝ constructor tr├ƒΓòùΓûÆc ti├ƒΓòæΓöÉp ╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç╬ô├╢├ç
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
                .orElseThrow(() -> new ResourceNotFoundException("VΓö£ΓîÉ x├ƒΓòæΓöÉp hΓö£├íng khΓö£Γöñng t├ƒΓòù├┤n t├ƒΓòæ├¡i v├ƒΓòù┬ói ID: " + id));
    }

    private String getDoctorName(QueueTicket ticket) {
        if (ticket.getDoctor() != null && ticket.getDoctor().getUser() != null) {
            return ticket.getDoctor().getUser().getFullName();
        }
        return "BΓö£├¡c sΓöÇΓîÉ";
    }

    private void sendNotificationSafely(QueueTicket ticket, String title, String message) {
        try {
            if (ticket.getPatient() == null || ticket.getPatient().getUser() == null) return;
            // DΓö£Γòúng ApplicationContext ΓöÇ├ª├ƒΓòù├ó trΓö£├¡nh hard dependency khi NotificationService chΓò₧Γûæa cΓö£Γöé
            var notificationService = applicationContext.getBean("notificationServiceImpl");
            notificationService.getClass()
                    .getMethod("createNotification", Long.class, String.class, String.class, String.class)
                    .invoke(notificationService, ticket.getPatient().getUser().getUserId(), title, message, "APPOINTMENT");
        } catch (Exception e) {
            System.err.println("Notification skipped: " + e.getMessage());
        }
    }
}
