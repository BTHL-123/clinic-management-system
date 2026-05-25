package com.clinicmanagement.medicine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long>, JpaSpecificationExecutor<Medicine> {

    boolean existsByMedicineCodeIgnoreCase(String medicineCode);

    boolean existsByMedicineCodeIgnoreCaseAndMedicineIdNot(String medicineCode, Long medicineId);
}
