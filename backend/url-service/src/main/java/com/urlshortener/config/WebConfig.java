package com.urlshortener.config;

import com.urlshortener.interceptor.PerformanceInterceptor;
import com.urlshortener.interceptor.PlanValidationInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private PerformanceInterceptor performanceInterceptor;
    
    @Autowired
    private PlanValidationInterceptor planValidationInterceptor;
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Allow all custom domains and origins for redirect endpoints
        registry.addMapping("/**")
                .allowedOriginPatterns("*")  // Use patterns to allow all custom domains
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("Location", "X-Forwarded-Host", "X-Original-Host")  // Important for redirects
                .allowCredentials(false)
                .maxAge(3600);
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Performance interceptor
        registry.addInterceptor(performanceInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                    "/api/v1/monitoring/**", // Exclude monitoring endpoints to avoid recursion
                    "/actuator/**"           // Exclude actuator endpoints
                );
        
        // Plan validation interceptor (disabled by default - use aspect instead)
        // Uncomment to enable interceptor-based validation instead of aspect
        /*
        registry.addInterceptor(planValidationInterceptor)
                .addPathPatterns("/api/v1/**")
                .excludePathPatterns(
                    "/api/v1/auth/**",       // Exclude auth endpoints
                    "/api/v1/monitoring/**", // Exclude monitoring endpoints
                    "/actuator/**"           // Exclude actuator endpoints
                );
        */
    }
}