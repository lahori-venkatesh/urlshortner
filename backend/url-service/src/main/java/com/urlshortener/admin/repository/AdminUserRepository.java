package com.urlshortener.admin.repository;

import com.urlshortener.admin.model.AdminUser;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "app.admin.enabled", havingValue = "true", matchIfMissing = false)
public interface AdminUserRepository extends MongoRepository<AdminUser, String> {
    
    Optional<AdminUser> findByEmail(String email);
    
    Optional<AdminUser> findByEmailAndIsActive(String email, boolean isActive);
    
    List<AdminUser> findByIsActive(boolean isActive);
    
    @Query("{ 'role.name': ?0 }")
    List<AdminUser> findByRoleName(String roleName);
    
    @Query("{ '$or': [ " +
           "{ 'name': { '$regex': ?0, '$options': 'i' } }, " +
           "{ 'email': { '$regex': ?0, '$options': 'i' } } " +
           "] }")
    Page<AdminUser> findByNameOrEmailContainingIgnoreCase(String searchTerm, Pageable pageable);
    
    @Query("{ 'lastLogin': { '$gte': ?0 } }")
    List<AdminUser> findByLastLoginAfter(LocalDateTime date);
    
    @Query("{ 'createdAt': { '$gte': ?0, '$lte': ?1 } }")
    List<AdminUser> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    long countByIsActive(boolean isActive);
    
    long countByRoleName(String roleName);
    
    boolean existsByEmail(String email);
}