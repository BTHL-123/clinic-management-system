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
import com.clinicmanagement.email.EmailService;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import com.clinicmanagement.notification.NotificationService;
import com.clinicmanagement.review.ReviewRepository;
import com.clinicmanagement.payment.Payment;
import com.clinicmanagement.payment.PaymentRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(readOnly = true)
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final QueueTicketRepository queueTicketRepository;
    private final NotificationService notificationService;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final ConsultationSessionRepository consultationSessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AppointmentServiceImpl(
            AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            UserRepository userRepository,
            QueueTicketRepository queueTicketRepository,
            NotificationService notificationService,
            ReviewRepository reviewRepository,
            PaymentRepository paymentRepository,
            EmailService emailService,
            ConsultationSessionRepository consultationSessionRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.queueTicketRepository = queueTicketRepository;
        this.notificationService = notificationService;
        this.reviewRepository = reviewRepository;
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
        this.consultationSessionRepository = consultationSessionRepository;
        this.messagingTemplate = messagingTemplate;
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
    public AppointmentResponse getAppointmentBySlotId(Long slotId, Long userId, boolean isPrivileged) {
        Appointment appointment = appointmentRepository.findActiveByTimeSlotId(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("No active appointment found for slot id: " + slotId));

        if (!isPrivileged) {
            boolean isOwner = (appointment.getPatient() != null && appointment.getPatient().getUser() != null &&
                    appointment.getPatient().getUser().getUserId().equals(userId)) ||
                    (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null &&
                    appointment.getDoctor().getUser().getUserId().equals(userId));
            if (!isOwner) {
                throw new BusinessException("You do not have permission to view this appointment");
            }
        }

        return mapToResponse(appointment);
    }

    @Override
    public PageResponse<AppointmentResponse> getMyAppointments(
            Long userId,
            String keyword,
            Long doctorId,
            Long departmentId,
            Boolean upcoming,
            Pageable pageable
    ) {
        LocalDate currentDate = LocalDate.now();
        Page<Appointment> appointments = appointmentRepository.findMyFilteredAppointments(
                userId, keyword, doctorId, departmentId, upcoming, currentDate, pageable
        );
        return PageResponse.from(appointments.map(this::mapToResponse));
    }

    private AppointmentResponse mapToResponse(Appointment app) {
        Integer queueNumber = app.getQueueTicket() != null ? app.getQueueTicket().getQueueNumber() : null;
        String queueStatus = app.getQueueTicket() != null ? app.getQueueTicket().getStatus() : null;
        String patientPhone = app.getPatient() != null ? app.getPatient().getPhone() : null;
        Boolean hasReviewed = "COMPLETED".equals(app.getStatus()) && reviewRepository.existsByAppointmentAppointmentId(app.getAppointmentId());
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
                queueStatus,
                hasReviewed
        );
    }

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(BookAppointmentRequest request, Long userId) {
        // Issue #3: Dùng pessimistic write lock để tránh race condition
        TimeSlot slot = timeSlotRepository.findByIdWithPessimisticLock(request.slotId())
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám không tồn tại với id: " + request.slotId()));

        // Issue #4: Expired slot protection
        LocalDate workDate = slot.getDoctorSchedule().getWorkDate();
        LocalDate today = LocalDate.now();
        if (workDate.isBefore(today) || (workDate.equals(today) && slot.getEndTime().isBefore(LocalTime.now()))) {
            throw new BusinessException("Ca khám này đã qua thời gian, không thể đặt.");
        }

        // Issue #2: Kiểm tra slot hợp lệ để book
        String slotStatus = slot.getStatus();
        if ("BOOKED".equals(slotStatus)) {
            throw new BusinessException("Ca khám này đã được đặt.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với id: " + userId));

        Patient patient;
        if (request.patientId() != null) {
            patient = patientRepository.findById(request.patientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh nhân"));
            if (patient.getUser() == null || !patient.getUser().getUserId().equals(userId)) {
                throw new BusinessException("Hồ sơ bệnh nhân không thuộc tài khoản của bạn");
            }
        } else {
            java.util.List<Patient> patients = patientRepository.findListByUserUserId(userId);
            if (!patients.isEmpty()) {
                patient = patients.stream().filter(p -> "SELF".equals(p.getRelationshipToUser())).findFirst().orElse(patients.get(0));
            } else {
                Patient p = new Patient();
                p.setUser(user);
                p.setPatientCode("PAT" + System.currentTimeMillis());
                p.setFullName(user.getFullName());
                p.setEmail(user.getEmail());
                p.setPhone(user.getPhone() != null ? user.getPhone() : "0900000000");
                p.setGender("OTHER");
                p.setRelationshipToUser("SELF");
                patient = patientRepository.save(p);
            }
        }

        // Kiểm tra xem bệnh nhân có bị trùng lịch hẹn với ca khám đang đặt không
        boolean hasOverlap = appointmentRepository.existsOverlappingAppointmentForPatient(
                patient.getPatientId(),
                slot.getDoctorSchedule().getWorkDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                null // Booking mới, không có ID để exclude
        );
        if (hasOverlap) {
            throw new BusinessException("Bệnh nhân đã có một lịch hẹn khác trong khoảng thời gian này. Vui lòng chọn ca khám khác.");
        }

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

        // Tạo Payment DEPOSIT/PENDING
        Payment payment = new Payment();
        payment.setAppointmentId(savedApp.getAppointmentId());
        // Generate a random payment code
        payment.setPaymentCode("PAY-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setPaymentType("DEPOSIT");
        payment.setPaymentMethod(request.paymentMethod() != null ? request.paymentMethod() : "CASH");
        payment.setAmount(doctor.getConsultationFee());
        payment.setStatus("PENDING");
        payment.setPaidBy(user);
        paymentRepository.save(payment);

        try {
            notificationService.createNotification(
                    userId,
                    "Đặt lịch khám thành công",
                    "Hồ sơ của " + patient.getFullName() + " (Mã: " + savedApp.getAppointmentCode() + ") với bác sĩ " + doctor.getUser().getFullName() + " vào ngày " + savedApp.getAppointmentDate() + " lúc " + savedApp.getStartTime() + " đã được xác nhận thành công.",
                    "APPOINTMENT"
            );

            if (doctor.getUser() != null) {
                notificationService.createNotification(
                        doctor.getUser().getUserId(),
                        "Lịch hẹn mới",
                        "Bệnh nhân " + patient.getFullName() + " đã đặt một lịch hẹn (Mã: " + savedApp.getAppointmentCode() + ") với bạn vào ngày " + savedApp.getAppointmentDate() + " lúc " + savedApp.getStartTime() + ".",
                        "APPOINTMENT"
                );
            }
            
            // Gửi email xác nhận
            emailService.sendBookingConfirmation(savedApp);

        } catch (Exception e) {
            log.error("Failed to process notifications/emails for appointment booking", e);
        }

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

        // Xử lý Payment khi hủy lịch
        java.util.List<Payment> payments = paymentRepository.findByAppointmentId(appointmentId);
        for (Payment p : payments) {
            if ("PENDING".equals(p.getStatus())) {
                p.setStatus("CANCELLED");
                paymentRepository.save(p);
            }
        }

        // 5. Giải phóng slot — đặt lại thành AVAILABLE
        if (appointment.getTimeSlot() != null) {
            TimeSlot slot = appointment.getTimeSlot();
            slot.setStatus("AVAILABLE");
            slot.setLockedByPatientId(null);
            slot.setLockedUntil(null);
            timeSlotRepository.save(slot);
        }

        try {
            if (appointment.getPatient() != null && appointment.getPatient().getUser() != null) {
                notificationService.createNotification(
                        appointment.getPatient().getUser().getUserId(),
                        "Lịch hẹn đã bị hủy",
                        "Lịch hẹn mã " + appointment.getAppointmentCode() + " với bác sĩ " + (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null ? appointment.getDoctor().getUser().getFullName() : "Bác sĩ") + " vào ngày " + appointment.getAppointmentDate() + " đã bị hủy. Lý do: " + cancellationReason,
                        "APPOINTMENT"
                );
            }
            if (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null) {
                notificationService.createNotification(
                        appointment.getDoctor().getUser().getUserId(),
                        "Lịch hẹn đã bị hủy",
                        "Lịch hẹn mã " + appointment.getAppointmentCode() + " của bệnh nhân " + (appointment.getPatient() != null ? appointment.getPatient().getFullName() : "") + " vào ngày " + appointment.getAppointmentDate() + " đã bị hủy. Lý do: " + cancellationReason,
                        "APPOINTMENT"
                );
            }
        } catch (Exception e) {
            System.err.println("Không thể tạo thông báo hủy lịch: " + e.getMessage());
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

        // Kiểm tra trùng lịch của bệnh nhân (ngoại trừ lịch hẹn hiện tại đang dời)
        boolean hasOverlap = appointmentRepository.existsOverlappingAppointmentForPatient(
                appointment.getPatient().getPatientId(),
                newSlot.getDoctorSchedule().getWorkDate(),
                newSlot.getStartTime(),
                newSlot.getEndTime(),
                appointment.getAppointmentId()
        );
        if (hasOverlap) {
            throw new BusinessException("Bệnh nhân đã có một lịch hẹn khác trong khoảng thời gian này. Vui lòng chọn ca khám khác.");
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

        Appointment savedApp = appointmentRepository.save(appointment);

        try {
            if (savedApp.getPatient() != null && savedApp.getPatient().getUser() != null) {
                notificationService.createNotification(
                        savedApp.getPatient().getUser().getUserId(),
                        "Lịch hẹn đã được dời lịch",
                        "Lịch hẹn mã " + savedApp.getAppointmentCode() + " với bác sĩ " + (savedApp.getDoctor() != null && savedApp.getDoctor().getUser() != null ? savedApp.getDoctor().getUser().getFullName() : "Bác sĩ") + " đã được dời lịch thành công sang ngày " + savedApp.getAppointmentDate() + " lúc " + savedApp.getStartTime() + ".",
                        "APPOINTMENT"
                );
            }
            if (savedApp.getDoctor() != null && savedApp.getDoctor().getUser() != null) {
                notificationService.createNotification(
                        savedApp.getDoctor().getUser().getUserId(),
                        "Lịch hẹn đã được dời lịch",
                        "Lịch hẹn mã " + savedApp.getAppointmentCode() + " của bệnh nhân " + (savedApp.getPatient() != null ? savedApp.getPatient().getFullName() : "") + " đã được dời lịch sang ngày " + savedApp.getAppointmentDate() + " lúc " + savedApp.getStartTime() + ".",
                        "APPOINTMENT"
                );
            }
        } catch (Exception e) {
            System.err.println("Không thể tạo thông báo dời lịch: " + e.getMessage());
        }

        return mapToResponse(savedApp);
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

        LocalTime startTime = appointment.getStartTime();
        LocalTime allowedCheckInTime = startTime.minusMinutes(60);
        LocalTime now = LocalTime.now();

        if (now.isBefore(allowedCheckInTime)) {
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
            throw new BusinessException("Bệnh nhân có lịch hẹn lúc " + startTime.format(formatter) +
                    ". Hệ thống chỉ cho phép nhận bệnh trước 60 phút (từ " + allowedCheckInTime.format(formatter) +
                    "). Vui lòng mời bệnh nhân nghỉ ngơi tại sảnh chờ hoặc quay lại sau.");
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

        try {
            QueueTicket finalTicket = saved.getQueueTicket();
            int qNum = finalTicket != null ? finalTicket.getQueueNumber() : 0;
            
            if (saved.getPatient() != null && saved.getPatient().getUser() != null) {
                notificationService.createNotification(
                        saved.getPatient().getUser().getUserId(),
                        "Check-in thành công",
                        "Bạn đã check-in thành công lịch hẹn mã " + saved.getAppointmentCode() + ". Số thứ tự khám của bạn là #" + qNum + ". Vui lòng đợi đến lượt khám tại khoa " + saved.getDepartment().getDepartmentName() + ".",
                        "APPOINTMENT"
                );
            }
            if (saved.getDoctor() != null && saved.getDoctor().getUser() != null) {
                notificationService.createNotification(
                        saved.getDoctor().getUser().getUserId(),
                        "Bệnh nhân mới check-in",
                        "Bệnh nhân " + saved.getPatient().getFullName() + " đã check-in cho lịch hẹn mã " + saved.getAppointmentCode() + " và đang đợi khám (STT #" + qNum + ").",
                        "APPOINTMENT"
                );
            }
        } catch (Exception e) {
            System.err.println("Không thể tạo thông báo check-in: " + e.getMessage());
        }

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

    @Override
    @Transactional
    public AppointmentResponse markNoShow(Long appointmentId, String note, Long receptionistId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại với ID: " + appointmentId));

        String status = appointment.getStatus();
        if ("CANCELLED".equals(status)) {
            throw new BusinessException("Không thể đánh dấu No Show lịch hẹn đã hủy.");
        }
        if ("COMPLETED".equals(status)) {
            throw new BusinessException("Không thể đánh dấu No Show lịch hẹn đã hoàn thành.");
        }
        if ("CHECKED_IN".equals(status)) {
            throw new BusinessException("Không thể đánh dấu No Show lịch hẹn đã check-in.");
        }
        if ("NO_SHOW".equals(status)) {
            throw new BusinessException("Lịch hẹn này đã được đánh dấu No Show trước đó.");
        }

        appointment.setStatus("NO_SHOW");
        appointment.setNoShowReason(note);
        appointment.setCancelledAt(LocalDateTime.now());
        appointment.setCancelledBy(receptionistId);

        // Free the time slot so it can be rebooked
        if (appointment.getTimeSlot() != null) {
            TimeSlot slot = appointment.getTimeSlot();
            slot.setStatus("AVAILABLE");
            slot.setLockedByPatientId(null);
            slot.setLockedUntil(null);
            timeSlotRepository.save(slot);
        }

        // Fix orphan data: cancel queue ticket if it exists (e.g. walk-in appointments)
        queueTicketRepository.findByAppointment(appointment).ifPresent(ticket -> {
            ticket.setStatus("CANCELLED");
            queueTicketRepository.save(ticket);
        });

        Appointment saved = appointmentRepository.save(appointment);

        try {
            if (saved.getPatient() != null && saved.getPatient().getUser() != null) {
                notificationService.createNotification(
                        saved.getPatient().getUser().getUserId(),
                        "Lịch hẹn bị đánh dấu No Show",
                        "Lịch hẹn mã " + saved.getAppointmentCode() + " của bạn đã bị đánh dấu là bệnh nhân không đến khám (No Show).",
                        "APPOINTMENT"
                );
            }
        } catch (Exception e) {
            System.err.println("Không thể tạo thông báo No Show: " + e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse selfCheckIn(Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch hẹn không tồn tại với ID: " + appointmentId));

        // Verify the appointment belongs to this patient's user account
        if (appointment.getPatient() == null ||
                appointment.getPatient().getUser() == null ||
                !appointment.getPatient().getUser().getUserId().equals(userId)) {
            throw new BusinessException("Bạn không có quyền check-in lịch hẹn này.");
        }

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

        LocalTime startTime = appointment.getStartTime();
        LocalTime allowedCheckInTime = startTime.minusMinutes(60);
        LocalTime now = LocalTime.now();
        if (now.isBefore(allowedCheckInTime)) {
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
            throw new BusinessException("Bạn có lịch hẹn lúc " + startTime.format(formatter) +
                    ". Hệ thống chỉ cho phép check-in trước 60 phút (từ " + allowedCheckInTime.format(formatter) + ").");
        }

        appointment.setStatus("CHECKED_IN");
        appointment.setCheckedInAt(LocalDateTime.now());
        appointment.setCheckedInBy(userId);

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

        try {
            QueueTicket finalTicket = saved.getQueueTicket();
            int qNum = finalTicket != null ? finalTicket.getQueueNumber() : 0;
            if (saved.getPatient() != null && saved.getPatient().getUser() != null) {
                notificationService.createNotification(
                        saved.getPatient().getUser().getUserId(),
                        "Check-in thành công",
                        "Bạn đã check-in thành công lịch hẹn mã " + saved.getAppointmentCode() +
                                ". Số thứ tự khám của bạn là #" + qNum +
                                ". Vui lòng đợi đến lượt khám tại khoa " + saved.getDepartment().getDepartmentName() + ".",
                        "APPOINTMENT"
                );
            }
        } catch (Exception e) {
            System.err.println("Không thể tạo thông báo self check-in: " + e.getMessage());
        }

        return mapToResponse(saved);
    }
}
