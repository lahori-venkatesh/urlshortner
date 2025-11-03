package com.urlshortener.admin.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.admin.model.AdminUser;
import com.urlshortener.admin.model.AuditEvent;
import com.urlshortener.admin.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
@ConditionalOnProperty(name = "app.admin.enabled", havingValue = "true", matchIfMissing = false)
public class AuditAspect {

    @Autowired
    private AuditService auditService;

    @Autowired
    private ObjectMapper objectMapper;

    @Around("@annotation(AuditLog)")
    public Object auditLog(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        AuditLog auditLog = method.getAnnotation(AuditLog.class);

        // Get HTTP request
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

        // Get admin user from request
        AdminUser adminUser = request != null ? 
            (AdminUser) request.getAttribute("adminUser") : null;

        if (adminUser == null) {
            // If no admin user, proceed without audit
            return joinPoint.proceed();
        }

        // Create audit event
        AuditEvent event = new AuditEvent();
        event.setActorId(adminUser.getId());
        event.setActorName(adminUser.getName());
        event.setActorEmail(adminUser.getEmail());
        event.setActionType(auditLog.action());
        event.setEntityType(auditLog.entity());
        event.setDescription(auditLog.description());

        if (request != null) {
            event.setIpAddress(getClientIpAddress(request));
            event.setUserAgent(request.getHeader("User-Agent"));
            event.setSessionId(request.getSession().getId());
        }

        // Extract entity ID from method parameters
        Object[] args = joinPoint.getArgs();
        String entityId = extractEntityId(args, signature.getParameterNames());
        event.setEntityId(entityId);

        // Log payload if requested
        Map<String, Object> metadata = new HashMap<>();
        if (auditLog.logPayload() && args.length > 0) {
            try {
                metadata.put("payload", objectMapper.writeValueAsString(args));
            } catch (Exception e) {
                metadata.put("payload_error", "Failed to serialize payload");
            }
        }

        Object result = null;
        try {
            // Execute the method
            result = joinPoint.proceed();
            event.setSuccess(true);

            // Log response if requested
            if (auditLog.logResponse() && result != null) {
                try {
                    metadata.put("response", objectMapper.writeValueAsString(result));
                } catch (Exception e) {
                    metadata.put("response_error", "Failed to serialize response");
                }
            }

        } catch (Exception e) {
            event.setSuccess(false);
            event.setErrorMessage(e.getMessage());
            metadata.put("error", e.getClass().getSimpleName());
            throw e;
        } finally {
            event.setMetadata(metadata);
            
            // Save audit event asynchronously
            try {
                auditService.logEvent(event);
            } catch (Exception e) {
                // Don't fail the main operation if audit logging fails
                System.err.println("Failed to log audit event: " + e.getMessage());
            }
        }

        return result;
    }

    private String extractEntityId(Object[] args, String[] paramNames) {
        // Look for common ID parameter names
        for (int i = 0; i < paramNames.length; i++) {
            String paramName = paramNames[i];
            if (paramName.equals("id") || paramName.equals("userId") || 
                paramName.equals("entityId") || paramName.endsWith("Id")) {
                return args[i] != null ? args[i].toString() : null;
            }
        }
        
        // If no ID parameter found, try to get ID from first parameter if it's a string
        if (args.length > 0 && args[0] instanceof String) {
            return (String) args[0];
        }
        
        return null;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}