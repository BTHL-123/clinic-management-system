package com.clinicmanagement.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.userId NOT IN (SELECT d.user.userId FROM Doctor d) AND NOT EXISTS (SELECT r FROM u.roles r WHERE r.roleName IN ('ADMIN', 'PATIENT'))")
    java.util.List<User> findUsersEligibleForDoctor();
}
