package com.urlshortener.service;

import com.urlshortener.model.User;
import com.urlshortener.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BillingService {
    
    private static final Logger logger = LoggerFactory.getLogger(BillingService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private SubscriptionService subscriptionService;
    
    /**
     * Process successful payment and upgrade user
     */
    @Transactional
    public boolean processPaymentSuccess(String userId, String planType, String paymentId, 
                                        String orderId, Double amount, Map<String, Object> paymentDetails) {
        try {
            logger.info("Processing payment success for user: {}, plan: {}", userId, planType);
            
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                logger.error("User not found: {}", userId);
                return false;
            }
            
            User user = userOpt.get();
            String oldPlan = user.getPlan();
            
            // Upgrade user plan
            try {
                subscriptionService.upgradeToPremium(userId, planType, paymentId, null);
            } catch (Exception e) {
                logger.error("Failed to upgrade user plan: {}", e.getMessage());
                return false;
            }
            
            // Send payment success email
            sendPaymentSuccessEmail(user, planType, paymentId, orderId, amount, paymentDetails);
            
            logger.info("Payment processed successfully for user: {}, upgraded from {} to {}", 
                       userId, oldPlan, planType);
            return true;
            
        } catch (Exception e) {
            logger.error("Error processing payment success: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Process failed payment
     */
    public void processPaymentFailure(String userId, String planType, String orderId, 
                                     String errorMessage, Map<String, Object> paymentDetails) {
        try {
            logger.info("Processing payment failure for user: {}, plan: {}", userId, planType);
            
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                logger.error("User not found: {}", userId);
                return;
            }
            
            User user = userOpt.get();
            
            // Send payment failure email
            sendPaymentFailureEmail(user, planType, orderId, errorMessage, paymentDetails);
            
            logger.info("Payment failure processed for user: {}", userId);
            
        } catch (Exception e) {
            logger.error("Error processing payment failure: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Check and send trial expiry reminders
     */
    public void checkAndSendTrialExpiryReminders() {
        try {
            logger.info("Checking for trial expiry reminders");
            
            LocalDateTime now = LocalDateTime.now();
            
            // Find users whose trial expires soon
            List<User> users = userRepository.findAll();
            
            for (User user : users) {
                // Check if user has a trial or subscription expiry date
                if (user.getSubscriptionExpiry() != null) {
                    long daysUntilExpiry = ChronoUnit.DAYS.between(now, user.getSubscriptionExpiry());
                    
                    // Only send reminders for trial users (FREE plan with expiry date)
                    if ("FREE".equals(user.getPlan()) || user.getPlan() == null) {
                        // Send reminder 3 days before expiry
                        if (daysUntilExpiry == 3) {
                            sendTrialExpiryReminderEmail(user, 3);
                            logger.info("Sent 3-day trial expiry reminder to user: {}", user.getId());
                        }
                        // Send reminder 1 day before expiry
                        else if (daysUntilExpiry == 1) {
                            sendTrialExpiryReminderEmail(user, 1);
                            logger.info("Sent 1-day trial expiry reminder to user: {}", user.getId());
                        }
                        // Send reminder on expiry day
                        else if (daysUntilExpiry == 0) {
                            sendTrialExpiryReminderEmail(user, 0);
                            logger.info("Sent trial expiry day reminder to user: {}", user.getId());
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("Error checking trial expiry reminders: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send payment success email with invoice
     */
    private void sendPaymentSuccessEmail(User user, String planType, String paymentId, 
                                        String orderId, Double amount, Map<String, Object> paymentDetails) {
        try {
            String subject = "🎉 Payment Successful - Welcome to " + getPlanDisplayName(planType);
            String htmlBody = buildPaymentSuccessEmailHtml(user, planType, paymentId, orderId, amount, paymentDetails);
            
            emailService.sendHtmlEmail(user.getEmail(), subject, "Payment Successful", htmlBody);
            logger.info("Payment success email sent to: {}", user.getEmail());
            
        } catch (Exception e) {
            logger.error("Error sending payment success email: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send payment failure email
     */
    private void sendPaymentFailureEmail(User user, String planType, String orderId, 
                                        String errorMessage, Map<String, Object> paymentDetails) {
        try {
            String subject = "❌ Payment Failed - Action Required";
            String htmlBody = buildPaymentFailureEmailHtml(user, planType, orderId, errorMessage, paymentDetails);
            
            emailService.sendHtmlEmail(user.getEmail(), subject, "Payment Failed", htmlBody);
            logger.info("Payment failure email sent to: {}", user.getEmail());
            
        } catch (Exception e) {
            logger.error("Error sending payment failure email: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send trial expiry reminder email
     */
    private void sendTrialExpiryReminderEmail(User user, int daysRemaining) {
        try {
            String subject = daysRemaining == 0 
                ? "⏰ Your Trial Expires Today - Upgrade Now!" 
                : String.format("⏰ Your Trial Expires in %d Day%s", daysRemaining, daysRemaining > 1 ? "s" : "");
            
            String htmlBody = buildTrialExpiryReminderEmailHtml(user, daysRemaining);
            
            emailService.sendHtmlEmail(user.getEmail(), subject, "Trial Expiry Reminder", htmlBody);
            logger.info("Trial expiry reminder email sent to: {}", user.getEmail());
            
        } catch (Exception e) {
            logger.error("Error sending trial expiry reminder email: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Build payment success email HTML
     */
    private String buildPaymentSuccessEmailHtml(User user, String planType, String paymentId, 
                                                String orderId, Double amount, Map<String, Object> paymentDetails) {
        String planName = getPlanDisplayName(planType);
        String billingCycle = planType.contains("YEARLY") ? "Yearly" : "Monthly";
        LocalDateTime now = LocalDateTime.now();
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Successful</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🎉 Payment Successful!</h1>
                                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to %s</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                            Hi <strong>%s</strong>,
                                        </p>
                                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                            Thank you for upgrading to <strong>%s</strong>! Your payment has been processed successfully, and your account has been upgraded with all premium features.
                                        </p>
                                        
                                        <!-- Invoice Details -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 30px 0; border: 1px solid #e9ecef;">
                                            <tr>
                                                <td style="padding: 20px;">
                                                    <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">Invoice Details</h3>
                                                    <table width="100%%" cellpadding="8" cellspacing="0">
                                                        <tr>
                                                            <td style="color: #6c757d; font-size: 14px;">Order ID:</td>
                                                            <td style="color: #212529; font-size: 14px; text-align: right; font-weight: 600;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: #6c757d; font-size: 14px;">Payment ID:</td>
                                                            <td style="color: #212529; font-size: 14px; text-align: right; font-weight: 600;">%s</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: #6c757d; font-size: 14px;">Plan:</td>
                                                            <td style="color: #212529; font-size: 14px; text-align: right; font-weight: 600;">%s (%s)</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: #6c757d; font-size: 14px;">Amount Paid:</td>
                                                            <td style="color: #28a745; font-size: 18px; text-align: right; font-weight: 700;">₹%.2f</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: #6c757d; font-size: 14px;">Date:</td>
                                                            <td style="color: #212529; font-size: 14px; text-align: right; font-weight: 600;">%s</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Features -->
                                        <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                            <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 16px;">✨ Your Premium Features:</h3>
                                            <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 14px; line-height: 1.8;">
                                                %s
                                            </ul>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="https://pebly.vercel.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                                        Go to Dashboard →
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                            If you have any questions, feel free to reach out to our support team at <a href="mailto:support@pebly.com" style="color: #667eea;">support@pebly.com</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                                            Thank you for choosing Pebly!
                                        </p>
                                        <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                                            © 2025 Pebly. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """,
            planName,
            user.getName() != null ? user.getName() : user.getEmail(),
            planName,
            orderId,
            paymentId,
            planName,
            billingCycle,
            amount,
            now.toString(),
            getPlanFeaturesList(planType)
        );
    }
    
    /**
     * Build payment failure email HTML
     */
    private String buildPaymentFailureEmailHtml(User user, String planType, String orderId, 
                                                String errorMessage, Map<String, Object> paymentDetails) {
        String planName = getPlanDisplayName(planType);
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Failed</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #dc3545 0%%, #c82333 100%%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">❌ Payment Failed</h1>
                                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We couldn't process your payment</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                            Hi <strong>%s</strong>,
                                        </p>
                                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                            We attempted to process your payment for <strong>%s</strong>, but unfortunately it failed.
                                        </p>
                                        
                                        <!-- Error Details -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-radius: 8px; margin: 30px 0; border: 1px solid #ffc107;">
                                            <tr>
                                                <td style="padding: 20px;">
                                                    <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Error Details</h3>
                                                    <p style="color: #856404; font-size: 14px; margin: 0;">
                                                        <strong>Order ID:</strong> %s<br>
                                                        <strong>Reason:</strong> %s
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Common Reasons -->
                                        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                                            <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 16px;">Common Reasons for Payment Failure:</h3>
                                            <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                                                <li>Insufficient funds in your account</li>
                                                <li>Incorrect card details or expired card</li>
                                                <li>Bank declined the transaction</li>
                                                <li>Network or connectivity issues</li>
                                                <li>Card limit exceeded</li>
                                            </ul>
                                        </div>
                                        
                                        <!-- CTA Buttons -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="https://pebly.vercel.app/pricing" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
                                                        Try Again →
                                                    </a>
                                                    <a href="mailto:support@pebly.com" style="display: inline-block; background-color: #6c757d; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 0 10px 0;">
                                                        Contact Support
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                            Need help? Our support team is here to assist you at <a href="mailto:support@pebly.com" style="color: #667eea;">support@pebly.com</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                                            We're here to help!
                                        </p>
                                        <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                                            © 2025 Pebly. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """,
            user.getName() != null ? user.getName() : user.getEmail(),
            planName,
            orderId,
            errorMessage != null ? errorMessage : "Payment processing error"
        );
    }
    
    /**
     * Build trial expiry reminder email HTML
     */
    private String buildTrialExpiryReminderEmailHtml(User user, int daysRemaining) {
        String urgencyMessage = daysRemaining == 0 
            ? "Your trial expires <strong>today</strong>!" 
            : String.format("Your trial expires in <strong>%d day%s</strong>!", daysRemaining, daysRemaining > 1 ? "s" : "");
        
        String urgencyColor = daysRemaining == 0 ? "#dc3545" : daysRemaining == 1 ? "#fd7e14" : "#ffc107";
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Trial Expiry Reminder</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, %s 0%%, %s 100%%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">⏰ Trial Expiring Soon</h1>
                                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Don't lose access to premium features</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                            Hi <strong>%s</strong>,
                                        </p>
                                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                            %s
                                        </p>
                                        
                                        <!-- Urgency Box -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: %s; border-radius: 8px; margin: 30px 0;">
                                            <tr>
                                                <td style="padding: 30px; text-align: center;">
                                                    <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">%d Day%s Left</h2>
                                                    <p style="color: #ffffff; margin: 0; font-size: 16px; opacity: 0.9;">Upgrade now to continue enjoying premium features</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Features You'll Lose -->
                                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                            <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">⚠️ Features You'll Lose:</h3>
                                            <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
                                                <li>Custom domains for branded links</li>
                                                <li>Advanced analytics and insights</li>
                                                <li>Custom QR code designs with logo</li>
                                                <li>Password-protected links</li>
                                                <li>Link expiration settings</li>
                                                <li>Team collaboration features</li>
                                                <li>Priority support</li>
                                            </ul>
                                        </div>
                                        
                                        <!-- Pricing Options -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td width="48%%" style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; vertical-align: top;">
                                                    <h3 style="color: #495057; margin: 0 0 10px 0; font-size: 18px;">Pro Monthly</h3>
                                                    <p style="color: #28a745; margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">₹299<span style="font-size: 16px; color: #6c757d;">/mo</span></p>
                                                    <p style="color: #6c757d; margin: 0; font-size: 14px;">Perfect for individuals</p>
                                                </td>
                                                <td width="4%%"></td>
                                                <td width="48%%" style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 20px; border-radius: 8px; vertical-align: top;">
                                                    <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 18px;">Pro Yearly</h3>
                                                    <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">₹2,999<span style="font-size: 16px; opacity: 0.8;">/yr</span></p>
                                                    <p style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.9;">Save 17%% annually!</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- CTA Button -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="https://pebly.vercel.app/pricing" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                                        Upgrade Now →
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                                            Questions? Contact us at <a href="mailto:support@pebly.com" style="color: #667eea;">support@pebly.com</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                                            Don't miss out on premium features!
                                        </p>
                                        <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                                            © 2025 Pebly. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """,
            urgencyColor, urgencyColor,
            user.getName() != null ? user.getName() : user.getEmail(),
            urgencyMessage,
            urgencyColor,
            daysRemaining, daysRemaining == 1 ? "" : "s"
        );
    }
    
    /**
     * Get plan display name
     */
    private String getPlanDisplayName(String planType) {
        return switch (planType) {
            case "PRO_MONTHLY" -> "Pro Monthly";
            case "PRO_YEARLY" -> "Pro Yearly";
            case "BUSINESS_MONTHLY" -> "Business Monthly";
            case "BUSINESS_YEARLY" -> "Business Yearly";
            default -> planType;
        };
    }
    
    /**
     * Get plan features list HTML
     */
    private String getPlanFeaturesList(String planType) {
        boolean isBusiness = planType.contains("BUSINESS");
        
        StringBuilder features = new StringBuilder();
        features.append("<li>✅ Unlimited URL shortening</li>");
        features.append("<li>✅ Custom domains (").append(isBusiness ? "3" : "1").append(")</li>");
        features.append("<li>✅ Advanced analytics & insights</li>");
        features.append("<li>✅ Custom QR codes with logo</li>");
        features.append("<li>✅ Password-protected links</li>");
        features.append("<li>✅ Link expiration settings</li>");
        features.append("<li>✅ Team collaboration (").append(isBusiness ? "10" : "3").append(" members)</li>");
        
        if (isBusiness) {
            features.append("<li>✅ White-label branding</li>");
            features.append("<li>✅ Priority support</li>");
            features.append("<li>✅ API access</li>");
        }
        
        return features.toString();
    }
}
