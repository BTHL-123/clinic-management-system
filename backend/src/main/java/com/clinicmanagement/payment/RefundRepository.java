package com.clinicmanagement.payment;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RefundRepository extends JpaRepository<Refund, Long>, JpaSpecificationExecutor<Refund> {

    Optional<Refund> findTopByOrderByRefundIdDesc();
}
