package com.clinicmanagement.invoice;

import com.clinicmanagement.common.dto.PageResponse;
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
                .map(InvoiceResponse::from);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    @Override
    public InvoiceDetailResponse getById(Long id) {
        Invoice invoice = findOrThrow(id);
        return InvoiceDetailResponse.from(invoice);
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
        invoice.setStatus("UNPAID");

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
        return InvoiceResponse.from(saved);
    }

    @Transactional
    @Override
    public InvoiceResponse update(Long id, UpdateInvoiceRequest request) {
        Invoice invoice = findOrThrow(id);
        if (!"UNPAID".equals(invoice.getStatus())) {
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
        return InvoiceResponse.from(updated);
    }

    @Transactional
    @Override
    public InvoiceResponse cancel(Long id) {
        Invoice invoice = findOrThrow(id);
        if ("PAID".equals(invoice.getStatus())) {
            throw new BusinessException("Không thể hủy hóa đơn đã thanh toán");
        }
        if ("CANCELLED".equals(invoice.getStatus())) {
            throw new BusinessException("Hóa đơn đã được hủy trước đó");
        }
        invoice.setStatus("CANCELLED");
        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceResponse.from(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<InvoiceResponse> getMyInvoices(User currentUser, Pageable pageable) {
        Patient patient = patientRepository.findByUserUserId(currentUser.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin bệnh nhân của tài khoản hiện tại"));
        Page<InvoiceResponse> page = invoiceRepository.findAllByPatientPatientId(patient.getPatientId(), pageable)
                .map(InvoiceResponse::from);
        return PageResponse.from(page);
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
        Patient patient = patientRepository.findById(session.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân"));

        MedicalService consultationService = medicalServiceRepository.findAll().stream()
                .filter(s -> "CONSULTATION".equals(s.getServiceType()) && "ACTIVE".equals(s.getStatus()))
                .findFirst()
                .orElse(null);

        BigDecimal consultationFee = consultationService != null ? consultationService.getPrice() : new BigDecimal("50000");
        String consultationName = consultationService != null ? consultationService.getServiceName() : "Phí khám bệnh";

        Invoice invoice = new Invoice();
        invoice.setInvoiceCode(nextInvoiceCode());
        invoice.setPatient(patient);
        invoice.setAppointmentId(session.getAppointmentId());
        User creator = userRepository.findById(session.getDoctorId()).orElse(null);
        invoice.setCreatedBy(creator);
        invoice.setStatus("UNPAID");

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

        // 4. Khấu trừ phí giữ chỗ
        BigDecimal reservationFee = new BigDecimal("50000");
        InvoiceItem deductionItem = new InvoiceItem();
        deductionItem.setInvoice(invoice);
        deductionItem.setItemType("DEDUCTION");
        deductionItem.setReferenceId(null);
        deductionItem.setItemName("Khấu trừ phí giữ chỗ đặt lịch");
        deductionItem.setQuantity(1);
        deductionItem.setUnitPrice(reservationFee.negate());
        deductionItem.setTotalPrice(reservationFee.negate());
        items.add(deductionItem);
        totalAmount = totalAmount.add(reservationFee.negate());

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        invoice.setTotalAmount(totalAmount);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setFinalAmount(totalAmount);
        invoice.setItems(items);

        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceResponse.from(saved);
    }
}

