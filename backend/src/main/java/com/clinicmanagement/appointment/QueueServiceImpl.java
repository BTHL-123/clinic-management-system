package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.QueueTicketResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.clinicmanagement.notification.NotificationService;

@Service
@RequiredArgsConstructor
public class QueueServiceImpl implements QueueService {

    private final QueueTicketRepository queueTicketRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<QueueTicketResponse> getQueue(LocalDate date, Long doctorId, String status) {
        LocalDate searchDate = date != null ? date : LocalDate.now();
        Specification<QueueTicket> spec = QueueTicketSpecifications.searchQueueTickets(searchDate, doctorId, status);
        List<QueueTicket> tickets = queueTicketRepository.findAll(spec);
        return tickets.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public QueueTicketResponse callPatient(Long queueTicketId) {
        QueueTicket ticket = queueTicketRepository.findById(queueTicketId)
                .orElseThrow(() -> new ResourceNotFoundException("Vé xếp hàng không tồn tại với ID: " + queueTicketId));

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

        try {
            if (saved.getPatient() != null && saved.getPatient().getUser() != null) {
                notificationService.createNotification(
                        saved.getPatient().getUser().getUserId(),
                        "Lượt khám của bạn",
                        "Bạn đã được gọi vào phòng khám của bác sĩ " + (saved.getDoctor() != null && saved.getDoctor().getUser() != null ? saved.getDoctor().getUser().getFullName() : "Bác sĩ") + ". Số thứ tự khám của bạn là #" + saved.getQueueNumber() + ".",
                        "APPOINTMENT"
                );
            }
        } catch (Exception e) {
            System.err.println("Không thể tạo thông báo gọi khám: " + e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public QueueTicketResponse skipPatient(Long queueTicketId) {
        QueueTicket ticket = queueTicketRepository.findById(queueTicketId)
                .orElseThrow(() -> new ResourceNotFoundException("Vé xếp hàng không tồn tại với ID: " + queueTicketId));

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
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public QueueTicketResponse completePatient(Long queueTicketId) {
        QueueTicket ticket = queueTicketRepository.findById(queueTicketId)
                .orElseThrow(() -> new ResourceNotFoundException("Vé xếp hàng không tồn tại với ID: " + queueTicketId));

        String status = ticket.getStatus();
        if ("COMPLETED".equals(status) || "DONE".equals(status)) {
            throw new BusinessException("Bệnh nhân này đã hoàn thành khám.");
        }
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Không thể hoàn tất cho bệnh nhân đã hủy khám.");
        }

        // Update QueueTicket status to DONE to match database constraint
        ticket.setStatus("DONE");
        ticket.setCompletedAt(LocalDateTime.now());
        QueueTicket saved = queueTicketRepository.save(ticket);

        // Update related Appointment status to COMPLETED
        Appointment appointment = ticket.getAppointment();
        if (appointment != null) {
            appointment.setStatus("COMPLETED");
            appointmentRepository.save(appointment);
        }

        try {
            if (saved.getPatient() != null && saved.getPatient().getUser() != null) {
                notificationService.createNotification(
                        saved.getPatient().getUser().getUserId(),
                        "Hoàn thành khám bệnh",
                        "Ca khám của bạn với bác sĩ " + (saved.getDoctor() != null && saved.getDoctor().getUser() != null ? saved.getDoctor().getUser().getFullName() : "Bác sĩ") + " đã hoàn tất. Chúc bạn luôn mạnh khỏe!",
                        "APPOINTMENT"
                );
            }
        } catch (Exception e) {
            System.err.println("Không thể tạo thông báo hoàn thành khám: " + e.getMessage());
        }

        return mapToResponse(saved);
    }

    private QueueTicketResponse mapToResponse(QueueTicket qt) {
        return new QueueTicketResponse(
                qt.getQueueTicketId(),
                qt.getQueueNumber(),
                "DONE".equals(qt.getStatus()) ? "COMPLETED" : qt.getStatus(),
                qt.getAppointment() != null ? qt.getAppointment().getAppointmentId() : null,
                qt.getAppointment() != null ? qt.getAppointment().getAppointmentCode() : null,
                qt.getPatient() != null ? qt.getPatient().getPatientId() : null,
                qt.getPatient() != null ? qt.getPatient().getFullName() : null,
                qt.getPatient() != null ? qt.getPatient().getPhone() : null,
                qt.getDoctor() != null ? qt.getDoctor().getDoctorId() : null,
                (qt.getDoctor() != null && qt.getDoctor().getUser() != null) ? qt.getDoctor().getUser().getFullName() : null,
                qt.getQueueDate(),
                qt.getAppointment() != null ? qt.getAppointment().getStartTime() : null,
                qt.getAppointment() != null ? qt.getAppointment().getEndTime() : null,
                qt.getCheckedInAt(),
                qt.getCalledAt(),
                qt.getCompletedAt()
        );
    }
}
