package com.clinicmanagement.security;

import com.clinicmanagement.user.User;
import java.util.Collection;
import java.util.List;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
public class CustomUserDetails implements UserDetails {
    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> roleAuthorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleName()))
                .toList();
        return roleAuthorities;
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"LOCKED".equals(user.getStatus());
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equals(user.getStatus());
    }
}
