package com.clinicmanagement.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    Optional<Payment> findTopByOrderByPaymentIdDesc();

    Optional<Payment> findByPaymentCode(String paymentCode);

    boolean existsByGatewayTransactionIdAndPaymentIdNot(String gatewayTransactionId, Long paymentId);

    java.util.List<Payment> findAllByInvoiceAndStatus(com.clinicmanagement.invoice.Invoice invoice, String status);

    java.util.List<Payment> findByAppointmentId(Long appointmentId);

    Optional<Payment> findFirstByAppointmentIdAndPaymentTypeOrderByPaymentIdDesc(Long appointmentId, String paymentType);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.invoiceId = :invoiceId AND p.status = 'PAID'")
    BigDecimal sumPaidAmountByInvoiceId(@Param("invoiceId") Long invoiceId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.appointmentId = :appointmentId AND p.paymentType = :paymentType AND p.status = 'PAID'")
    BigDecimal sumPaidAmountByAppointmentIdAndPaymentType(
            @Param("appointmentId") Long appointmentId,
            @Param("paymentType") String paymentType
    );

    @Query("SELECT p FROM Payment p WHERE p.status = 'PENDING' AND p.paymentType = 'DEPOSIT' AND p.expiresAt IS NOT NULL AND p.expiresAt < :now")
    List<Payment> findExpiredPendingDepositPayments(@Param("now") LocalDateTime now);
}
