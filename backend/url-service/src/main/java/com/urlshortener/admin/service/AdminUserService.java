package com.urlshortener.admin.service;

import com.urlshortener.admin.model.AdminUser;
import com.urlshortener.admin.model.AdminRole;
import com.urlshortener.admin.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

@Service
public class AdminUserService {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<AdminUser> findByEmail(String email) {
        return adminUserRepository.findByEmailAndIsActive(email, true);
    }

    public Optional<AdminUser> findById(String id) {
        return adminUserRepository.findById(id);
    }

    public Page<AdminUser> findAll(Pageable pageable) {
        return adminUserRepository.findAll(pageable);
    }

    public Page<AdminUser> searchByNameOrEmail(String searchTerm, Pageable pageable) {
        return adminUserRepository.findByNameOrEmailContainingIgnoreCase(searchTerm, pageable);
    }

    public AdminUser createAdminUser(String email, String name, String password, AdminRole role, Set<String> permissions) {
        if (adminUserRepository.existsByEmail(email)) {
            throw new RuntimeException("Admin user with email already exists");
        }

        AdminUser adminUser = new AdminUser();
        adminUser.setEmail(email);
        adminUser.setName(name);
        adminUser.setPasswordHash(passwordEncoder.encode(password));
        adminUser.setRole(role);
        adminUser.setPermissions(permissions);
        adminUser.setActive(true);
        adminUser.setMfaEnabled(false);

        return adminUserRepository.save(adminUser);
    }

    public AdminUser updateAdminUser(String id, AdminUser updatedUser) {
        AdminUser existingUser = adminUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin user not found"));

        existingUser.setName(updatedUser.getName());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setPermissions(updatedUser.getPermissions());
        existingUser.setActive(updatedUser.isActive());
        existingUser.setUpdatedAt(LocalDateTime.now());

        return adminUserRepository.save(existingUser);
    }

    public void updatePassword(String id, String newPassword) {
        AdminUser adminUser = adminUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin user not found"));

        adminUser.setPasswordHash(passwordEncoder.encode(newPassword));
        adminUser.setUpdatedAt(LocalDateTime.now());

        adminUserRepository.save(adminUser);
    }

    public void toggleMfa(String id) {
        AdminUser adminUser = adminUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin user not found"));

        adminUser.setMfaEnabled(!adminUser.isMfaEnabled());
        adminUser.setUpdatedAt(LocalDateTime.now());

        adminUserRepository.save(adminUser);
    }

    public void deactivateAdminUser(String id) {
        AdminUser adminUser = adminUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin user not found"));

        adminUser.setActive(false);
        adminUser.setUpdatedAt(LocalDateTime.now());

        adminUserRepository.save(adminUser);
    }

    public void updateLastLogin(String email, String ipAddress) {
        Optional<AdminUser> adminUserOpt = adminUserRepository.findByEmail(email);
        if (adminUserOpt.isPresent()) {
            AdminUser adminUser = adminUserOpt.get();
            adminUser.updateLastLogin(ipAddress);
            adminUserRepository.save(adminUser);
        }
    }

    public boolean validatePassword(String email, String password) {
        Optional<AdminUser> adminUserOpt = findByEmail(email);
        if (adminUserOpt.isPresent()) {
            AdminUser adminUser = adminUserOpt.get();
            return passwordEncoder.matches(password, adminUser.getPasswordHash());
        }
        return false;
    }

    public long countActiveAdmins() {
        return adminUserRepository.countByIsActive(true);
    }

    public long countAdminsByRole(String roleName) {
        return adminUserRepository.countByRoleName(roleName);
    }
}