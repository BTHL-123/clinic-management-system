package com.clinicmanagement.medicine;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.medicine.dto.CreateMedicineRequest;
import com.clinicmanagement.medicine.dto.MedicineResponse;
import com.clinicmanagement.medicine.dto.UpdateMedicineRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final MedicineRepository medicineRepository;

    @Transactional(readOnly = true)
    public PageResponse<MedicineResponse> searchMedicines(String keyword, String status, Pageable pageable) {
        Page<Medicine> page = medicineRepository.searchMedicines(keyword, status, pageable);
        return PageResponse.from(page.map(this::mapToResponse));
    }

    @Transactional(readOnly = true)
    public MedicineResponse getMedicineById(Long medicineId) {
        Medicine medicine = findOrThrow(medicineId);
        return mapToResponse(medicine);
    }

    @Transactional
    public MedicineResponse createMedicine(CreateMedicineRequest request) {
        if (medicineRepository.existsByMedicineCode(request.getMedicineCode())) {
            throw new IllegalArgumentException("Medicine code already exists: " + request.getMedicineCode());
        }

        Medicine medicine = new Medicine();
        medicine.setMedicineCode(request.getMedicineCode());
        medicine.setMedicineName(request.getMedicineName());
        medicine.setActiveIngredient(request.getActiveIngredient());
        medicine.setDosageForm(request.getDosageForm());
        medicine.setStrength(request.getStrength());
        medicine.setUnit(request.getUnit());
        medicine.setRxnormCode(request.getRxnormCode());
        medicine.setDescription(request.getDescription());
        medicine.setStatus("ACTIVE");

        Medicine saved = medicineRepository.save(medicine);
        return mapToResponse(saved);
    }

    @Transactional
    public MedicineResponse updateMedicine(Long medicineId, UpdateMedicineRequest request) {
        Medicine medicine = findOrThrow(medicineId);

        if (request.getMedicineName() != null) medicine.setMedicineName(request.getMedicineName());
        if (request.getActiveIngredient() != null) medicine.setActiveIngredient(request.getActiveIngredient());
        if (request.getDosageForm() != null) medicine.setDosageForm(request.getDosageForm());
        if (request.getStrength() != null) medicine.setStrength(request.getStrength());
        if (request.getUnit() != null) medicine.setUnit(request.getUnit());
        if (request.getRxnormCode() != null) medicine.setRxnormCode(request.getRxnormCode());
        if (request.getDescription() != null) medicine.setDescription(request.getDescription());
        if (request.getStatus() != null) medicine.setStatus(request.getStatus());

        Medicine updated = medicineRepository.save(medicine);
        return mapToResponse(updated);
    }

    private Medicine findOrThrow(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
    }

    private MedicineResponse mapToResponse(Medicine entity) {
        MedicineResponse dto = new MedicineResponse();
        dto.setMedicineId(entity.getMedicineId());
        dto.setMedicineCode(entity.getMedicineCode());
        dto.setMedicineName(entity.getMedicineName());
        dto.setActiveIngredient(entity.getActiveIngredient());
        dto.setDosageForm(entity.getDosageForm());
        dto.setStrength(entity.getStrength());
        dto.setUnit(entity.getUnit());
        dto.setRxnormCode(entity.getRxnormCode());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
