package com.clinicmanagement.doctor;

import com.clinicmanagement.department.Department;
import com.clinicmanagement.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Entity
@Table(name = "doctors")
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doctor_id")
    private Long doctorId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "doctor_code", nullable = false, unique = true, length = 30)
    private String doctorCode;

    @Column(length = 100)
    private String degree;

    @Column(length = 150)
    private String specialization;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience = 0;

    @Column(name = "year_of_birth")
    private Integer yearOfBirth;

    @Column(length = 150)
    private String hometown;

    @Column(columnDefinition = "TEXT")
    private String biography;

    @Column(name = "consultation_fee", columnDefinition = "NUMERIC(10,2)")
    private java.math.BigDecimal consultationFee;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
