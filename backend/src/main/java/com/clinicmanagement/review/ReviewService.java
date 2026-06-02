package com.clinicmanagement.review;

import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.review.dto.ReviewRequest;
import com.clinicmanagement.review.dto.ReviewResponse;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse createReview(Long patientUserId, ReviewRequest request);
    PageResponse<ReviewResponse> getAllReviews(Pageable pageable);
    PageResponse<ReviewResponse> getReviewsByDoctor(Long doctorId, Pageable pageable);
    ReviewResponse toggleVisibility(Long reviewId);
    void deleteReview(Long reviewId);
}
