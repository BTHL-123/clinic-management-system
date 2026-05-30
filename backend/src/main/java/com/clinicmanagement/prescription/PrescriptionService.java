package com.clinicmanagement.prescription;

import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.medicine.Medicine;
import com.clinicmanagement.medicine.MedicineRepository;
import com.clinicmanagement.prescription.dto.CreatePrescriptionRequest;
import com.clinicmanagement.prescription.dto.PrescriptionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;

    @Transactional(readOnly = true)
    public PrescriptionResponse getByConsultationId(Long consultationId) {
        return PrescriptionResponse.from(
                prescriptionRepository.findByConsultationId(consultationId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Prescription not found for consultation #" + consultationId)));
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getById(Long prescriptionId) {
        return PrescriptionResponse.from(
                prescriptionRepository.findById(prescriptionId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Prescription not found: #" + prescriptionId)));
    }

    @Transactional
    public PrescriptionResponse create(CreatePrescriptionRequest request) {
        if (prescriptionRepository.existsByConsultationId(request.consultationId())) {
            throw new BusinessException("Prescription already exists for this consultation.");
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
                            "Medicine not found: #" + itemReq.medicineId()));

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

    public boolean existsByConsultationId(Long consultationId) {
        return prescriptionRepository.existsByConsultationId(consultationId);
    }
}
