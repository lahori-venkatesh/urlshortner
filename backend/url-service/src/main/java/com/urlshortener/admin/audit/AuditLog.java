package com.urlshortener.admin.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    
    /**
     * The action type for audit logging
     */
    String action();
    
    /**
     * The entity type being acted upon
     */
    String entity();
    
    /**
     * Description of the action (optional)
     */
    String description() default "";
    
    /**
     * Whether to log the request payload
     */
    boolean logPayload() default false;
    
    /**
     * Whether to log the response
     */
    boolean logResponse() default false;
}