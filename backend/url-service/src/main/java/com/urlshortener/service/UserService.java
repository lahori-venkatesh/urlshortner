package com.urlshortener.service;

import com.urlshortener.model.User;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    public User registerUser(String email, String password, String firstName, String lastName) {
        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }
        
        // Create new user
        User user = new User();
        user.setEmail(email);
        user.setPassword(hashPassword(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setAuthProvider("LOCAL");
        user.setApiKey(generateApiKey());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }
    
    public User loginUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        if (!verifyPassword(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }
    
    public User registerWithGoogle(String email, String googleId, String firstName, String lastName, String profilePicture) {
        // Check if user already exists
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update Google ID if not set
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                user.setAuthProvider("GOOGLE");
                user.setLastLoginAt(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                return userRepository.save(user);
            }
            return user;
        }
        
        // Create new user with Google auth
        User user = new User();
        user.setEmail(email);
        user.setGoogleId(googleId);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setProfilePicture(profilePicture);
        user.setAuthProvider("GOOGLE");
        user.setEmailVerified(true); // Google accounts are pre-verified
        user.setApiKey(generateApiKey());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }
    
    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> findByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId);
    }
    
    public java.util.List<User> findAllUsers() {
        return (java.util.List<User>) userRepository.findAll();
    }
    
    public User updateUser(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = md.digest(password.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hashedBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }
    
    private boolean verifyPassword(String password, String hashedPassword) {
        return hashPassword(password).equals(hashedPassword);
    }
    
    private String generateApiKey() {
        return "pk_" + UUID.randomUUID().toString().replace("-", "");
    }

    // Admin-specific methods
    public Page<User> searchUsers(String search, Pageable pageable) {
        return userRepository.findByEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                search, search, search, pageable);
    }

    public Page<User> findAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Page<User> findUsersWithFilters(String status, String plan, String dateFrom, String dateTo, Pageable pageable) {
        // Implementation for filtering users
        return userRepository.findUsersWithFilters(status, plan, dateFrom, dateTo, pageable);
    }

    public User createUserByAdmin(String email, String name, String password, String plan, String status, boolean emailVerified) {
        User user = new User(email, passwordEncoder.encode(password));
        String[] nameParts = name.split(" ", 2);
        user.setFirstName(nameParts[0]);
        if (nameParts.length > 1) {
            user.setLastName(nameParts[1]);
        }
        user.setSubscriptionPlan(plan);
        user.setActive("ACTIVE".equals(status));
        user.setEmailVerified(emailVerified);
        return userRepository.save(user);
    }

    public User updateUserByAdmin(String id, Object updateRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Update user properties based on request
        // This is a simplified implementation
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public void suspendUser(String id, String reason) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void reactivateUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setActive(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Soft delete
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public int getUserLinksCount(String userId) {
        // Implementation to count user links
        return 0; // Placeholder
    }

    public int getUserLinksLimit(String plan) {
        return switch (plan) {
            case "FREE" -> 1000;
            case "PRO_MONTHLY", "PRO_YEARLY" -> 5000;
            case "BUSINESS_MONTHLY", "BUSINESS_YEARLY" -> -1; // Unlimited
            default -> 1000;
        };
    }

    public int getUserDomainsCount(String userId) {
        // Implementation to count user domains
        return 0; // Placeholder
    }

    public int getUserDomainsLimit(String plan) {
        return switch (plan) {
            case "FREE" -> 0;
            case "PRO_MONTHLY", "PRO_YEARLY" -> 1;
            case "BUSINESS_MONTHLY", "BUSINESS_YEARLY" -> 5;
            default -> 0;
        };
    }

    public int getUserClicksThisMonth(String userId) {
        // Implementation to count user clicks this month
        return 0; // Placeholder
    }

    public long getUserStorageUsed(String userId) {
        // Implementation to calculate user storage used
        return 0L; // Placeholder
    }

    public long getUserStorageLimit(String plan) {
        return switch (plan) {
            case "FREE" -> 100 * 1024 * 1024L; // 100MB
            case "PRO_MONTHLY", "PRO_YEARLY" -> 1024 * 1024 * 1024L; // 1GB
            case "BUSINESS_MONTHLY", "BUSINESS_YEARLY" -> 10L * 1024 * 1024 * 1024; // 10GB
            default -> 100 * 1024 * 1024L;
        };
    }

    public Object getUserSubscription(String userId) {
        // Implementation to get user subscription details
        return null; // Placeholder
    }

    public List<Object> getUserTeams(String userId) {
        // Implementation to get user teams
        return new ArrayList<>(); // Placeholder
    }

    public String generateImpersonationToken(String userId, String adminId) {
        // Implementation to generate impersonation token
        return "impersonation_token_" + userId; // Placeholder
    }

    public Map<String, Object> exportUserData(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("email", user.getEmail());
        userData.put("name", user.getName());
        userData.put("plan", user.getPlan());
        userData.put("status", user.getStatus());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("lastLogin", user.getLastLogin());
        
        return userData;
    }

    public void bulkSuspendUsers(List<String> userIds, String reason) {
        userIds.forEach(id -> suspendUser(id, reason));
    }

    public void bulkReactivateUsers(List<String> userIds) {
        userIds.forEach(this::reactivateUser);
    }

    public void bulkDeleteUsers(List<String> userIds, String reason) {
        userIds.forEach(this::deleteUser);
    }

    public List<Map<String, Object>> bulkExportUsers(List<String> userIds) {
        return userIds.stream()
                .map(this::exportUserData)
                .collect(Collectors.toList());
    }

    public void bulkSendEmail(List<String> userIds, String template) {
        // Implementation for bulk email sending
        // Placeholder
    }
}