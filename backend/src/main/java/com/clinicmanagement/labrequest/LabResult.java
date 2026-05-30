package com.clinicmanagement.labrequest;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lab_result_id")
    private Long labResultId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_request_item_id", nullable = false, unique = true)
    private LabRequestItem labRequestItem;

    @Column(name = "result_value", columnDefinition = "TEXT")
    private String resultValue;

    @Column(name = "normal_range", length = 100)
    private String normalRange;

    @Column(name = "result_unit", length = 50)
    private String resultUnit;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "result_file_url", length = 500)
    private String resultFileUrl;

    @Column(name = "entered_by")
    private Long enteredBy;

    @CreationTimestamp
    @Column(name = "entered_at", nullable = false, updatable = false)
    private LocalDateTime enteredAt;
}
