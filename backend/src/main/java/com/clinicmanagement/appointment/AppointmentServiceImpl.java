package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.appointment.dto.BookAppointmentRequest;
import com.clinicmanagement.appointment.dto.RescheduleAppointmentRequest;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@Transactional(readOnly = true)
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final QueueTicketRepository queueTicketRepository;

    public AppointmentServiceImpl(
            AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            UserRepository userRepository,
            QueueTicketRepository queueTicketRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.queueTicketRepository = queueTicketRepository;
    }

    @Override
    public PageResponse<AppointmentResponse> getAppointments(
            Long patientId,
            Long doctorId,
            LocalDate date,
            String status,
            Pageable pageable
    ) {
        Page<Appointment> appointments = appointmentRepository.findAppointmentsFiltered(
                patientId, doctorId, date, status, pageable
        );
        return PageResponse.from(appointments.map(this::mapToResponse));
    }

    @Override
    public AppointmentResponse getAppointmentById(Long id, Long currentUserId, boolean isPatientOrDoctor) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        // Issue #1: Nếu caller là PATIENT hoặc DOCTOR, chỉ được xem appointment của chính mình
        if (isPatientOrDoctor) {
            Long patientUserId = appointment.getPatient() != null
                    && appointment.getPatient().getUser() != null
                    ? appointment.getPatient().getUser().getUserId()
                    : null;
                    
            Long doctorUserId = appointment.getDoctor() != null
                    && appointment.getDoctor().getUser() != null
                    ? appointment.getDoctor().getUser().getUserId()
                    : null;
                    
            if (!currentUserId.equals(patientUserId) && !currentUserId.equals(doctorUserId)) {
                throw new BusinessException("Bạn không có quyền xem lịch hẹn này.");
            }
        }

        return mapToResponse(appointment);
    }

    @Override
    public PageResponse<AppointmentResponse> getMyAppointments(
            Long userId,
            boolean upcoming,
            Pageable pageable
    ) {
        LocalDate currentDate = LocalDate.now();
        LocalTime currentTime = LocalTime.now();
        Page<Appointment> appointments = appointmentRepository.findMyAppointments(
                userId, upcoming, currentDate, currentTime, pageable
        );
        return PageResponse.from(appointments.map(this::mapToResponse));
    }

    private AppointmentResponse mapToResponse(Appointment app) {
        Integer queueNumber = app.getQueueTicket() != null ? app.getQueueTicket().getQueueNumber() : null;
        String queueStatus = app.getQueueTicket() != null ? app.getQueueTicket().getStatus() : null;
        String patientPhone = app.getPatient() != null ? app.getPatient().getPhone() : null;
        return new AppointmentResponse(
                app.getAppointmentId(),
                app.getAppointmentCode(),
                app.getPatient() != null ? app.getPatient().getPatientId() : null,
                app.getPatient() != null ? app.getPatient().getFullName() : null,
                app.getDoctor() != null ? app.getDoctor().getDoctorId() : null,
                (app.getDoctor() != null && app.getDoctor().getUser() != null) ? app.getDoctor().getUser().getFullName() : null,
                app.getDoctor() != null ? app.getDoctor().getSpecialization() : null,
                app.getDepartment() != null ? app.getDepartment().getDepartmentId() : null,
                app.getDepartment() != null ? app.getDepartment().getDepartmentName() : null,
                app.getTimeSlot() != null ? app.getTimeSlot().getId() : null,
                app.getAppointmentDate(),
                app.getStartTime(),
                app.getEndTime(),
                app.getBookingType(),
                app.getReasonForVisit(),
                app.getInitialSymptoms(),
                app.getStatus(),
                app.getDepositAmount(),
                app.getCancellationReason(),
                app.getCancelledAt(),
                patientPhone,
                app.getCheckedInAt(),
                queueNumber,
                queueStatus
        );
    }

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(BookAppointmentRequest request, Long userId) {
        // Issue #3: Dùng pessimistic write lock để tránh race condition
        TimeSlot slot = timeSlotRepository.findByIdWithPessimisticLock(request.slotId())
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám không tồn tại với id: " + request.slotId()));

        // Issue #2: Kiểm tra slot hợp lệ để book
        String slotStatus = slot.getStatus();
        if ("BOOKED".equals(slotStatus)) {
            throw new BusinessException("Ca khám này đã được đặt.");
        }

        // Lấy hoặc tạo patient record cho user hiện tại
        Patient patient = patientRepository.findByUserUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với id: " + userId));
                    Patient p = new Patient();
                    p.setUser(user);
                    p.setPatientCode("PAT" + System.currentTimeMillis());
                    p.setFullName(user.getFullName());
                    p.setEmail(user.getEmail());
                    p.setPhone(user.getPhone() != null ? user.getPhone() : "0900000000");
                    p.setGender("OTHER");
                    return patientRepository.save(p);
                });

        if ("LOCKED".equals(slotStatus)) {
            // Slot đang bị lock — chỉ đúng patient đang giữ lock mới được book
            Long lockedBy = slot.getLockedByPatientId();
            LocalDateTime lockedUntil = slot.getLockedUntil();
            boolean lockBelongsToCurrentPatient = patient.getPatientId().equals(lockedBy);
            boolean lockStillValid = lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);

            if (!lockBelongsToCurrentPatient || !lockStillValid) {
                throw new BusinessException("Ca khám này đang được người khác giữ chỗ hoặc lock đã hết hạn.");
            }
        } else if (!"AVAILABLE".equals(slotStatus)) {
            // Ngoài BOOKED, LOCKED, AVAILABLE ra là trạng thái không hợp lệ để book
            throw new BusinessException("Ca khám này không còn khả dụng.");
        }

        slot.setStatus("BOOKED");
        slot.setLockedUntil(null);
        slot.setLockedByPatientId(null);
        timeSlotRepository.save(slot);

        Doctor doctor = doctorRepository.findById(slot.getDoctorSchedule().getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Bác sĩ không tồn tại với id: " + slot.getDoctorSchedule().getDoctorId()));

        Appointment app = new Appointment();
        app.setPatient(patient);
        app.setDoctor(doctor);
        app.setDepartment(doctor.getDepartment());
        app.setTimeSlot(slot);
        app.setAppointmentDate(slot.getDoctorSchedule().getWorkDate());
        app.setStartTime(slot.getStartTime());
        app.setEndTime(slot.getEndTime());
        app.setStatus("CONFIRMED");
        app.setReasonForVisit(request.reasonForVisit());
        app.setBookingType("ONLINE");
        app.setDepositAmount(doctor.getConsultationFee());
        app.setAppointmentCode("APT" + System.currentTimeMillis());

        Appointment savedApp = appointmentRepository.save(app);
        return mapToResponse(savedApp);
    }

    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(
            Long appointmentId,
            String cancellationReason,
            Long currentUserId,
            boolean isReceptionist
    ) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại với id: " + appointmentId));

        // 1. Kiểm tra quyền: PATIENT chỉ được hủy lịch của chính mình
        if (!isReceptionist) {
            Long ownerId = appointment.getPatient() != null
                    && appointment.getPatient().getUser() != null
                    ? appointment.getPatient().getUser().getUserId()
                    : null;
            if (!currentUserId.equals(ownerId)) {
                throw new BusinessException("Bạn không có quyền hủy lịch hẹn này.");
            }
        }

        // 2. Kiểm tra trạng thái appointment
        String currentStatus = appointment.getStatus();
        if ("CANCELLED".equals(currentStatus)) {
            throw new BusinessException("Lịch hẹn này đã được hủy trước đó.");
        }
        if ("COMPLETED".equals(currentStatus)) {
            throw new BusinessException("Không thể hủy lịch hẹn đã hoàn thành.");
        }
        if ("CHECKED_IN".equals(currentStatus)) {
            throw new BusinessException("Không thể hủy lịch hẹn đang trong trạng thái đã check-in.");
        }

        // 3. Kiểm tra thời gian — không được hủy lịch đã qua
        java.time.LocalDateTime appointmentDateTime = java.time.LocalDateTime.of(
                appointment.getAppointmentDate(), appointment.getStartTime());
        if (appointmentDateTime.isBefore(java.time.LocalDateTime.now())) {
            throw new BusinessException("Không thể hủy lịch hẹn đã qua thời gian khám.");
        }

        // 4. Cập nhật appointment
        appointment.setStatus("CANCELLED");
        appointment.setCancellationReason(cancellationReason);
        appointment.setCancelledAt(java.time.LocalDateTime.now());
        appointment.setCancelledBy(currentUserId);
        appointmentRepository.save(appointment);

        // 5. Giải phóng slot — đặt lại thành AVAILABLE
        if (appointment.getTimeSlot() != null) {
            TimeSlot slot = appointment.getTimeSlot();
            slot.setStatus("AVAILABLE");
            slot.setLockedByPatientId(null);
            slot.setLockedUntil(null);
            timeSlotRepository.save(slot);
        }

        return mapToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse rescheduleAppointment(
            Long appointmentId,
            RescheduleAppointmentRequest request,
            Long currentUserId,
            boolean isPrivileged
    ) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại với id: " + appointmentId));

        if (!isPrivileged) {
            Long ownerId = appointment.getPatient() != null
                    && appointment.getPatient().getUser() != null
                    ? appointment.getPatient().getUser().getUserId()
                    : null;
            if (!currentUserId.equals(ownerId)) {
                throw new BusinessException("Bạn không có quyền dời lịch hẹn này.");
            }
        }

        String currentStatus = appointment.getStatus();
        if ("CANCELLED".equals(currentStatus) || "COMPLETED".equals(currentStatus) || "CHECKED_IN".equals(currentStatus)) {
            throw new BusinessException("Không thể dời lịch hẹn có trạng thái: " + currentStatus);
        }

        java.time.LocalDateTime appointmentDateTime = java.time.LocalDateTime.of(
                appointment.getAppointmentDate(), appointment.getStartTime());
        if (appointmentDateTime.isBefore(java.time.LocalDateTime.now())) {
            throw new BusinessException("Không thể dời lịch hẹn đã qua thời gian khám.");
        }

        TimeSlot oldSlot = appointment.getTimeSlot();
        if (oldSlot != null && oldSlot.getId().equals(request.newSlotId())) {
            throw new BusinessException("Ca khám mới không được trùng với ca khám hiện tại.");
        }

        TimeSlot newSlot = timeSlotRepository.findByIdWithPessimisticLock(request.newSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám mới không tồn tại với id: " + request.newSlotId()));

        if (!"AVAILABLE".equals(newSlot.getStatus())) {
            throw new BusinessException("Ca khám mới không còn khả dụng.");
        }

        // Release old slot
        if (oldSlot != null) {
            oldSlot.setStatus("AVAILABLE");
            oldSlot.setLockedByPatientId(null);
            oldSlot.setLockedUntil(null);
            timeSlotRepository.save(oldSlot);
        }

        // Lock new slot
        newSlot.setStatus("BOOKED");
        newSlot.setLockedUntil(null);
        newSlot.setLockedByPatientId(null);
        timeSlotRepository.save(newSlot);

        Doctor newDoctor = doctorRepository.findById(newSlot.getDoctorSchedule().getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Bác sĩ không tồn tại với id: " + newSlot.getDoctorSchedule().getDoctorId()));

        if (!appointment.getDoctor().getDoctorId().equals(newDoctor.getDoctorId())) {
            throw new BusinessException("Chỉ có thể dời lịch khám với cùng một bác sĩ. Vui lòng hủy và đặt lại nếu bạn muốn đổi bác sĩ.");
        }

        appointment.setTimeSlot(newSlot);
        appointment.setAppointmentDate(newSlot.getDoctorSchedule().getWorkDate());
        appointment.setStartTime(newSlot.getStartTime());
        appointment.setEndTime(newSlot.getEndTime());
        
        if (request.rescheduleReason() != null && !request.rescheduleReason().trim().isEmpty()) {
            String existingReason = appointment.getReasonForVisit() != null ? appointment.getReasonForVisit() : "";
            appointment.setReasonForVisit(existingReason + "\n[Dời lịch: " + request.rescheduleReason() + "]");
        }

        appointmentRepository.save(appointment);

        return mapToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse checkInAppointment(Long appointmentId, Long receptionistId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại với ID: " + appointmentId));

        String status = appointment.getStatus();
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Không thể check-in lịch hẹn đã hủy.");
        }
        if ("COMPLETED".equals(status)) {
            throw new BusinessException("Không thể check-in lịch hẹn đã hoàn thành.");
        }
        if ("CHECKED_IN".equals(status)) {
            throw new BusinessException("Lịch hẹn đã được check-in trước đó.");
        }
        if (!"CONFIRMED".equals(status)) {
            throw new BusinessException("Lịch hẹn phải ở trạng thái CONFIRMED mới có thể check-in.");
        }
        if (!appointment.getAppointmentDate().equals(LocalDate.now())) {
            throw new BusinessException("Chỉ có thể check-in cho lịch hẹn trong ngày hôm nay.");
        }

        appointment.setStatus("CHECKED_IN");
        appointment.setCheckedInAt(LocalDateTime.now());
        appointment.setCheckedInBy(receptionistId);

        QueueTicket ticket = appointment.getQueueTicket();
        if (ticket == null) {
            ticket = new QueueTicket();
            ticket.setAppointment(appointment);
            ticket.setPatient(appointment.getPatient());
            ticket.setDoctor(appointment.getDoctor());
            ticket.setDepartment(appointment.getDepartment());
            ticket.setQueueDate(LocalDate.now());

            int nextQueueNumber = queueTicketRepository.findMaxQueueNumberByDoctorAndDate(
                    appointment.getDoctor().getDoctorId(), LocalDate.now()
            ) + 1;

            ticket.setQueueNumber(nextQueueNumber);
            ticket.setPriorityLevel("NORMAL");
            ticket.setStatus("WAITING");
            ticket.setCheckedInAt(LocalDateTime.now());

            queueTicketRepository.save(ticket);
            appointment.setQueueTicket(ticket);
        } else {
            ticket.setStatus("WAITING");
            ticket.setCheckedInAt(LocalDateTime.now());
            queueTicketRepository.save(ticket);
        }

        Appointment saved = appointmentRepository.save(appointment);
        return mapToResponse(saved);
    }

    @Override
    public PageResponse<AppointmentResponse> searchAppointmentsForReceptionist(
            String keyword,
            LocalDate date,
            String status,
            Pageable pageable
    ) {
        LocalDate searchDate = date;
        if (searchDate == null) {
            searchDate = LocalDate.now();
        }

        String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String searchStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        org.springframework.data.jpa.domain.Specification<Appointment> spec =
                AppointmentSpecifications.searchAppointmentsForReceptionist(searchKeyword, searchDate, searchStatus);

        Page<Appointment> page = appointmentRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::mapToResponse));
    }

    @Override
    public java.util.List<AppointmentResponse> getDoctorTodayAppointments(Long userId) {
        Doctor doctor = doctorRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Bác sĩ không tồn tại cho người dùng này."));

        LocalDate today = LocalDate.now();
        java.util.List<Appointment> appointments = appointmentRepository.findDoctorTodayAppointments(doctor.getDoctorId(), today);
        return appointments.stream()
                .map(this::mapToResponse)
                .toList();
    }
}
