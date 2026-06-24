package com.clinicmanagement.medicine;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ResourceNotFoundException;
import com.clinicmanagement.medicine.dto.MedicineRequest;
import com.clinicmanagement.medicine.dto.MedicineResponse;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MedicineServiceImpl implements MedicineService {

    private final MedicineRepository medicineRepository;

    @Transactional(readOnly = true)
    @Override
    public PageResponse<MedicineResponse> getAll(String status, String keyword, Pageable pageable) {
        Specification<Medicine> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("medicineName")), pattern),
                        cb.like(cb.lower(root.get("medicineCode")), pattern),
                        cb.like(cb.lower(root.get("activeIngredient")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return PageResponse.from(
                medicineRepository.findAll(spec, pageable)
                        .map(MedicineResponse::from)
        );
    }

    @Transactional(readOnly = true)
    @Override
    public MedicineResponse getById(Long id) {
        return MedicineResponse.from(findOrThrow(id));
    }

    @Transactional
    @Override
    public MedicineResponse create(MedicineRequest request) {
        String medCode = request.medicineCode();
        if (medCode == null || medCode.isBlank()) {
            // Generate a random MED-xxx code, for example MED-[timestamp]
            medCode = "MED-" + System.currentTimeMillis();
        } else {
            medCode = medCode.trim().toUpperCase();
            if (medicineRepository.existsByMedicineCodeIgnoreCase(medCode)) {
                throw new BusinessException("Mã thuốc '" + medCode + "' đã tồn tại.");
            }
        }

        Medicine medicine = Medicine.builder()
                .medicineCode(medCode)
                .medicineName(request.medicineName().trim())
                .activeIngredient(request.activeIngredient())
                .dosageForm(request.dosageForm())
                .strength(request.strength())
                .unit(request.unit())
                .rxnormCode(request.rxnormCode())
                .description(request.description())
                .usageInstructions(request.usageInstructions())
                .status(request.status() != null ? request.status() : "ACTIVE")
                .build();

        return MedicineResponse.from(medicineRepository.save(medicine));
    }

    @Transactional
    @Override
    public MedicineResponse update(Long id, MedicineRequest request) {
        Medicine medicine = findOrThrow(id);

        String medCode = request.medicineCode();
        if (medCode == null || medCode.isBlank()) {
            medCode = medicine.getMedicineCode(); // Keep old code
        } else {
            medCode = medCode.trim().toUpperCase();
            if (medicineRepository.existsByMedicineCodeIgnoreCaseAndMedicineIdNot(medCode, id)) {
                throw new BusinessException("Mã thuốc '" + medCode + "' đã tồn tại.");
            }
        }

        medicine.setMedicineCode(medCode);
        medicine.setMedicineName(request.medicineName().trim());
        medicine.setActiveIngredient(request.activeIngredient());
        medicine.setDosageForm(request.dosageForm());
        medicine.setStrength(request.strength());
        medicine.setUnit(request.unit());
        medicine.setRxnormCode(request.rxnormCode());
        medicine.setDescription(request.description());
        medicine.setUsageInstructions(request.usageInstructions());
        if (request.status() != null) {
            medicine.setStatus(request.status());
        }

        return MedicineResponse.from(medicineRepository.save(medicine));
    }

    @Transactional
    @Override
    public void delete(Long id) {
        Medicine medicine = findOrThrow(id);
        medicine.setStatus("INACTIVE");
        medicineRepository.save(medicine);
    }

    Medicine findOrThrow(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thuốc với ID: " + id));
    }
}

