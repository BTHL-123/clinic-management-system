package com.clinicmanagement.permission;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    List<Permission> findByPermissionIdIn(Collection<Long> permissionIds);

    boolean existsByPermissionCode(String permissionCode);
}
