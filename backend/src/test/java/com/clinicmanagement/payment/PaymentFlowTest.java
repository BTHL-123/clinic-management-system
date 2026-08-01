package com.clinicmanagement.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.clinicmanagement.appointment.Appointment;
import com.clinicmanagement.appointment.AppointmentCancellationActor;
import com.clinicmanagement.appointment.AppointmentRepository;
import com.clinicmanagement.appointment.AppointmentService;
import com.clinicmanagement.appointment.DoctorSchedule;
import com.clinicmanagement.appointment.DoctorScheduleRepository;
import com.clinicmanagement.appointment.TimeSlot;
import com.clinicmanagement.appointment.TimeSlotRepository;
import com.clinicmanagement.appointment.dto.BookAppointmentRequest;
import com.clinicmanagement.appointment.dto.BookAppointmentResponse;
import com.clinicmanagement.appointment.dto.CancelAppointmentRequest;
import com.clinicmanagement.common.constants.BillingConstants.AppointmentStatus;
import com.clinicmanagement.common.constants.BillingConstants.PaymentStatus;
import com.clinicmanagement.common.constants.BillingConstants.PaymentType;
import com.clinicmanagement.common.constants.BillingConstants.RefundStatus;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.department.Department;
import com.clinicmanagement.department.DepartmentRepository;
import com.clinicmanagement.doctor.Doctor;
import com.clinicmanagement.doctor.DoctorRepository;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.payment.dto.PaymentCallbackRequest;
import com.clinicmanagement.payment.dto.CreateRefundRequest;
import com.clinicmanagement.payment.dto.RefundResponse;
import com.clinicmanagement.user.User;
import com.clinicmanagement.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PaymentFlowTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentServiceImpl paymentServiceImpl;

    @Autowired
    private RefundService refundService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DoctorScheduleRepository doctorScheduleRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    private User patientUser;
    private User doctorUser;
    private Patient patient;
    private Doctor doctor;
    private TimeSlot slot;

    @BeforeEach
    void setUp() {
        String suffix = String.valueOf(System.nanoTime());

        patientUser = new User();
        patientUser.setEmail("pay_patient_" + suffix + "@example.com");
        patientUser.setPasswordHash("password");
        patientUser.setFullName("Payment Patient");
        patientUser.setStatus("ACTIVE");
        patientUser = userRepository.save(patientUser);

        patient = new Patient();
        patient.setUser(patientUser);
        patient.setPatientCode("PAY_PAT_" + suffix);
        patient.setFullName("Payment Patient");
        patient.setGender("MALE");
        patient.setRelationshipToUser("SELF");
        patient.setDateOfBirth(LocalDate.of(1995, 1, 1));
        patient.setPhone("09" + suffix.substring(suffix.length() - 8));
        patient.setEmail(patientUser.getEmail());
        patient = patientRepository.save(patient);

        Department department = new Department();
        department.setDepartmentName("Payment Dept " + suffix);
        department.setStatus("ACTIVE");
        department = departmentRepository.save(department);

        doctorUser = new User();
        doctorUser.setEmail("pay_doctor_" + suffix + "@example.com");
        doctorUser.setPasswordHash("password");
        doctorUser.setFullName("Payment Doctor");
        doctorUser.setStatus("ACTIVE");
        doctorUser = userRepository.save(doctorUser);

        doctor = new Doctor();
        doctor.setUser(doctorUser);
        doctor.setDepartment(department);
        doctor.setDoctorCode("PAY_DOC_" + suffix);
        doctor.setConsultationFee(new BigDecimal("150000.00"));
        doctor.setStatus("ACTIVE");
        doctor = doctorRepository.save(doctor);

        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setDoctorId(doctor.getDoctorId());
        schedule.setWorkDate(LocalDate.now().plusDays(3));
        schedule.setStartTime(LocalTime.of(9, 0));
        schedule.setEndTime(LocalTime.of(17, 0));
        schedule.setStatus("AVAILABLE");
        schedule = doctorScheduleRepository.save(schedule);

        slot = new TimeSlot();
        slot.setDoctorSchedule(schedule);
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(10, 30));
        slot.setStatus("AVAILABLE");
        slot = timeSlotRepository.save(slot);
    }

    @Test
    void bookAppointmentCreatesPendingDepositAndLocksSlot() {
        BookAppointmentResponse response = book();

        assertEquals(AppointmentStatus.PENDING_PAYMENT, response.appointment().status());
        assertEquals(PaymentStatus.PENDING, response.depositPayment().status());
        assertEquals(PaymentType.DEPOSIT, response.depositPayment().paymentType());
        assertEquals(new BigDecimal("150000.00"), response.amount());
        assertNotNull(response.paymentUrl());
        assertNotNull(response.expiresAt());

        TimeSlot refreshedSlot = timeSlotRepository.findById(slot.getId()).orElseThrow();
        assertEquals("LOCKED", refreshedSlot.getStatus());
        assertEquals(patient.getPatientId(), refreshedSlot.getLockedByPatientId());
    }

    @Test
    void paidDepositCallbackConfirmsAppointmentAndBooksSlot() {
        BookAppointmentResponse response = book();

        paymentService.processCallback(new PaymentCallbackRequest(
                "TX-OK",
                response.depositPayment().paymentCode(),
                PaymentStatus.PAID,
                response.amount()
        ));

        Appointment appointment = appointmentRepository.findById(response.appointment().appointmentId()).orElseThrow();
        TimeSlot refreshedSlot = timeSlotRepository.findById(slot.getId()).orElseThrow();
        Payment payment = paymentRepository.findById(response.depositPayment().paymentId()).orElseThrow();

        assertEquals(AppointmentStatus.CONFIRMED, appointment.getStatus());
        assertEquals("BOOKED", refreshedSlot.getStatus());
        assertEquals(PaymentStatus.PAID, payment.getStatus());
    }

    @Test
    void callbackWithWrongAmountIsRejected() {
        BookAppointmentResponse response = book();

        assertThrows(BusinessException.class, () -> paymentService.processCallback(new PaymentCallbackRequest(
                "TX-BAD",
                response.depositPayment().paymentCode(),
                PaymentStatus.PAID,
                new BigDecimal("1.00")
        )));
    }

    @Test
    void expiredDepositPaymentCancelsAppointmentAndReleasesSlot() {
        BookAppointmentResponse response = book();
        Payment payment = paymentRepository.findById(response.depositPayment().paymentId()).orElseThrow();
        payment.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        paymentRepository.save(payment);

        paymentServiceImpl.releaseExpiredDepositPayments();

        Appointment appointment = appointmentRepository.findById(response.appointment().appointmentId()).orElseThrow();
        TimeSlot refreshedSlot = timeSlotRepository.findById(slot.getId()).orElseThrow();
        Payment refreshedPayment = paymentRepository.findById(payment.getPaymentId()).orElseThrow();

        assertEquals(PaymentStatus.CANCELLED, refreshedPayment.getStatus());
        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
        assertEquals("AVAILABLE", refreshedSlot.getStatus());
    }

    @Test
    void patientCancellationAllowsManualRefundRequestWithBankDetails() {
        BookAppointmentResponse response = book();
        paymentService.processCallback(new PaymentCallbackRequest(
                "TX-REF",
                response.depositPayment().paymentCode(),
                PaymentStatus.PAID,
                response.amount()
        ));

        appointmentService.cancelAppointment(
                response.appointment().appointmentId(),
                new CancelAppointmentRequest("Patient cancellation", null, null, null),
                patientUser.getUserId(),
                AppointmentCancellationActor.PATIENT
        );

        Appointment appointment = appointmentRepository.findById(response.appointment().appointmentId()).orElseThrow();
        Payment payment = paymentRepository.findById(response.depositPayment().paymentId()).orElseThrow();
        TimeSlot refreshedSlot = timeSlotRepository.findById(slot.getId()).orElseThrow();

        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertEquals("AVAILABLE", refreshedSlot.getStatus());
        assertTrue(refundRepository.findAll().isEmpty());

        RefundResponse refund = refundService.requestRefund(
                new CreateRefundRequest(
                        payment.getPaymentId(),
                        response.amount(),
                        "Patient cancellation",
                        "BANK_TRANSFER",
                        "Vietcombank",
                        "0123456789",
                        "PAYMENT PATIENT"
                ),
                patientUser
        );

        List<Refund> refunds = refundRepository.findAll();
        assertEquals(1, refunds.size());
        assertEquals(refund.refundId(), refunds.get(0).getRefundId());
        assertEquals(response.amount(), refund.refundAmount());
        assertEquals(RefundStatus.PENDING, refund.status());
        assertEquals("Vietcombank", refund.bankName());
        assertEquals("0123456789", refund.bankAccountNumber());
        assertEquals("PAYMENT PATIENT", refund.accountHolderName());
    }

    @Test
    void doctorCancellationCreatesApprovedFullRefundForPaidDeposit() {
        BookAppointmentResponse response = book();
        paymentService.processCallback(new PaymentCallbackRequest(
                "TX-CLINIC-REF",
                response.depositPayment().paymentCode(),
                PaymentStatus.PAID,
                response.amount()
        ));

        appointmentService.cancelAppointment(
                response.appointment().appointmentId(),
                new CancelAppointmentRequest("Clinic cancellation", null, null, null),
                doctorUser.getUserId(),
                AppointmentCancellationActor.DOCTOR
        );

        List<Refund> refunds = refundRepository.findAll();
        assertEquals(1, refunds.size());
        assertEquals(response.amount(), refunds.get(0).getRefundAmount());
        assertEquals(RefundStatus.APPROVED, refunds.get(0).getStatus());
        assertEquals(doctorUser.getUserId(), refunds.get(0).getApprovedBy().getUserId());
    }

    @Test
    void clinicStaffCancellationCreatesApprovedFullRefundForPaidDeposit() {
        BookAppointmentResponse response = book();
        paymentService.processCallback(new PaymentCallbackRequest(
                "TX-STAFF-REF",
                response.depositPayment().paymentCode(),
                PaymentStatus.PAID,
                response.amount()
        ));

        User receptionistUser = new User();
        receptionistUser.setEmail("receptionist_" + System.nanoTime() + "@example.com");
        receptionistUser.setPasswordHash("password");
        receptionistUser.setFullName("Clinic Receptionist");
        receptionistUser.setStatus("ACTIVE");
        receptionistUser = userRepository.save(receptionistUser);

        appointmentService.cancelAppointment(
                response.appointment().appointmentId(),
                new CancelAppointmentRequest("Receptionist cancellation", null, null, null),
                receptionistUser.getUserId(),
                AppointmentCancellationActor.STAFF
        );

        List<Refund> refunds = refundRepository.findAll();
        assertEquals(1, refunds.size());
        assertEquals(response.amount(), refunds.get(0).getRefundAmount());
        assertEquals(RefundStatus.APPROVED, refunds.get(0).getStatus());
        assertEquals(receptionistUser.getUserId(), refunds.get(0).getApprovedBy().getUserId());
    }

    @Test
    void doctorCannotCancelAnotherDoctorsAppointment() {
        BookAppointmentResponse response = book();

        User anotherDoctorUser = new User();
        anotherDoctorUser.setEmail("other_doctor_" + System.nanoTime() + "@example.com");
        anotherDoctorUser.setPasswordHash("password");
        anotherDoctorUser.setFullName("Another Doctor");
        anotherDoctorUser.setStatus("ACTIVE");
        anotherDoctorUser = userRepository.save(anotherDoctorUser);

        User finalAnotherDoctorUser = anotherDoctorUser;
        BusinessException exception = assertThrows(BusinessException.class, () -> appointmentService.cancelAppointment(
                response.appointment().appointmentId(),
                new CancelAppointmentRequest("Not my appointment", null, null, null),
                finalAnotherDoctorUser.getUserId(),
                AppointmentCancellationActor.DOCTOR
        ));

        assertEquals("Bác sĩ chỉ có thể hủy lịch hẹn của chính mình.", exception.getMessage());
        assertTrue(refundRepository.findAll().isEmpty());
    }

    private BookAppointmentResponse book() {
        return appointmentService.bookAppointment(
                new BookAppointmentRequest(patient.getPatientId(), slot.getId(), "Checkup", "ONLINE"),
                patientUser.getUserId()
        );
    }
}
