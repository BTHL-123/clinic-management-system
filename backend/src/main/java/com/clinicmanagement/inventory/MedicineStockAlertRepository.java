package com.clinicmanagement.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineStockAlertRepository extends JpaRepository<MedicineStockAlert, Long> {
    Page<MedicineStockAlert> findByIsResolvedFalse(Pageable pageable);
    
    /**
     * Check if an unresolved alert already exists for a specific batch and alert type.
     * This prevents creating duplicate alerts.
     */
    boolean existsByBatchAndAlertTypeAndIsResolvedFalse(MedicineBatch batch, String alertType);
}
