package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.appointment.dto.BookAppointmentRequest;
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
import java.time.LocalTime;

@Service
@Transactional(readOnly = true)
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public AppointmentServiceImpl(
            AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            UserRepository userRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
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
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
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
                app.getDepositAmount()
        );
    }

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(BookAppointmentRequest request, Long userId) {
        TimeSlot slot = timeSlotRepository.findById(request.slotId())
                .orElseThrow(() -> new ResourceNotFoundException("Ca khám không tồn tại với id: " + request.slotId()));

        if ("BOOKED".equals(slot.getStatus())) {
            throw new BusinessException("Ca khám này đã được đặt.");
        }

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
}
