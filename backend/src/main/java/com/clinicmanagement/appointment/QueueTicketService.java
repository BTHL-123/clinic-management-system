package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.QueueTicketResponse;
import com.clinicmanagement.appointment.dto.SkipQueueRequest;
import com.clinicmanagement.appointment.dto.StartExaminationResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import com.clinicmanagement.patient.PatientRepository;
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
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ConsultationSessionRepository consultationRepository;

    // ── GET QUEUE BY DOCTOR + DATE ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<QueueTicketResponse> getQueue(Long doctorId, LocalDate date, String status) {
        return queueTicketRepository.findByDoctorAndDate(doctorId, date, status)
                .stream()
                .map(q -> {
                    String patientName = patientRepository.findById(q.getPatientId())
                            .map(p -> p.getFullName())
                            .orElse(null);
                    Long consultationId = consultationRepository.findByAppointmentId(q.getAppointmentId())
                            .map(ConsultationSession::getConsultationId)
                            .orElse(null);
                    return QueueTicketResponse.from(q, patientName, consultationId);
                })
                .toList();
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public QueueTicketResponse getById(Long id) {
        QueueTicket ticket = findOrThrow(id);
        String patientName = patientRepository.findById(ticket.getPatientId())
                .map(p -> p.getFullName()).orElse(null);
        Long consultationId = consultationRepository.findByAppointmentId(ticket.getAppointmentId())
                .map(ConsultationSession::getConsultationId).orElse(null);
        return QueueTicketResponse.from(ticket, patientName, consultationId);
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
        return QueueTicketResponse.from(ticket,
                patientRepository.findById(ticket.getPatientId()).map(p -> p.getFullName()).orElse(null),
                null);
    }

    // ── START EXAMINATION (Task 40 core) ──────────────────────────────────────
    @Transactional
    public StartExaminationResponse startExamination(Long id) {
        QueueTicket ticket = findOrThrow(id);

        if (!"WAITING".equals(ticket.getStatus()) && !"CALLED".equals(ticket.getStatus())) {
            throw new BusinessException("Chỉ có thể bắt đầu khám khi bệnh nhân đang WAITING hoặc CALLED.");
        }

        // Tạo hoặc lấy consultation session
        ConsultationSession session = consultationRepository
                .findByAppointmentId(ticket.getAppointmentId())
                .orElseGet(() -> {
                    ConsultationSession newSession = ConsultationSession.builder()
                            .appointmentId(ticket.getAppointmentId())
                            .patientId(ticket.getPatientId())
                            .doctorId(ticket.getDoctorId())
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
        return QueueTicketResponse.from(ticket,
                patientRepository.findById(ticket.getPatientId()).map(p -> p.getFullName()).orElse(null),
                consultationRepository.findByAppointmentId(ticket.getAppointmentId())
                        .map(ConsultationSession::getConsultationId).orElse(null));
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
        return QueueTicketResponse.from(ticket,
                patientRepository.findById(ticket.getPatientId()).map(p -> p.getFullName()).orElse(null),
                null);
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private QueueTicket findOrThrow(Long id) {
        return queueTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vé hàng đợi #" + id));
    }
}
