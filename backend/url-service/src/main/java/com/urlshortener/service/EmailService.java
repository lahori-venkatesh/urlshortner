package com.urlshortener.service;

import com.urlshortener.model.SupportTicket;
import com.urlshortener.model.SupportResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    @Value("${app.frontend.url:https://pebly.vercel.app}")
    private String frontendUrl;
    
    @Value("${app.support.email:support@pebly.com}")
    private String supportEmail;
    
    /**
     * Send ticket created confirmation email to user
     */
    public void sendTicketCreatedEmail(String userEmail, String userName, String ticketId, String subject) {
        try {
            String emailSubject = "Support Ticket Created - #" + ticketId.substring(ticketId.length() - 6);
            String emailBody = buildTicketCreatedEmailBody(userName, ticketId, subject);
            
            // TODO: Implement actual email sending (SMTP, SendGrid, etc.)
            logger.info("Sending ticket created email to {} for ticket {}", userEmail, ticketId);
            
            // For now, just log the email content
            logger.debug("Email Subject: {}", emailSubject);
            logger.debug("Email Body: {}", emailBody);
            
        } catch (Exception e) {
            logger.error("Failed to send ticket created email to {}", userEmail, e);
        }
    }
    
    /**
     * Send agent response email to user
     */
    public void sendAgentResponseEmail(String userEmail, String userName, String ticketId, 
                                     String ticketSubject, String responseMessage) {
        try {
            String emailSubject = "New Response to Your Support Ticket - #" + ticketId.substring(ticketId.length() - 6);
            String emailBody = buildAgentResponseEmailBody(userName, ticketId, ticketSubject, responseMessage);
            
            logger.info("Sending agent response email to {} for ticket {}", userEmail, ticketId);
            logger.debug("Email Subject: {}", emailSubject);
            logger.debug("Email Body: {}", emailBody);
            
        } catch (Exception e) {
            logger.error("Failed to send agent response email to {}", userEmail, e);
        }
    }
    
    /**
     * Send ticket resolved email to user
     */
    public void sendTicketResolvedEmail(String userEmail, String userName, String ticketId, String subject) {
        try {
            String emailSubject = "Support Ticket Resolved - #" + ticketId.substring(ticketId.length() - 6);
            String emailBody = buildTicketResolvedEmailBody(userName, ticketId, subject);
            
            logger.info("Sending ticket resolved email to {} for ticket {}", userEmail, ticketId);
            logger.debug("Email Subject: {}", emailSubject);
            logger.debug("Email Body: {}", emailBody);
            
        } catch (Exception e) {
            logger.error("Failed to send ticket resolved email to {}", userEmail, e);
        }
    }
    
    /**
     * Send new ticket notification to support team
     */
    public void sendNewTicketNotificationToSupport(SupportTicket ticket) {
        try {
            String emailSubject = String.format("[%s] New %s Support Ticket - #%s", 
                                               ticket.getPriority().getDisplayName(),
                                               ticket.getCategory().getDisplayName(),
                                               ticket.getId().substring(ticket.getId().length() - 6));
            
            String emailBody = buildSupportTeamNotificationBody(ticket);
            
            logger.info("Sending new ticket notification to support team for ticket {}", ticket.getId());
            logger.debug("Email Subject: {}", emailSubject);
            logger.debug("Email Body: {}", emailBody);
            
        } catch (Exception e) {
            logger.error("Failed to send new ticket notification to support team", e);
        }
    }
    
    /**
     * Send user response notification to assigned agent
     */
    public void sendUserResponseNotificationToAgent(SupportTicket ticket, SupportResponse response) {
        try {
            String emailSubject = String.format("User Response - Ticket #%s", 
                                               ticket.getId().substring(ticket.getId().length() - 6));
            
            String emailBody = buildAgentNotificationBody(ticket, response);
            
            logger.info("Sending user response notification to agent {} for ticket {}", 
                       ticket.getAssignedAgent(), ticket.getId());
            logger.debug("Email Subject: {}", emailSubject);
            logger.debug("Email Body: {}", emailBody);
            
        } catch (Exception e) {
            logger.error("Failed to send user response notification to agent", e);
        }
    }
    
    /**
     * Build ticket created email body
     */
    private String buildTicketCreatedEmailBody(String userName, String ticketId, String subject) {
        return String.format("""
            Hi %s,
            
            Thank you for contacting Pebly Support! We've received your support request and our team will get back to you soon.
            
            Ticket Details:
            • Ticket ID: #%s
            • Subject: %s
            • Status: Open
            
            What happens next?
            • Our support team will review your request
            • You'll receive updates via email
            • You can track your ticket status in your dashboard
            
            Need urgent help?
            • For payment issues, include your transaction ID
            • For technical problems, provide steps to reproduce the issue
            • For account issues, verify your email address
            
            View your ticket: %s/dashboard
            
            Best regards,
            Pebly Support Team
            
            ---
            This is an automated message. Please do not reply to this email.
            For immediate assistance, visit: %s/contact
            """, 
            userName, 
            ticketId.substring(ticketId.length() - 6), 
            subject,
            frontendUrl,
            frontendUrl
        );
    }
    
    /**
     * Build agent response email body
     */
    private String buildAgentResponseEmailBody(String userName, String ticketId, 
                                             String ticketSubject, String responseMessage) {
        return String.format("""
            Hi %s,
            
            You have a new response from our support team regarding your ticket.
            
            Ticket Details:
            • Ticket ID: #%s
            • Subject: %s
            
            Support Team Response:
            %s
            
            Next Steps:
            • Reply to continue the conversation
            • View full conversation in your dashboard
            • Mark as resolved if your issue is fixed
            
            View your ticket: %s/dashboard
            
            Best regards,
            Pebly Support Team
            
            ---
            This is an automated message. Please do not reply to this email.
            For immediate assistance, visit: %s/contact
            """, 
            userName, 
            ticketId.substring(ticketId.length() - 6), 
            ticketSubject,
            responseMessage,
            frontendUrl,
            frontendUrl
        );
    }
    
    /**
     * Build ticket resolved email body
     */
    private String buildTicketResolvedEmailBody(String userName, String ticketId, String subject) {
        return String.format("""
            Hi %s,
            
            Great news! Your support ticket has been resolved.
            
            Ticket Details:
            • Ticket ID: #%s
            • Subject: %s
            • Status: Resolved
            
            Was this helpful?
            We'd love to hear your feedback about our support experience.
            
            Still need help?
            If your issue isn't fully resolved, you can reopen this ticket or create a new one.
            
            View your ticket: %s/dashboard
            
            Thank you for using Pebly!
            
            Best regards,
            Pebly Support Team
            
            ---
            This is an automated message. Please do not reply to this email.
            For immediate assistance, visit: %s/contact
            """, 
            userName, 
            ticketId.substring(ticketId.length() - 6), 
            subject,
            frontendUrl,
            frontendUrl
        );
    }
    
    /**
     * Build support team notification body
     */
    private String buildSupportTeamNotificationBody(SupportTicket ticket) {
        return String.format("""
            New Support Ticket Received
            
            Ticket Details:
            • ID: #%s
            • Category: %s
            • Priority: %s
            • Status: %s
            • User: %s (%s)
            • Created: %s
            
            Subject: %s
            
            Message:
            %s
            
            User Information:
            • Email: %s
            • User Agent: %s
            • IP Address: %s
            • Current Page: %s
            
            Actions Required:
            • Review and assign ticket
            • Respond within SLA timeframe
            • Update ticket status
            
            View ticket in admin panel: %s/admin/tickets/%s
            """, 
            ticket.getId().substring(ticket.getId().length() - 6),
            ticket.getCategory().getDisplayName(),
            ticket.getPriority().getDisplayName(),
            ticket.getStatus().getDisplayName(),
            ticket.getUserName(),
            ticket.getUserEmail(),
            ticket.getCreatedAt(),
            ticket.getSubject(),
            ticket.getMessage(),
            ticket.getUserEmail(),
            ticket.getUserAgent(),
            ticket.getIpAddress(),
            ticket.getCurrentPage(),
            frontendUrl,
            ticket.getId()
        );
    }
    
    /**
     * Build agent notification body
     */
    private String buildAgentNotificationBody(SupportTicket ticket, SupportResponse response) {
        return String.format("""
            User Response Received
            
            Ticket Details:
            • ID: #%s
            • Subject: %s
            • User: %s (%s)
            • Priority: %s
            
            User Response:
            %s
            
            Response Time: %s
            
            Actions Required:
            • Review user response
            • Provide assistance
            • Update ticket status if resolved
            
            View ticket: %s/admin/tickets/%s
            """, 
            ticket.getId().substring(ticket.getId().length() - 6),
            ticket.getSubject(),
            ticket.getUserName(),
            ticket.getUserEmail(),
            ticket.getPriority().getDisplayName(),
            response.getMessage(),
            response.getTimestamp(),
            frontendUrl,
            ticket.getId()
        );
    }
}