package com.clinicmanagement.payment;

import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefundRepository extends JpaRepository<Refund, Long>, JpaSpecificationExecutor<Refund> {

    Optional<Refund> findTopByOrderByRefundIdDesc();

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r WHERE r.payment.paymentId = :paymentId AND r.status IN ('PENDING', 'APPROVED', 'COMPLETED')")
    BigDecimal sumActiveRefundAmountByPaymentId(@Param("paymentId") Long paymentId);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r WHERE r.payment.paymentId = :paymentId AND r.status = 'COMPLETED'")
    BigDecimal sumCompletedRefundAmountByPaymentId(@Param("paymentId") Long paymentId);
}
