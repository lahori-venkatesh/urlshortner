package com.urlshortener;

import com.urlshortener.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/redirect/**").permitAll()
                .requestMatchers("/api/v1/urls/*/click").permitAll()
                .requestMatchers("/api/v1/qr/*/scan").permitAll()
                .requestMatchers("/api/v1/files/view/**").permitAll()
                .requestMatchers("/api/actuator/**").permitAll()
                .requestMatchers("/api/database/**").permitAll()
                .requestMatchers("/api/domains/**").permitAll()
                .requestMatchers("/api/monitoring/**").permitAll()
                // Allow anonymous creation but protect management endpoints
                .requestMatchers(HttpMethod.POST, "/api/v1/urls").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/qr").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/files/upload").permitAll()
                // Protected endpoints - require authentication
                .requestMatchers("/api/v1/urls/**").authenticated()
                .requestMatchers("/api/v1/qr/**").authenticated()
                .requestMatchers("/api/v1/files/**").authenticated()
                .requestMatchers("/api/v1/analytics/**").authenticated()
                .requestMatchers("/api/v1/teams/**").authenticated()
                .requestMatchers("/api/v1/subscriptions/**").authenticated()
                .requestMatchers("/api/v1/support/**").authenticated()
                // All other requests
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}