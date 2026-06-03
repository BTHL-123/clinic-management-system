package com.clinicmanagement.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Long> {

    @Query("SELECT b FROM MedicineBatch b WHERE " +
           "(:medicineId IS NULL OR b.medicine.medicineId = :medicineId) " +
           "AND (COALESCE(:status, '') = '' OR b.status = :status)")
    Page<MedicineBatch> findBatches(@Param("medicineId") Long medicineId, @Param("status") String status, Pageable pageable);

    List<MedicineBatch> findByMedicineMedicineIdAndStatus(Long medicineId, String status);

    @Query("SELECT b FROM MedicineBatch b WHERE b.medicine.medicineId = :medicineId " +
           "AND b.status = 'AVAILABLE' AND b.currentQuantity > 0 AND b.expiryDate >= :currentDate " +
           "ORDER BY b.expiryDate ASC, b.batchId ASC")
    List<MedicineBatch> findFefoBatches(@Param("medicineId") Long medicineId, @Param("currentDate") java.time.LocalDate currentDate);

    /**
     * Trả về tất cả batch còn hàng thực tế cho một loại thuốc,
     * bao gồm cả LOW_STOCK và NEAR_EXPIRY (vẫn có hàng, chưa hết hạn).
     * Loại bỏ: CANCELLED, EXPIRED, OUT_OF_STOCK.
     * Dùng cho checkStockAvailability để tính đúng tồn kho khả dụng khi tạo Invoice.
     */
    @Query("SELECT b FROM MedicineBatch b WHERE b.medicine.medicineId = :medicineId " +
           "AND b.status NOT IN ('CANCELLED', 'EXPIRED', 'OUT_OF_STOCK') " +
           "AND b.currentQuantity > 0")
    List<MedicineBatch> findUsableBatches(@Param("medicineId") Long medicineId);
}
