package com.clinicmanagement.medicalservice;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalServiceRepository extends JpaRepository<MedicalService, Long> {

    boolean existsByServiceCodeIgnoreCase(String serviceCode);

    boolean existsByServiceCodeIgnoreCaseAndServiceIdNot(String serviceCode, Long serviceId);

    boolean existsByServiceNameIgnoreCase(String serviceName);

    boolean existsByServiceNameIgnoreCaseAndServiceIdNot(String serviceName, Long serviceId);

    List<MedicalService> findAllByStatusOrderByServiceNameAsc(String status);

    Optional<MedicalService> findTopByOrderByServiceIdDesc();
}
