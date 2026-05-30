package com.clinicmanagement.labrequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LabResultRepository extends JpaRepository<LabResult, Long> {

    Optional<LabResult> findByLabRequestItem_LabRequestItemId(Long labRequestItemId);

    boolean existsByLabRequestItem_LabRequestItemId(Long labRequestItemId);
}
