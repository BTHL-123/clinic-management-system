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

            if (date != null) {
                predicates.add(criteriaBuilder.equal(root.get("queueDate"), date));
            }

            if (doctorId != null) {
                predicates.add(criteriaBuilder.equal(root.get("doctor").get("doctorId"), doctorId));
            }

            if (status != null && !status.trim().isEmpty()) {
                String dbStatus = "COMPLETED".equalsIgnoreCase(status) ? "DONE" : status;
                predicates.add(criteriaBuilder.equal(root.get("status"), dbStatus));
            } else {
                predicates.add(criteriaBuilder.notEqual(root.get("status"), "CANCELLED"));
            }

            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                query.orderBy(criteriaBuilder.asc(root.get("queueNumber")));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
