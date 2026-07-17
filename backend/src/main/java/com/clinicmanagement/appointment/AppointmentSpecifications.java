package com.clinicmanagement.appointment;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class AppointmentSpecifications {

    public static Specification<Appointment> searchAppointmentsForReceptionist(
            String keyword,
            LocalDate date,
            String status
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Filter by Date (only if date is present)
            if (date != null) {
                predicates.add(criteriaBuilder.equal(root.get("appointmentDate"), date));
            }

            // 2. Filter by Status (only if status is present and not empty)
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            // 3. Search by Keyword (appointmentCode, patient name, patient phone)
            if (keyword != null && !keyword.trim().isEmpty()) {
                String searchPattern = "%" + keyword.trim().toLowerCase() + "%";
                
                Join<Object, Object> patientJoin = root.join("patient", JoinType.LEFT);

                Predicate codePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("appointmentCode")),
                        searchPattern
                );
                
                Predicate namePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(patientJoin.get("fullName")),
                        searchPattern
                );
                
                Predicate phonePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(patientJoin.get("phone")),
                        searchPattern
                );

                predicates.add(criteriaBuilder.or(codePredicate, namePredicate, phonePredicate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
