package com.clinicmanagement.invoice;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.constants.BillingConstants.AppointmentStatus;
import com.clinicmanagement.common.constants.BillingConstants.InvoiceStatus;
import com.clinicmanagement.common.constants.BillingConstants.PaymentStatus;
import com.clinicmanagement.common.constants.BillingConstants.PaymentType;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.invoice.dto.CreateInvoiceRequest;
import com.clinicmanagement.invoice.dto.InvoiceDetailResponse;
import com.clinicmanagement.invoice.dto.UpdateInvoiceRequest;
import com.clinicmanagement.invoice.dto.InvoiceResponse;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.user.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.clinicmanagement.consultation.ConsultationSession;
import com.clinicmanagement.consultation.ConsultationSessionRepository;
import com.clinicmanagement.medicalservice.MedicalService;
import com.clinicmanagement.medicalservice.MedicalServiceRepository;
import com.clinicmanagement.labrequest.LabRequest;
import com.clinicmanagement.labrequest.LabRequestRepository;
import com.clinicmanagement.prescription.Prescription;
import com.clinicmanagement.prescription.PrescriptionRepository;
import com.clinicmanagement.appointment.Appointment;
import com.clinicmanagement.appointment.AppointmentRepository;
import com.clinicmanagement.user.UserRepository;
import com.clinicmanagement.inventory.InventoryService;
import com.clinicmanagement.inventory.MedicineBatchRepository;
import com.clinicmanagement.payment.Payment;
import com.clinicmanagement.payment.PaymentRepository;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PatientRepository patientRepository;
    private final InventoryService inventoryService;
    private final ConsultationSessionRepository consultationSessionRepository;
    private final MedicalServiceRepository medicalServiceRepository;
    private final LabRequestRepository labRequestRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<InvoiceResponse> getAll(Long patientId, Long appointmentId, String status, Pageable pageable) {
        Specification<Invoice> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (patientId != null) {
                predicates.add(cb.equal(root.get("patient").get("patientId"), patientId));
            }
            if (appointmentId != null) {
                predicates.add(cb.equal(root.get("appointmentId"), appointmentId));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<InvoiceResponse> page = invoiceRepository.findAll(spec, pageable)
                .map(invoice -> InvoiceResponse.from(invoice, paidAmountFor(invoice)));
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    @Override
    public InvoiceDetailResponse getById(Long id) {
        Invoice invoice = findOrThrow(id);
        return InvoiceDetailResponse.from(invoice, paidAmountFor(invoice));
    }

    @Transactional
    @Override
    public InvoiceResponse create(CreateInvoiceRequest request, User currentUser) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân với ID: " + request.patientId()));

        Invoice invoice = new Invoice();
        invoice.setInvoiceCode(nextInvoiceCode());
        invoice.setPatient(patient);
        invoice.setAppointmentId(request.appointmentId());
        invoice.setCreatedBy(currentUser);
        invoice.setStatus(InvoiceStatus.UNPAID);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();

        for (var itemReq : request.items()) {
            if ("MEDICINE".equalsIgnoreCase(itemReq.itemType()) && itemReq.referenceId() != null) {
                inventoryService.checkStockAvailability(itemReq.referenceId(), itemReq.quantity());
            }

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setItemType(itemReq.itemType());
            item.setReferenceId(itemReq.referenceId());
            item.setItemName(itemReq.itemName());
            item.setQuantity(itemReq.quantity());
            item.setUnitPrice(itemReq.unitPrice());
            
            BigDecimal itemTotal = itemReq.unitPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            item.setTotalPrice(itemTotal);
            totalAmount = totalAmount.add(itemTotal);

            items.add(item);
        }

        BigDecimal discount = request.discountAmount() != null ? request.discountAmount() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Số tiền giảm giá không được nhỏ hơn 0");
        }
        if (discount.compareTo(totalAmount) > 0) {
            throw new BusinessException("Số tiền giảm giá không được lớn hơn tổng tiền hóa đơn");
        }

        invoice.setTotalAmount(totalAmount);
        invoice.setDiscountAmount(discount);
        invoice.setFinalAmount(totalAmount.subtract(discount));
        invoice.setItems(items);

        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceResponse.from(saved, paidAmountFor(saved));
    }

    @Transactional
    @Override
    public InvoiceResponse update(Long id, UpdateInvoiceRequest request) {
        Invoice invoice = findOrThrow(id);
        if (!InvoiceStatus.UNPAID.equals(invoice.getStatus())) {
            throw new BusinessException("Chỉ có thể cập nhật hóa đơn ở trạng thái UNPAID");
        }

        invoiceItemRepository.deleteAllByInvoice(invoice);
        invoice.getItems().clear();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();

        for (var itemReq : request.items()) {
            if ("MEDICINE".equalsIgnoreCase(itemReq.itemType()) && itemReq.referenceId() != null) {
                inventoryService.checkStockAvailability(itemReq.referenceId(), itemReq.quantity());
            }

            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setItemType(itemReq.itemType());
            item.setReferenceId(itemReq.referenceId());
            item.setItemName(itemReq.itemName());
            item.setQuantity(itemReq.quantity());
            item.setUnitPrice(itemReq.unitPrice());

            BigDecimal itemTotal = itemReq.unitPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            item.setTotalPrice(itemTotal);
            totalAmount = totalAmount.add(itemTotal);

            items.add(item);
        }

        BigDecimal discount = request.discountAmount() != null ? request.discountAmount() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Số tiền giảm giá không được nhỏ hơn 0");
        }
        if (discount.compareTo(totalAmount) > 0) {
            throw new BusinessException("Số tiền giảm giá không được lớn hơn tổng tiền hóa đơn");
        }

        invoice.setTotalAmount(totalAmount);
        invoice.setDiscountAmount(discount);
        invoice.setFinalAmount(totalAmount.subtract(discount));
        invoice.setItems(items);

        Invoice updated = invoiceRepository.save(invoice);
        return InvoiceResponse.from(updated, paidAmountFor(updated));
    }

    @Transactional
    @Override
    public InvoiceResponse cancel(Long id) {
        Invoice invoice = findOrThrow(id);
        if (InvoiceStatus.PAID.equals(invoice.getStatus())) {
            throw new BusinessException("Không thể hủy hóa đơn đã thanh toán");
        }
        if (InvoiceStatus.CANCELLED.equals(invoice.getStatus())) {
            throw new BusinessException("Hóa đơn đã được hủy trước đó");
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceResponse.from(saved, paidAmountFor(saved));
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<InvoiceResponse> getMyInvoices(User currentUser, Pageable pageable) {
        Patient patient = patientRepository.findByUserUserId(currentUser.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin bệnh nhân của tài khoản hiện tại"));
        Page<InvoiceResponse> page = invoiceRepository.findAllByPatientPatientId(patient.getPatientId(), pageable)
                .map(invoice -> InvoiceResponse.from(invoice, paidAmountFor(invoice)));
        return PageResponse.from(page);
    }

    private BigDecimal paidAmountFor(Invoice invoice) {
        if (invoice == null || invoice.getInvoiceId() == null) {
            return BigDecimal.ZERO;
        }
        return paymentRepository.sumPaidAmountByInvoiceId(invoice.getInvoiceId());
    }

    private Invoice findOrThrow(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + id));
    }

    private String nextInvoiceCode() {
        return "INV-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    @Override
    public InvoiceResponse generateFromConsultation(Long consultationId) {
        ConsultationSession session = consultationSessionRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên khám"));
        java.util.Optional<Invoice> existingInvoice = invoiceRepository.findByAppointmentId(session.getAppointmentId());
        if (existingInvoice.isPresent()) {
            Invoice invoice = existingInvoice.get();
            return InvoiceResponse.from(invoice, paidAmountFor(invoice));
        }

        Patient patient = patientRepository.findById(session.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân"));

        Appointment appointment = appointmentRepository.findById(session.getAppointmentId()).orElse(null);

        MedicalService consultationService = medicalServiceRepository.findAll().stream()
                .filter(s -> "CONSULTATION".equals(s.getServiceType()) && "ACTIVE".equals(s.getStatus()))
                .findFirst()
                .orElse(null);

        BigDecimal consultationFee = appointment != null && appointment.getDepositAmount() != null
                && appointment.getDepositAmount().compareTo(BigDecimal.ZERO) > 0
                ? appointment.getDepositAmount()
                : (consultationService != null ? consultationService.getPrice() : new BigDecimal("50000"));
        String consultationName = consultationService != null ? consultationService.getServiceName() : "Phí khám bệnh";

        Invoice invoice = new Invoice();
        invoice.setInvoiceCode(nextInvoiceCode());
        invoice.setPatient(patient);
        invoice.setAppointmentId(session.getAppointmentId());
        User creator = userRepository.findById(session.getDoctorId()).orElse(null);
        invoice.setCreatedBy(creator);
        invoice.setStatus(InvoiceStatus.UNPAID);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();

        // 1. Phí khám bệnh
        InvoiceItem consultationItem = new InvoiceItem();
        consultationItem.setInvoice(invoice);
        consultationItem.setItemType("CONSULTATION");
        consultationItem.setReferenceId(consultationService != null ? consultationService.getServiceId() : null);
        consultationItem.setItemName(consultationName);
        consultationItem.setQuantity(1);
        consultationItem.setUnitPrice(consultationFee);
        consultationItem.setTotalPrice(consultationFee);
        items.add(consultationItem);
        totalAmount = totalAmount.add(consultationFee);

        // 2. Phí xét nghiệm
        List<LabRequest> labRequests = labRequestRepository.findAll().stream()
                .filter(r -> r.getConsultationId() != null && r.getConsultationId().equals(consultationId))
                .toList();
        for (LabRequest req : labRequests) {
            if (req.getItems() != null) {
                for (var testItem : req.getItems()) {
                    var test = testItem.getLabTest();
                    InvoiceItem testInvoiceItem = new InvoiceItem();
                    testInvoiceItem.setInvoice(invoice);
                    testInvoiceItem.setItemType("LAB_TEST");
                    testInvoiceItem.setReferenceId(test.getLabTestId());
                    testInvoiceItem.setItemName(test.getTestName());
                    testInvoiceItem.setQuantity(1);
                    testInvoiceItem.setUnitPrice(test.getPrice());
                    testInvoiceItem.setTotalPrice(test.getPrice());
                    items.add(testInvoiceItem);
                    totalAmount = totalAmount.add(test.getPrice());
                }
            }
        }

        // 3. Phí thuốc
        List<Prescription> prescriptions = prescriptionRepository.findAll().stream()
                .filter(p -> p.getConsultationId() != null && p.getConsultationId().equals(consultationId))
                .toList();
        for (Prescription p : prescriptions) {
            if (p.getItems() != null) {
                for (var rxItem : p.getItems()) {
                    var medicine = rxItem.getMedicine();
                    BigDecimal medicinePrice = medicineBatchRepository.findUsableBatches(medicine.getMedicineId())
                            .stream().findFirst().map(b -> b.getSellingPrice()).orElse(BigDecimal.ZERO);

                    InvoiceItem medInvoiceItem = new InvoiceItem();
                    medInvoiceItem.setInvoice(invoice);
                    medInvoiceItem.setItemType("MEDICINE");
                    medInvoiceItem.setReferenceId(medicine.getMedicineId());
                    medInvoiceItem.setItemName(medicine.getMedicineName());
                    medInvoiceItem.setQuantity(rxItem.getQuantity());
                    medInvoiceItem.setUnitPrice(medicinePrice);
                    BigDecimal medTotal = medicinePrice.multiply(BigDecimal.valueOf(rxItem.getQuantity()));
                    medInvoiceItem.setTotalPrice(medTotal);
                    items.add(medInvoiceItem);
                    totalAmount = totalAmount.add(medTotal);
                }
            }
        }
        invoice.setTotalAmount(totalAmount);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setFinalAmount(totalAmount);
        invoice.setItems(items);

        Invoice saved = invoiceRepository.save(invoice);
        linkPaidDepositToInvoice(saved);
        refreshInvoiceAndAppointmentStatus(saved);
        Invoice refreshed = invoiceRepository.findById(saved.getInvoiceId()).orElse(saved);
        return InvoiceResponse.from(refreshed, paidAmountFor(refreshed));
    }

    private void linkPaidDepositToInvoice(Invoice invoice) {
        if (invoice.getAppointmentId() == null) {
            return;
        }
        paymentRepository.findFirstByAppointmentIdAndPaymentTypeOrderByPaymentIdDesc(
                        invoice.getAppointmentId(),
                        PaymentType.DEPOSIT
                )
                .filter(payment -> PaymentStatus.PAID.equals(payment.getStatus()))
                .ifPresent(payment -> {
                    payment.setInvoice(invoice);
                    paymentRepository.save(payment);
                });
    }

    private void refreshInvoiceAndAppointmentStatus(Invoice invoice) {
        BigDecimal paidAmount = paidAmountFor(invoice);
        if (paidAmount.compareTo(invoice.getFinalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            if (invoice.getPaidAt() == null) {
                invoice.setPaidAt(LocalDateTime.now());
            }
            invoiceRepository.save(invoice);
            updateAppointmentStatus(invoice.getAppointmentId(), AppointmentStatus.COMPLETED);
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            invoiceRepository.save(invoice);
            updateAppointmentStatus(invoice.getAppointmentId(), AppointmentStatus.PAYMENT_DUE);
        } else {
            invoice.setStatus(InvoiceStatus.UNPAID);
            invoiceRepository.save(invoice);
            updateAppointmentStatus(invoice.getAppointmentId(), AppointmentStatus.PAYMENT_DUE);
        }
    }

    private void updateAppointmentStatus(Long appointmentId, String status) {
        if (appointmentId == null) {
            return;
        }
        appointmentRepository.findById(appointmentId).ifPresent(appointment -> {
            if (!AppointmentStatus.CANCELLED.equals(appointment.getStatus())
                    && !AppointmentStatus.NO_SHOW.equals(appointment.getStatus())) {
                appointment.setStatus(status);
                appointmentRepository.save(appointment);
            }
        });
    }
}

