package com.clinicmanagement.appointment;

import com.clinicmanagement.appointment.dto.SlotLockResponse;

public interface SlotLockService {
    SlotLockResponse lockSlot(Long slotId, Long patientUserId);
    void releaseExpiredLocks();
    void releaseLock(Long slotId, Long patientUserId);
}
