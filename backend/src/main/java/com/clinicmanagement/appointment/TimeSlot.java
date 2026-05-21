package com.clinicmanagement.appointment;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_slots")
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "slot_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private DoctorSchedule doctorSchedule;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "locked_by_patient_id")
    private Long lockedByPatientId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DoctorSchedule getDoctorSchedule() { return doctorSchedule; }
    public void setDoctorSchedule(DoctorSchedule doctorSchedule) { this.doctorSchedule = doctorSchedule; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }

    public Long getLockedByPatientId() { return lockedByPatientId; }
    public void setLockedByPatientId(Long lockedByPatientId) { this.lockedByPatientId = lockedByPatientId; }
}
