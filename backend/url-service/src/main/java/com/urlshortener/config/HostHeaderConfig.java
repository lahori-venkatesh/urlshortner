package com.urlshortener.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
public class HostHeaderConfig {

    @Bean
    public OncePerRequestFilter hostHeaderFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, 
                                          HttpServletResponse response, 
                                          FilterChain filterChain) throws ServletException, IOException {
                
                // Log the incoming host for debugging
                String host = request.getHeader("Host");
                String requestURI = request.getRequestURI();
                
                // Allow all hosts - this enables custom domains to work
                System.out.println("🌐 Incoming request: " + host + requestURI);
                
                // Continue with the request
                filterChain.doFilter(request, response);
            }
        };
    }
}