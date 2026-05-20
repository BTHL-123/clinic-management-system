package com.clinicmanagement.vitalsign;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VitalSignRepository extends JpaRepository<VitalSign, Long> {

    List<VitalSign> findByConsultationIdOrderByMeasuredAtDesc(Long consultationId);

    List<VitalSign> findByPatientIdOrderByMeasuredAtDesc(Long patientId);
}
