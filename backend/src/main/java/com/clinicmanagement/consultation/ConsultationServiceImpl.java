package com.clinicmanagement.consultation;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.consultation.dto.ChangeConsultationStatusRequest;
import com.clinicmanagement.consultation.dto.ConsultationResponse;
import com.clinicmanagement.consultation.dto.CreateConsultationRequest;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConsultationServiceImpl implements ConsultationService {

    private static final List<String> VALID_STATUSES = List.of(
            "WAITING", "IN_PROGRESS", "WAITING_LAB_RESULT", "PRESCRIBED", "COMPLETED"
    );

    private final ConsultationSessionRepository consultationRepository;
    private final com.clinicmanagement.appointment.AppointmentRepository appointmentRepository;
    private final com.clinicmanagement.appointment.QueueTicketRepository queueTicketRepository;

    // ── GET LIST ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @Override
    public PageResponse<ConsultationResponse> getAll(Long patientId, Long doctorId, String status, Pageable pageable) {
        return PageResponse.from(
                consultationRepository.findByFilters(patientId, doctorId, status, pageable)
                        .map(ConsultationResponse::from)
        );
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @Override
    public ConsultationResponse getById(Long id) {
        return ConsultationResponse.from(findOrThrow(id));
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    @Transactional
    @Override
    public ConsultationResponse create(CreateConsultationRequest request) {
        if (consultationRepository.existsByAppointmentId(request.appointmentId())) {
            throw new BusinessException("Phiên khám cho lịch hẹn này đã tồn tại.");
        }

        ConsultationSession session = ConsultationSession.builder()
                .appointmentId(request.appointmentId())
                .patientId(request.patientId())
                .doctorId(request.doctorId())
                .status("WAITING")
                .build();

        return ConsultationResponse.from(consultationRepository.save(session));
    }

    // ── START ─────────────────────────────────────────────────────────────────
    @Transactional
    @Override
    public ConsultationResponse start(Long id) {
        ConsultationSession session = findOrThrow(id);
        if (!"WAITING".equals(session.getStatus())) {
            throw new BusinessException("Chỉ có thể bắt đầu phiên khám ở trạng thái WAITING.");
        }
        session.setStatus("IN_PROGRESS");
        session.setStartedAt(LocalDateTime.now());
        return ConsultationResponse.from(consultationRepository.save(session));
    }

    @Transactional
    @Override
    public ConsultationResponse complete(Long id) {
        ConsultationSession session = findOrThrow(id);
        if ("COMPLETED".equals(session.getStatus())) {
            throw new BusinessException("Phiên khám đã hoàn thành.");
        }
        session.setStatus("COMPLETED");
        session.setCompletedAt(LocalDateTime.now());
        
        appointmentRepository.findById(session.getAppointmentId()).ifPresent(app -> {
            app.setStatus("COMPLETED");
            appointmentRepository.save(app);
            
            queueTicketRepository.findByAppointment(app).ifPresent(ticket -> {
                if ("IN_EXAMINATION".equals(ticket.getStatus())) {
                    ticket.setStatus("DONE");
                    ticket.setCompletedAt(LocalDateTime.now());
                    queueTicketRepository.save(ticket);
                }
            });
        });

        return ConsultationResponse.from(consultationRepository.save(session));
    }

    // ── CHANGE STATUS ─────────────────────────────────────────────────────────
    @Transactional
    @Override
    public ConsultationResponse changeStatus(Long id, ChangeConsultationStatusRequest request) {
        if (!VALID_STATUSES.contains(request.status())) {
            throw new BusinessException("Trạng thái không hợp lệ: " + request.status());
        }
        ConsultationSession session = findOrThrow(id);
        session.setStatus(request.status());
        return ConsultationResponse.from(consultationRepository.save(session));
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private ConsultationSession findOrThrow(Long id) {
        return consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên khám với ID: " + id));
    }
}

