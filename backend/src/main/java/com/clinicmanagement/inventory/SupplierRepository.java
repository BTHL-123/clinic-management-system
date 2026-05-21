package com.clinicmanagement.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Query("SELECT s FROM Supplier s WHERE " +
           "(COALESCE(:keyword, '') = '' OR LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(s.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (COALESCE(:status, '') = '' OR s.status = :status)")
    Page<Supplier> searchSuppliers(@Param("keyword") String keyword, @Param("status") String status, Pageable pageable);
}
