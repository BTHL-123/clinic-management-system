package com.clinicmanagement.doctorleave;

import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import com.clinicmanagement.doctorleave.dto.DoctorLeaveRequestCreateRequest;
import com.clinicmanagement.doctorleave.dto.DoctorLeaveRequestResponse;
import com.clinicmanagement.doctorleave.dto.ReviewDoctorLeaveRequest;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorLeaveRequestServiceImpl implements DoctorLeaveRequestService {

    private final DoctorLeaveRequestRepository leaveRequestRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final com.clinicmanagement.appointment.TimeSlotRepository timeSlotRepository;
    private final com.clinicmanagement.appointment.AppointmentRepository appointmentRepository;

    // ──────────────────────────────────────────────────────────────────────────
    // Doctor operations
    // ──────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public DoctorLeaveRequestResponse createLeaveRequest(
            DoctorLeaveRequestCreateRequest request, String currentUserEmail) {

        // ── Resolve doctor ──────────────────────────────────────────────
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng."));

        Doctor doctor = doctorRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new BusinessException("Bác sĩ không tồn tại trong hệ thống."));

        // ── Validate leaveDate ──────────────────────────────────────────
        if (request.leaveDate() == null) {
            throw new BusinessException("Ngày nghỉ không được để trống.");
        }
        if (request.leaveDate().isBefore(LocalDate.now())) {
            throw new BusinessException("Ngày nghỉ không được là ngày trong quá khứ.");
        }

        // ── Validate startTime / endTime ────────────────────────────────
        if (request.startTime() == null) {
            throw new BusinessException("Giờ bắt đầu không được để trống.");
        }
        if (request.endTime() == null) {
            throw new BusinessException("Giờ kết thúc không được để trống.");
        }
        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException("Giờ kết thúc phải sau giờ bắt đầu.");
        }

        // ── Validate reason ─────────────────────────────────────────────
        if (request.reason() == null || request.reason().isBlank()) {
            throw new BusinessException("Lý do không được để trống.");
        }

        // ── Validate requestType ────────────────────────────────────────
        DoctorLeaveRequest.RequestType requestType;
        try {
            requestType = DoctorLeaveRequest.RequestType.valueOf(request.requestType());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Loại yêu cầu không hợp lệ: " + request.requestType());
        }

        // ── Overlap check ─────────────────────────────────────────────
        boolean overlap = leaveRequestRepository
                .existsOverlappingRequest(
                        doctor.getDoctorId(),
                        request.leaveDate(),
                        request.startTime(),
                        request.endTime()
                );
        if (overlap) {
            throw new BusinessException(
                    "Đã có yêu cầu nghỉ PENDING hoặc APPROVED trùng hoặc giao cắt với khung giờ này.");
        }

        // ── Build entity ────────────────────────────────────────────────
        DoctorLeaveRequest entity = new DoctorLeaveRequest();
        entity.setDoctor(doctor);
        entity.setRequestType(requestType);
        entity.setLeaveDate(request.leaveDate());
        entity.setStartTime(request.startTime());
        entity.setEndTime(request.endTime());
        // Derive from_datetime / to_datetime to satisfy NOT NULL on those columns
        entity.setFromDatetime(LocalDateTime.of(request.leaveDate(), request.startTime()));
        entity.setToDatetime(LocalDateTime.of(request.leaveDate(), request.endTime()));
        entity.setReason(request.reason().trim());
        entity.setStatus(DoctorLeaveRequest.LeaveStatus.PENDING);

        return DoctorLeaveRequestResponse.from(leaveRequestRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorLeaveRequestResponse> getMyLeaveRequests(String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng."));

        Doctor doctor = doctorRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new BusinessException("Bác sĩ không tồn tại trong hệ thống."));

        return leaveRequestRepository
                .findByDoctor_DoctorIdOrderByCreatedAtDesc(doctor.getDoctorId())
                .stream()
                .map(DoctorLeaveRequestResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void cancelLeaveRequest(Long id, String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng."));

        Doctor doctor = doctorRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new BusinessException("Bác sĩ không tồn tại trong hệ thống."));

        DoctorLeaveRequest entity = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nghỉ."));

        // Ownership check
        if (!entity.getDoctor().getDoctorId().equals(doctor.getDoctorId())) {
            throw new BusinessException("Bạn không có quyền hủy yêu cầu này.");
        }

        // Only PENDING can be cancelled
        if (entity.getStatus() != DoctorLeaveRequest.LeaveStatus.PENDING) {
            throw new BusinessException("Chỉ có thể hủy yêu cầu ở trạng thái PENDING.");
        }

        leaveRequestRepository.delete(entity);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Admin operations
    // ──────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<DoctorLeaveRequestResponse> getAllLeaveRequests() {
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(DoctorLeaveRequestResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorLeaveRequestResponse> getLeaveRequestsByStatus(DoctorLeaveRequest.LeaveStatus status) {
        return leaveRequestRepository
                .findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(DoctorLeaveRequestResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public DoctorLeaveRequestResponse approveLeaveRequest(Long id, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng admin."));

        DoctorLeaveRequest entity = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nghỉ."));

        if (entity.getStatus() != DoctorLeaveRequest.LeaveStatus.PENDING) {
            throw new BusinessException("Chỉ có thể phê duyệt yêu cầu ở trạng thái PENDING.");
        }

        // ── Handle overlapping Time Slots ───────────────────────────
        java.util.List<com.clinicmanagement.appointment.TimeSlot> slots = timeSlotRepository
                .findAllSlotsByDoctorAndDate(entity.getDoctor().getDoctorId(), entity.getLeaveDate());

        for (com.clinicmanagement.appointment.TimeSlot slot : slots) {
            // Check if slot overlaps with leave request time
            if (slot.getStartTime().isBefore(entity.getEndTime()) && slot.getEndTime().isAfter(entity.getStartTime())) {
                if ("BOOKED".equals(slot.getStatus())) {
                    // Only block if there is a PENDING appointment (CONFIRMED, SCHEDULED, CHECKED_IN)
                    boolean hasPendingAppt = appointmentRepository.existsPendingAppointmentForSlot(
                            entity.getDoctor().getDoctorId(),
                            entity.getLeaveDate(),
                            slot.getStartTime(),
                            slot.getEndTime()
                    );
                    if (hasPendingAppt) {
                        throw new BusinessException("Không thể duyệt nghỉ: Bác sĩ đã có lịch hẹn chưa hoàn thành trong khung giờ này. Vui lòng dời lịch hoặc hủy lịch hẹn trước.");
                    }
                } else if ("AVAILABLE".equals(slot.getStatus()) || "LOCKED".equals(slot.getStatus())) {
                    slot.setStatus("CANCELLED");
                    timeSlotRepository.save(slot);
                }
            }
        }

        entity.setStatus(DoctorLeaveRequest.LeaveStatus.APPROVED);
        entity.setApprovedBy(admin);
        entity.setApprovedAt(LocalDateTime.now());

        return DoctorLeaveRequestResponse.from(leaveRequestRepository.save(entity));
    }

    @Override
    @Transactional
    public DoctorLeaveRequestResponse rejectLeaveRequest(Long id, ReviewDoctorLeaveRequest request, String adminEmail) {
        if (request == null || request.adminComment() == null || request.adminComment().isBlank()) {
            throw new BusinessException("Lý do từ chối (adminComment) là bắt buộc.");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BusinessException("Không tìm thấy người dùng admin."));

        DoctorLeaveRequest entity = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nghỉ."));

        if (entity.getStatus() != DoctorLeaveRequest.LeaveStatus.PENDING) {
            throw new BusinessException("Chỉ có thể từ chối yêu cầu ở trạng thái PENDING.");
        }

        entity.setStatus(DoctorLeaveRequest.LeaveStatus.REJECTED);
        entity.setAdminComment(request.adminComment().trim());
        entity.setApprovedBy(admin);
        entity.setApprovedAt(LocalDateTime.now());

        return DoctorLeaveRequestResponse.from(leaveRequestRepository.save(entity));
    }
}
