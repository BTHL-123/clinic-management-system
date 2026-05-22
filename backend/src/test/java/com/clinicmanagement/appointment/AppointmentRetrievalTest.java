package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AppointmentRetrievalTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private DoctorScheduleRepository doctorScheduleRepository;

    private Patient savedPatient;
    private User savedUser;
    private Doctor savedDoctor;
    private Department savedDepartment;
    private TimeSlot upcomingSlot;
    private TimeSlot pastSlot;
    private Appointment upcomingAppointment;
    private Appointment pastAppointment;

    @BeforeEach
    void setUp() {
        String uniqueSuffix = String.valueOf(System.nanoTime());

        User user = new User();
        user.setEmail("patient_" + uniqueSuffix + "@example.com");
        user.setPasswordHash("password");
        user.setFullName("Test Patient");
        user.setStatus("ACTIVE");
        savedUser = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(savedUser);
        patient.setPatientCode("PAT_" + uniqueSuffix);
        patient.setFullName("Test Patient");
        patient.setGender("MALE");
        patient.setDateOfBirth(LocalDate.of(1995, 5, 5));
        patient.setPhone("09" + uniqueSuffix.substring(uniqueSuffix.length() - 8));
        patient.setEmail(user.getEmail());
        savedPatient = patientRepository.save(patient);

        savedDoctor = doctorRepository.findAll().stream().findFirst().orElseGet(() -> {
            Department dept = new Department();
            dept.setDepartmentName("Cardiology_" + uniqueSuffix);
            dept.setDescription("Cardiology department");
            dept.setStatus("ACTIVE");
            savedDepartment = departmentRepository.save(dept);

            User doctorUser = new User();
            doctorUser.setEmail("doctor_" + uniqueSuffix + "@example.com");
            doctorUser.setPasswordHash("password");
            doctorUser.setFullName("Test Doctor");
            doctorUser.setStatus("ACTIVE");
            userRepository.save(doctorUser);

            Doctor doc = new Doctor();
            doc.setUser(doctorUser);
            doc.setDepartment(savedDepartment);
            doc.setDoctorCode("DOC_" + uniqueSuffix);
            doc.setConsultationFee(new BigDecimal("150000.00"));
            doc.setStatus("ACTIVE");
            return doctorRepository.save(doc);
        });

        savedDepartment = departmentRepository.findById(savedDoctor.getDepartment() != null ? savedDoctor.getDepartment().getDepartmentId() : null)
                .orElseGet(() -> {
                    Department dept = new Department();
                    dept.setDepartmentName("Department_" + uniqueSuffix);
                    dept.setStatus("ACTIVE");
                    return departmentRepository.save(dept);
                });

        DoctorSchedule sched1 = new DoctorSchedule();
        sched1.setDoctorId(savedDoctor.getDoctorId());
        sched1.setWorkDate(LocalDate.now().plusDays(2));
        sched1.setStartTime(LocalTime.of(9, 0));
        sched1.setEndTime(LocalTime.of(17, 0));
        sched1.setStatus("AVAILABLE");
        doctorScheduleRepository.save(sched1);

        upcomingSlot = new TimeSlot();
        upcomingSlot.setDoctorSchedule(sched1);
        upcomingSlot.setStartTime(LocalTime.of(10, 0));
        upcomingSlot.setEndTime(LocalTime.of(10, 15));
        upcomingSlot.setStatus("BOOKED");
        timeSlotRepository.save(upcomingSlot);

        upcomingAppointment = new Appointment();
        upcomingAppointment.setAppointmentCode("APT_U_" + uniqueSuffix);
        upcomingAppointment.setPatient(savedPatient);
        upcomingAppointment.setDoctor(savedDoctor);
        upcomingAppointment.setDepartment(savedDepartment);
        upcomingAppointment.setTimeSlot(upcomingSlot);
        upcomingAppointment.setAppointmentDate(sched1.getWorkDate());
        upcomingAppointment.setStartTime(upcomingSlot.getStartTime());
        upcomingAppointment.setEndTime(upcomingSlot.getEndTime());
        upcomingAppointment.setBookingType("ONLINE");
        upcomingAppointment.setReasonForVisit("Fever");
        upcomingAppointment.setStatus("CONFIRMED");
        upcomingAppointment.setDepositAmount(BigDecimal.ZERO);
        upcomingAppointment.setCreatedBy(savedUser.getUserId());
        upcomingAppointment = appointmentRepository.save(upcomingAppointment);

        DoctorSchedule sched2 = new DoctorSchedule();
        sched2.setDoctorId(savedDoctor.getDoctorId());
        sched2.setWorkDate(LocalDate.now().minusDays(2));
        sched2.setStartTime(LocalTime.of(9, 0));
        sched2.setEndTime(LocalTime.of(17, 0));
        sched2.setStatus("AVAILABLE");
        doctorScheduleRepository.save(sched2);

        pastSlot = new TimeSlot();
        pastSlot.setDoctorSchedule(sched2);
        pastSlot.setStartTime(LocalTime.of(14, 0));
        pastSlot.setEndTime(LocalTime.of(14, 15));
        pastSlot.setStatus("BOOKED");
        timeSlotRepository.save(pastSlot);

        pastAppointment = new Appointment();
        pastAppointment.setAppointmentCode("APT_P_" + uniqueSuffix);
        pastAppointment.setPatient(savedPatient);
        pastAppointment.setDoctor(savedDoctor);
        pastAppointment.setDepartment(savedDepartment);
        pastAppointment.setTimeSlot(pastSlot);
        pastAppointment.setAppointmentDate(sched2.getWorkDate());
        pastAppointment.setStartTime(pastSlot.getStartTime());
        pastAppointment.setEndTime(pastSlot.getEndTime());
        pastAppointment.setBookingType("ONLINE");
        pastAppointment.setReasonForVisit("Checkup");
        pastAppointment.setStatus("COMPLETED");
        pastAppointment.setDepositAmount(BigDecimal.ZERO);
        pastAppointment.setCreatedBy(savedUser.getUserId());
        pastAppointment = appointmentRepository.save(pastAppointment);
    }

    @Test
    void testGetAppointments() {
        Pageable pageable = PageRequest.of(0, 10);
        PageResponse<AppointmentResponse> result = appointmentService.getAppointments(
                savedPatient.getPatientId(), savedDoctor.getDoctorId(), null, null, pageable
        );
        assertNotNull(result);
        assertTrue(result.content().size() >= 2);
    }

    @Test
    void testGetAppointmentById() {
        AppointmentResponse result = appointmentService.getAppointmentById(upcomingAppointment.getId());
        assertNotNull(result);
        assertEquals(upcomingAppointment.getAppointmentCode(), result.appointmentCode());
        assertEquals(savedPatient.getPatientId(), result.patientId());
    }

    @Test
    void testGetMyAppointmentsUpcoming() {
        Pageable pageable = PageRequest.of(0, 10);
        PageResponse<AppointmentResponse> result = appointmentService.getMyAppointments(
                savedUser.getUserId(), true, pageable
        );
        assertNotNull(result);
        assertEquals(1, result.content().size());
        assertEquals(upcomingAppointment.getAppointmentCode(), result.content().get(0).appointmentCode());
    }

    @Test
    void testGetMyAppointmentsPast() {
        Pageable pageable = PageRequest.of(0, 10);
        PageResponse<AppointmentResponse> result = appointmentService.getMyAppointments(
                savedUser.getUserId(), false, pageable
        );
        assertNotNull(result);
        assertEquals(1, result.content().size());
        assertEquals(pastAppointment.getAppointmentCode(), result.content().get(0).appointmentCode());
    }
}
