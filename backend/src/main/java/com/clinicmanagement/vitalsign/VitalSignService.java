package com.clinicmanagement.vitalsign;

import com.clinicmanagement.vitalsign.dto.CreateVitalSignRequest;
import com.clinicmanagement.vitalsign.dto.VitalSignResponse;
import java.util.List;

public interface VitalSignService {

    List<VitalSignResponse> getByConsultation(Long consultationId);

    VitalSignResponse create(CreateVitalSignRequest request, Long measuredBy);

    void delete(Long id);
}
