package com.urlshortener.config;

import com.urlshortener.security.DomainQuotaMethodSecurityExpressionRoot;
import com.urlshortener.repository.UserRepository;
import com.urlshortener.repository.TeamRepository;
import com.urlshortener.repository.DomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.Authentication;
import org.aopalliance.intercept.MethodInvocation;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class DomainSecurityConfig {
    
    // For now, we'll use the default method security configuration
    // Custom domain quota checks can be implemented as separate service methods
    // This avoids the complexity of custom security expression handlers
}