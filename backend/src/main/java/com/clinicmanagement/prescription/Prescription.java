package com.clinicmanagement.prescription;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prescription_id")
    private Long prescriptionId;

    @Column(name = "prescription_code", nullable = false, unique = true, length = 30)
    private String prescriptionCode;

    @Column(name = "consultation_id", nullable = false)
    private Long consultationId;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "CREATED";

    @Column(name = "drug_interaction_checked", nullable = false)
    @Builder.Default
    private Boolean drugInteractionChecked = false;

    @Column(name = "interaction_warning", columnDefinition = "TEXT")
    private String interactionWarning;

    @Column(name = "doctor_note", columnDefinition = "TEXT")
    private String doctorNote;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "checked_at")
    private LocalDateTime checkedAt;

    @Column(name = "dispensed_at")
    private LocalDateTime dispensedAt;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PrescriptionItem> items = new ArrayList<>();
}
