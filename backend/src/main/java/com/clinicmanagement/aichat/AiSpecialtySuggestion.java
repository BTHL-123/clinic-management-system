package com.clinicmanagement.aichat;

import com.clinicmanagement.department.Department;
import com.clinicmanagement.patient.Patient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Setter
@Entity
@Table(name = "ai_specialty_suggestions")
public class AiSpecialtySuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "suggestion_id")
    private Long suggestionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_chat_session_id", nullable = false)
    private AiChatSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "symptoms_text", columnDefinition = "TEXT")
    private String symptomsText;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "accepted_by_patient", nullable = false)
    private Boolean acceptedByPatient = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
