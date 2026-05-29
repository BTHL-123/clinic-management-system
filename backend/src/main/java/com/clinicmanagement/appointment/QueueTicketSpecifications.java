package com.clinicmanagement.appointment;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class QueueTicketSpecifications {

    public static Specification<QueueTicket> searchQueueTickets(
            LocalDate date,
            Long doctorId,
            String status
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Filter by Date
            if (date != null) {
                predicates.add(criteriaBuilder.equal(root.get("queueDate"), date));
            }

            // 2. Filter by Doctor
            if (doctorId != null) {
                predicates.add(criteriaBuilder.equal(root.get("doctor").get("doctorId"), doctorId));
            }

            // 3. Filter by Status
            if (status != null && !status.trim().isEmpty()) {
                String dbStatus = "COMPLETED".equalsIgnoreCase(status) ? "DONE" : status;
                predicates.add(criteriaBuilder.equal(root.get("status"), dbStatus));
            } else {
                // By default, exclude CANCELLED from the queue list
                predicates.add(criteriaBuilder.notEqual(root.get("status"), "CANCELLED"));
            }

            // Order by queueNumber ascending (avoiding order-by in count queries)
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                query.orderBy(criteriaBuilder.asc(root.get("queueNumber")));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
