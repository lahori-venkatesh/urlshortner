package com.urlshortener.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark controller methods that require specific plan validation
 * Usage examples:
 * 
 * @RequiresPlan(feature = "customDomain")
 * @RequiresPlan(feature = "urlCreation", checkLimit = true)
 * @RequiresPlan(feature = "teamCollaboration")
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPlan {
    
    /**
     * The feature name to check (matches frontend feature names)
     */
    String feature();
    
    /**
     * Whether to check usage limits (for countable resources like URLs, QR codes, files)
     */
    boolean checkLimit() default false;
    
    /**
     * Custom error message (optional)
     */
    String message() default "";
}