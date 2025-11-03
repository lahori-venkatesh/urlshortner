package com.urlshortener.admin.security;

import com.urlshortener.admin.service.AdminUserService;
import com.urlshortener.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AdminJwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AdminUserService adminUserService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        // Only apply to admin endpoints
        String requestPath = request.getRequestURI();
        if (!requestPath.startsWith("/api/v1/admin")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip authentication for login endpoint
        if (requestPath.equals("/api/v1/admin/auth/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                email = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                logger.error("JWT token extraction failed", e);
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                var adminUser = adminUserService.findByEmail(email);
                
                if (adminUser.isPresent() && adminUser.get().isActive() && 
                    jwtUtil.validateToken(token, email)) {
                    
                    // Create authorities from admin permissions
                    List<SimpleGrantedAuthority> authorities = adminUser.get().getPermissions()
                        .stream()
                        .map(permission -> new SimpleGrantedAuthority("ADMIN_" + permission))
                        .collect(Collectors.toList());
                    
                    // Add role authority
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + adminUser.get().getRole().getName()));

                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(adminUser.get(), null, authorities);
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    // Store admin user in request for audit logging
                    request.setAttribute("adminUser", adminUser.get());
                }
            } catch (Exception e) {
                logger.error("Admin authentication failed", e);
            }
        }

        filterChain.doFilter(request, response);
    }
}