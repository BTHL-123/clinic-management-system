package com.clinicmanagement.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    @Query("SELECT t FROM StockTransaction t WHERE " +
           "(:medicineId IS NULL OR t.medicine.medicineId = :medicineId) " +
           "AND (:transactionType IS NULL OR t.transactionType = :transactionType)")
    Page<StockTransaction> findTransactions(@Param("medicineId") Long medicineId, @Param("transactionType") String transactionType, Pageable pageable);
}
