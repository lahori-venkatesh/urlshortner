package com.urlshortener.security;

import com.urlshortener.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    @Lazy
    private UserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String requestTokenHeader = request.getHeader("Authorization");

        String userId = null;
        String jwtToken = null;

        // JWT Token is in the form "Bearer token". Remove Bearer word and get only the Token
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            try {
                userId = jwtUtil.extractUserId(jwtToken);
            } catch (Exception e) {
                logger.warn("Unable to get JWT Token or JWT Token has expired");
            }
        }

        // Once we get the token validate it.
        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            try {
                // Check if user exists
                var userOpt = userService.findById(userId);
            if (userOpt.isPresent() && jwtUtil.validateToken(jwtToken, userId)) {
                
                com.urlshortener.model.User user = userOpt.get();
                
                // Create UserDetails for Spring Security - use user ID as username for easier access
                UserDetails userDetails = User.builder()
                        .username(user.getId()) // Use user ID instead of email for easier access in controllers
                        .password("") // We don't need password for JWT auth
                        .authorities(new ArrayList<>())
                        .build();

                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = 
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                usernamePasswordAuthenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // Set the user in the request for easy access
                request.setAttribute("currentUser", user);
                request.setAttribute("currentUserId", user.getId());
                request.setAttribute("currentUserEmail", user.getEmail());
                
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
            } catch (Exception e) {
                logger.warn("Error validating user: " + e.getMessage());
            }
        }
        chain.doFilter(request, response);
    }
}