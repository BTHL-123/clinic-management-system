package com.clinicmanagement.review;

import com.clinicmanagement.appointment.Appointment;
import com.clinicmanagement.appointment.AppointmentRepository;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.patient.Patient;
import com.clinicmanagement.patient.PatientRepository;
import com.clinicmanagement.review.dto.ReviewRequest;
import com.clinicmanagement.review.dto.ReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(Long patientUserId, ReviewRequest request) {
        Patient patient = patientRepository.findByUserUserId(patientUserId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy thông tin bệnh nhân"));

        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new BusinessException("Không tìm thấy lịch khám"));

        Long apptUserId = (appointment.getPatient() != null && appointment.getPatient().getUser() != null) 
                          ? appointment.getPatient().getUser().getUserId() : null;

        if (!patientUserId.equals(apptUserId)) {
            throw new BusinessException("Bạn chỉ có thể đánh giá lịch khám của chính mình");
        }

        if (!"COMPLETED".equals(appointment.getStatus())) {
            throw new BusinessException("Chỉ có thể đánh giá lịch khám đã hoàn thành");
        }

        if (reviewRepository.existsByAppointmentAppointmentId(appointment.getAppointmentId())) {
            throw new BusinessException("Bạn đã đánh giá lịch khám này rồi");
        }

        Review review = new Review();
        review.setPatient(patient);
        review.setDoctor(appointment.getDoctor());
        review.setAppointment(appointment);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setStatus("VISIBLE");

        Review savedReview = reviewRepository.save(review);
        return ReviewResponse.from(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getAllReviews(Pageable pageable) {
        Page<Review> reviews = reviewRepository.findAll(pageable);
        return PageResponse.from(reviews.map(ReviewResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewsByDoctor(Long doctorId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByDoctorDoctorId(doctorId, pageable);
        return PageResponse.from(reviews.map(ReviewResponse::from));
    }

    @Override
    @Transactional
    public ReviewResponse toggleVisibility(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đánh giá"));
        
        if ("VISIBLE".equals(review.getStatus())) {
            review.setStatus("HIDDEN");
        } else {
            review.setStatus("VISIBLE");
        }
        
        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new BusinessException("Không tìm thấy đánh giá");
        }
        reviewRepository.deleteById(reviewId);
    }
}
