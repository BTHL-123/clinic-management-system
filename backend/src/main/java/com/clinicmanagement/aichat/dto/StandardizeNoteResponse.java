package com.clinicmanagement.aichat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StandardizeNoteResponse {
    private String symptoms;
    private String clinicalFindings;
    private String diagnosis;
    private String treatmentPlan;
    private String doctorNote;
}
