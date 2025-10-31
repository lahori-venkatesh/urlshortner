package com.urlshortener.controller;

import com.urlshortener.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/email")
@CrossOrigin(origins = "*")
public class EmailTestController {

    @Autowired
    private EmailService emailService;

    /**
     * Test endpoint to send a test email
     * Only use this for testing purposes
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestBody Map<String, String> request) {
        try {
            String toEmail = request.get("email");
            
            if (toEmail == null || toEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email address is required"
                ));
            }
            
            String subject = "Test Email from Pebly";
            String body = "This is a test email to verify SendGrid integration is working correctly.\n\n" +
                         "If you received this email, the email service is configured properly!\n\n" +
                         "Best regards,\nThe Pebly Team";
            
            emailService.sendEmail(toEmail.trim(), subject, body);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test email sent successfully to " + toEmail
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to send test email: " + e.getMessage()
            ));
        }
    }

    /**
     * Test endpoint to send a test HTML email
     */
    @PostMapping("/test-html")
    public ResponseEntity<Map<String, Object>> sendTestHtmlEmail(@RequestBody Map<String, String> request) {
        try {
            String toEmail = request.get("email");
            
            if (toEmail == null || toEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email address is required"
                ));
            }
            
            String subject = "🎉 HTML Test Email from Pebly";
            String plainText = "This is a test HTML email to verify SendGrid integration.\n\n" +
                              "If you received this email, the HTML email service is working!\n\n" +
                              "Best regards,\nThe Pebly Team";
            
            String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Test Email</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; }
                        .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin-top: 20px; }
                        .success { color: #28a745; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Test Email</h1>
                            <p>SendGrid Integration Test</p>
                        </div>
                        <div class="content">
                            <h2>Success!</h2>
                            <p class="success">✅ SendGrid email integration is working correctly!</p>
                            <p>This is a test HTML email sent from Pebly to verify that:</p>
                            <ul>
                                <li>SendGrid API is properly configured</li>
                                <li>HTML emails are being sent successfully</li>
                                <li>Email templates are rendering correctly</li>
                            </ul>
                            <p>Best regards,<br><strong>The Pebly Team</strong></p>
                        </div>
                    </div>
                </body>
                </html>
                """;
            
            emailService.sendHtmlEmail(toEmail.trim(), subject, plainText, htmlBody);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test HTML email sent successfully to " + toEmail
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to send test HTML email: " + e.getMessage()
            ));
        }
    }
}