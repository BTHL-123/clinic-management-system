package com.clinicmanagement.prescription;

import com.clinicmanagement.medicine.Medicine;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prescription_item_id")
    private Long prescriptionItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 255)
    private String dosage;

    @Column(length = 255)
    private String frequency;

    @Column(length = 255)
    private String duration;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "morning_dose", length = 50)
    private String morningDose;

    @Column(name = "noon_dose", length = 50)
    private String noonDose;

    @Column(name = "evening_dose", length = 50)
    private String eveningDose;

    @Column(name = "night_dose", length = 50)
    private String nightDose;
}
