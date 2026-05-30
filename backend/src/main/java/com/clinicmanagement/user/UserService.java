package com.clinicmanagement.user;

import com.clinicmanagement.user.dto.CreateUserRequest;
import com.clinicmanagement.user.dto.UpdateUserRequest;
import com.clinicmanagement.user.dto.UserSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {

    Page<UserSummaryResponse> getUsers(String keyword, String status, String role, Pageable pageable);

    UserSummaryResponse getUserById(Long userId);

    UserSummaryResponse createUser(CreateUserRequest request);

    UserSummaryResponse updateUser(Long userId, UpdateUserRequest request);

    UserSummaryResponse updateCurrentUser(User currentUser, UpdateUserRequest request);

    UserSummaryResponse uploadCurrentUserAvatar(User currentUser, MultipartFile file);

    void lockUser(Long userId);

    void unlockUser(Long userId);

    void deleteUser(Long userId);
}
