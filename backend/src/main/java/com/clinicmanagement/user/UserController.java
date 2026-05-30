package com.clinicmanagement.user;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.PageResponse;
import com.clinicmanagement.user.dto.CreateUserRequest;
import com.clinicmanagement.user.dto.UpdateUserRequest;
import com.clinicmanagement.user.dto.UserSummaryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.clinicmanagement.security.CustomUserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<UserSummaryResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            Pageable pageable
    ) {
        return ApiResponse.success(PageResponse.from(userService.getUsers(keyword, status, role, pageable)));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserSummaryResponse> getUserById(@PathVariable Long userId) {
        return ApiResponse.success(userService.getUserById(userId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserSummaryResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.success("User created successfully", userService.createUser(request));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserSummaryResponse> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return ApiResponse.success(userService.updateUser(userId, request));
    }

    @PutMapping("/me")
    public ApiResponse<UserSummaryResponse> updateCurrentUser(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return ApiResponse.success(userService.updateCurrentUser(currentUser.getUser(), request));
    }

    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    public ApiResponse<UserSummaryResponse> uploadCurrentUserAvatar(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestPart("file") MultipartFile file
    ) {
        return ApiResponse.success(userService.uploadCurrentUserAvatar(currentUser.getUser(), file));
    }

    @PutMapping("/{userId}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> lockUser(@PathVariable Long userId) {
        userService.lockUser(userId);
        return ApiResponse.success(null);
    }

    @PutMapping("/{userId}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> unlockUser(@PathVariable Long userId) {
        userService.unlockUser(userId);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ApiResponse.success(null);
    }
}
