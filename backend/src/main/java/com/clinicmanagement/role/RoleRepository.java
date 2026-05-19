package com.clinicmanagement.role;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleName(String roleName);

    boolean existsByRoleName(String roleName);
}
