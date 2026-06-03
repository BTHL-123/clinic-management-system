package com.clinicmanagement.prescription;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.inventory.MedicineBatch;
import com.clinicmanagement.inventory.MedicineBatchRepository;
import com.clinicmanagement.inventory.StockTransaction;
import com.clinicmanagement.inventory.StockTransactionRepository;
import com.clinicmanagement.medicine.Medicine;
import com.clinicmanagement.medicine.MedicineRepository;
import com.clinicmanagement.prescription.dto.CreatePrescriptionRequest;
import com.clinicmanagement.prescription.dto.PrescriptionResponse;
import com.clinicmanagement.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final StockTransactionRepository stockTransactionRepository;

    // ── GET ALL (for pharmacist) ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PageResponse<PrescriptionResponse> getAll(String status, Pageable pageable) {
        return PageResponse.from(
                prescriptionRepository.findByStatusFilter(status, pageable)
                        .map(PrescriptionResponse::from));
    }

    // ── GET BY CONSULTATION ───────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PrescriptionResponse getByConsultationId(Long consultationId) {
        return PrescriptionResponse.from(
                prescriptionRepository.findByConsultationId(consultationId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy đơn thuốc cho ca khám #" + consultationId)));
    }

    // ── GET BY ID ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PrescriptionResponse getById(Long prescriptionId) {
        return PrescriptionResponse.from(
                prescriptionRepository.findById(prescriptionId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy đơn thuốc #" + prescriptionId)));
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    @Transactional
    public PrescriptionResponse create(CreatePrescriptionRequest request) {
        if (prescriptionRepository.existsByConsultationId(request.consultationId())) {
            throw new BusinessException("Đơn thuốc cho ca khám này đã tồn tại.");
        }

        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = prescriptionRepository.count();
        String code = "RX-" + date + "-" + String.format("%04d", count + 1);

        Prescription prescription = Prescription.builder()
                .prescriptionCode(code)
                .consultationId(request.consultationId())
                .patientId(request.patientId())
                .doctorId(request.doctorId())
                .doctorNote(request.doctorNote())
                .status("CREATED")
                .build();

        for (var itemReq : request.items()) {
            Medicine medicine = medicineRepository.findById(itemReq.medicineId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy thuốc #" + itemReq.medicineId()));

            PrescriptionItem item = PrescriptionItem.builder()
                    .prescription(prescription)
                    .medicine(medicine)
                    .quantity(itemReq.quantity())
                    .dosage(itemReq.dosage())
                    .frequency(itemReq.frequency())
                    .duration(itemReq.duration())
                    .instructions(itemReq.instructions())
                    .morningDose(itemReq.morningDose())
                    .noonDose(itemReq.noonDose())
                    .eveningDose(itemReq.eveningDose())
                    .nightDose(itemReq.nightDose())
                    .build();

            prescription.getItems().add(item);
        }

        return PrescriptionResponse.from(prescriptionRepository.save(prescription));
    }

    // ── DISPENSE (Task 79) ────────────────────────────────────────────────────
    @Transactional
    public PrescriptionResponse dispense(Long prescriptionId, User pharmacist) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn thuốc #" + prescriptionId));

        if ("DISPENSED".equals(prescription.getStatus())) {
            throw new BusinessException("Đơn thuốc này đã được cấp phát rồi.");
        }
        if ("CANCELLED".equals(prescription.getStatus())) {
            throw new BusinessException("Đơn thuốc đã bị hủy, không thể cấp phát.");
        }

        // Kiểm tra tồn kho và xuất kho cho từng thuốc trong đơn
        for (PrescriptionItem item : prescription.getItems()) {
            Long medicineId = item.getMedicine().getMedicineId();
            int required = item.getQuantity();

            // Lấy các lô còn hàng, ưu tiên lô gần hết hạn nhất (FEFO)
            List<MedicineBatch> batches = medicineBatchRepository
                    .findByMedicineMedicineIdAndStatus(medicineId, "AVAILABLE");

            int remaining = required;
            for (MedicineBatch batch : batches) {
                if (remaining <= 0) break;
                if (batch.getCurrentQuantity() <= 0) continue;

                int deduct = Math.min(batch.getCurrentQuantity(), remaining);
                batch.setCurrentQuantity(batch.getCurrentQuantity() - deduct);
                if (batch.getCurrentQuantity() == 0) {
                    batch.setStatus("OUT_OF_STOCK");
                } else if (batch.getCurrentQuantity() <= 10) {
                    batch.setStatus("LOW_STOCK");
                }
                medicineBatchRepository.save(batch);

                // Tạo stock transaction EXPORT
                StockTransaction tx = new StockTransaction();
                tx.setMedicine(item.getMedicine());
                tx.setBatch(batch);
                tx.setTransactionType("EXPORT");
                tx.setQuantity(deduct);
                tx.setReferenceType("PRESCRIPTION");
                tx.setReferenceId(prescriptionId);
                tx.setNote("Cấp phát theo đơn " + prescription.getPrescriptionCode());
                tx.setCreatedBy(pharmacist);
                stockTransactionRepository.save(tx);

                remaining -= deduct;
            }

            if (remaining > 0) {
                throw new BusinessException(
                        "Không đủ tồn kho cho thuốc [" + item.getMedicine().getMedicineName()
                        + "]. Thiếu: " + remaining + " " + item.getMedicine().getUnit());
            }
        }

        prescription.setStatus("DISPENSED");
        prescription.setDispensedAt(LocalDateTime.now());
        return PrescriptionResponse.from(prescriptionRepository.save(prescription));
    }

    // ── EXISTS CHECK ──────────────────────────────────────────────────────────
    public boolean existsByConsultationId(Long consultationId) {
        return prescriptionRepository.existsByConsultationId(consultationId);
    }
}
