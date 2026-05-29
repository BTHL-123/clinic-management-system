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
import com.clinicmanagement.inventory.InventoryService;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PatientRepository patientRepository;
    private final InventoryService inventoryService;

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
}

