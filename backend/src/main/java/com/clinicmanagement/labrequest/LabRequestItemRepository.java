package com.clinicmanagement.labrequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabRequestItemRepository extends JpaRepository<LabRequestItem, Long> {
    boolean existsByLabRequest_LabRequestIdAndStatusNot(Long labRequestId, String status);
}
