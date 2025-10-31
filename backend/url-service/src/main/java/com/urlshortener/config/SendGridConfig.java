package com.urlshortener.config;

import com.sendgrid.SendGrid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class SendGridConfig {

    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    @Bean
    public SendGrid sendGrid() {
        if (!StringUtils.hasText(sendGridApiKey)) {
            // Return a mock SendGrid instance if API key is not configured
            // This prevents the application from failing to start
            return new SendGrid("mock-api-key");
        }
        return new SendGrid(sendGridApiKey);
    }
}