package com.clinicmanagement.review.dto;

import com.clinicmanagement.review.Review;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ReviewResponse {
    private Long reviewId;
    private Long appointmentId;
    private String appointmentCode;
    
    private Long patientId;
    private String patientName;
    
    private Long doctorId;
    private String doctorName;
    
    private Integer rating;
    private String comment;
    private String status;
    private LocalDateTime createdAt;
    
    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .appointmentId(review.getAppointment() != null ? review.getAppointment().getAppointmentId() : null)
                .appointmentCode(review.getAppointment() != null ? review.getAppointment().getAppointmentCode() : null)
                .patientId(review.getPatient() != null ? review.getPatient().getPatientId() : null)
                .patientName(review.getPatient() != null ? review.getPatient().getFullName() : null)
                .doctorId(review.getDoctor() != null ? review.getDoctor().getDoctorId() : null)
                .doctorName(review.getDoctor() != null ? review.getDoctor().getUser().getFullName() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
