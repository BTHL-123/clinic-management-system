package com.clinicmanagement.labrequest;

import com.clinicmanagement.lab.LabTest;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lab_request_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lab_request_item_id")
    private Long labRequestItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_request_id", nullable = false)
    private LabRequest labRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest labTest;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "REQUESTED";

    @Column(length = 500)
    private String note;

    @OneToOne(mappedBy = "labRequestItem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private LabResult labResult;
}
