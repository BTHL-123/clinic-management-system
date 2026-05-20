package com.clinicmanagement.medicalservice;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicalServiceRepository extends JpaRepository<MedicalService, Long> {

    boolean existsByServiceCodeIgnoreCase(String serviceCode);

    boolean existsByServiceCodeIgnoreCaseAndServiceIdNot(String serviceCode, Long serviceId);

    List<MedicalService> findAllByStatusOrderByServiceNameAsc(String status);
}
