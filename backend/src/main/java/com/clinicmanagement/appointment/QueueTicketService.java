package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.QueueTicketResponse;
import com.clinicmanagement.appointment.dto.SkipQueueRequest;
import com.clinicmanagement.appointment.dto.StartExaminationResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QueueTicketService {

    private final QueueTicketRepository queueTicketRepository;
    private final ConsultationSessionRepository consultationRepository;

    // ── GET QUEUE BY DOCTOR + DATE ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<QueueTicketResponse> getQueue(Long doctorId, LocalDate date, String status) {
        return queueTicketRepository.findByDoctorAndDate(doctorId, date, status)
                .stream()
                .map(q -> {
                    Long consultationId = getConsultationId(q);
                    return QueueTicketResponse.from(q, consultationId);
                })
                .toList();
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public QueueTicketResponse getById(Long id) {
        QueueTicket ticket = findOrThrow(id);
        return QueueTicketResponse.from(ticket, getConsultationId(ticket));
    }

    // ── CALL PATIENT ──────────────────────────────────────────────────────────
    @Transactional
    public QueueTicketResponse call(Long id) {
        QueueTicket ticket = findOrThrow(id);
        if (!"WAITING".equals(ticket.getStatus())) {
            throw new BusinessException("Chỉ có thể gọi bệnh nhân ở trạng thái WAITING.");
        }
        ticket.setStatus("CALLED");
        ticket.setCalledAt(LocalDateTime.now());
        queueTicketRepository.save(ticket);
        return QueueTicketResponse.from(ticket, null);
    }

    // ── START EXAMINATION (Task 40 core) ──────────────────────────────────────
    @Transactional
    public StartExaminationResponse startExamination(Long id) {
        QueueTicket ticket = findOrThrow(id);

        if (!"WAITING".equals(ticket.getStatus()) && !"CALLED".equals(ticket.getStatus())) {
            throw new BusinessException("Chỉ có thể bắt đầu khám khi bệnh nhân đang WAITING hoặc CALLED.");
        }

        Long appointmentId = ticket.getAppointment().getAppointmentId();
        Long patientId = ticket.getPatient().getPatientId();
        Long doctorId = ticket.getDoctor().getDoctorId();

        // Tạo hoặc lấy consultation session
        ConsultationSession session = consultationRepository
                .findByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    ConsultationSession newSession = ConsultationSession.builder()
                            .appointmentId(appointmentId)
                            .patientId(patientId)
                            .doctorId(doctorId)
                            .status("WAITING")
                            .build();
                    return consultationRepository.save(newSession);
                });

        // Bắt đầu consultation
        if ("WAITING".equals(session.getStatus())) {
            session.setStatus("IN_PROGRESS");
            session.setStartedAt(LocalDateTime.now());
            consultationRepository.save(session);
        }

        // Cập nhật queue ticket
        ticket.setStatus("IN_EXAMINATION");
        queueTicketRepository.save(ticket);

        return new StartExaminationResponse(
                ticket.getQueueTicketId(),
                ticket.getStatus(),
                session.getConsultationId()
        );
    }

    // ── MARK DONE ─────────────────────────────────────────────────────────────
    @Transactional
    public QueueTicketResponse markDone(Long id) {
        QueueTicket ticket = findOrThrow(id);
        if (!"IN_EXAMINATION".equals(ticket.getStatus())) {
            throw new BusinessException("Chỉ có thể đánh dấu hoàn thành khi đang IN_EXAMINATION.");
        }
        ticket.setStatus("DONE");
        ticket.setCompletedAt(LocalDateTime.now());
        queueTicketRepository.save(ticket);
        return QueueTicketResponse.from(ticket, getConsultationId(ticket));
    }

    // ── SKIP ──────────────────────────────────────────────────────────────────
    @Transactional
    public QueueTicketResponse skip(Long id, SkipQueueRequest request) {
        QueueTicket ticket = findOrThrow(id);
        if ("DONE".equals(ticket.getStatus()) || "CANCELLED".equals(ticket.getStatus())) {
            throw new BusinessException("Không thể bỏ qua vé đã hoàn thành hoặc đã hủy.");
        }
        ticket.setStatus("SKIPPED");
        queueTicketRepository.save(ticket);
        return QueueTicketResponse.from(ticket, null);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private QueueTicket findOrThrow(Long id) {
        return queueTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vé hàng đợi #" + id));
    }

    private Long getConsultationId(QueueTicket ticket) {
        if (ticket.getAppointment() == null) return null;
        return consultationRepository
                .findByAppointmentId(ticket.getAppointment().getAppointmentId())
                .map(ConsultationSession::getConsultationId)
                .orElse(null);
    }
}
