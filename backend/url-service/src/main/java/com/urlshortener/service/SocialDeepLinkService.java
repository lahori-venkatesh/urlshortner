package com.urlshortener.service;

import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class SocialDeepLinkService {
    
    /**
     * Generate WhatsApp deep link for direct messaging
     */
    public String generateWhatsAppLink(WhatsAppLinkRequest request) {
        StringBuilder whatsappLink = new StringBuilder();
        
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            // Direct message to specific number
            whatsappLink.append("https://wa.me/");
            
            // Clean phone number (remove spaces, dashes, etc.)
            String cleanNumber = request.getPhoneNumber().replaceAll("[^0-9+]", "");
            
            // Add country code if not present
            if (!cleanNumber.startsWith("+")) {
                if (cleanNumber.startsWith("91") || cleanNumber.length() == 10) {
                    cleanNumber = "+91" + (cleanNumber.startsWith("91") ? cleanNumber.substring(2) : cleanNumber);
                } else {
                    cleanNumber = "+" + cleanNumber;
                }
            }
            
            whatsappLink.append(cleanNumber.substring(1)); // Remove + for wa.me format
            
            // Add pre-filled message
            if (request.getMessage() != null && !request.getMessage().isEmpty()) {
                whatsappLink.append("?text=")
                           .append(URLEncoder.encode(request.getMessage(), StandardCharsets.UTF_8));
            }
        } else {
            // General WhatsApp share
            whatsappLink.append("whatsapp://send");
            if (request.getMessage() != null && !request.getMessage().isEmpty()) {
                whatsappLink.append("?text=")
                           .append(URLEncoder.encode(request.getMessage(), StandardCharsets.UTF_8));
            }
        }
        
        return whatsappLink.toString();
    }
    
    /**
     * Generate WhatsApp Business link
     */
    public String generateWhatsAppBusinessLink(String businessNumber, String message) {
        StringBuilder link = new StringBuilder("https://api.whatsapp.com/send?phone=");
        
        // Clean and format business number
        String cleanNumber = businessNumber.replaceAll("[^0-9+]", "");
        if (!cleanNumber.startsWith("+91")) {
            cleanNumber = "+91" + cleanNumber;
        }
        
        link.append(cleanNumber.substring(1)); // Remove + for API format
        
        if (message != null && !message.isEmpty()) {
            link.append("&text=").append(URLEncoder.encode(message, StandardCharsets.UTF_8));
        }
        
        return link.toString();
    }
    
    /**
     * Generate Telegram deep link
     */
    public String generateTelegramLink(TelegramLinkRequest request) {
        StringBuilder telegramLink = new StringBuilder();
        
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            // Direct message to user
            telegramLink.append("https://t.me/").append(request.getUsername());
            
            if (request.getMessage() != null && !request.getMessage().isEmpty()) {
                telegramLink.append("?text=")
                           .append(URLEncoder.encode(request.getMessage(), StandardCharsets.UTF_8));
            }
        } else if (request.getChannelId() != null && !request.getChannelId().isEmpty()) {
            // Join channel/group
            telegramLink.append("https://t.me/").append(request.getChannelId());
        } else if (request.getBotUsername() != null && !request.getBotUsername().isEmpty()) {
            // Start bot conversation
            telegramLink.append("https://t.me/").append(request.getBotUsername());
            
            if (request.getStartParameter() != null && !request.getStartParameter().isEmpty()) {
                telegramLink.append("?start=").append(request.getStartParameter());
            }
        }
        
        return telegramLink.toString();
    }
    
    /**
     * Generate Instagram profile link
     */
    public String generateInstagramLink(String username) {
        return "https://instagram.com/" + username;
    }
    
    /**
     * Generate Twitter/X profile or tweet link
     */
    public String generateTwitterLink(TwitterLinkRequest request) {
        if (request.getTweetText() != null && !request.getTweetText().isEmpty()) {
            // Create new tweet
            return "https://twitter.com/intent/tweet?text=" + 
                   URLEncoder.encode(request.getTweetText(), StandardCharsets.UTF_8);
        } else if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            // Profile link
            return "https://twitter.com/" + request.getUsername();
        }
        return "https://twitter.com";
    }
    
    /**
     * Generate LinkedIn share link
     */
    public String generateLinkedInShareLink(String url, String title, String summary) {
        StringBuilder linkedinLink = new StringBuilder("https://www.linkedin.com/sharing/share-offsite/?");
        
        if (url != null && !url.isEmpty()) {
            linkedinLink.append("url=").append(URLEncoder.encode(url, StandardCharsets.UTF_8));
        }
        
        if (title != null && !title.isEmpty()) {
            linkedinLink.append("&title=").append(URLEncoder.encode(title, StandardCharsets.UTF_8));
        }
        
        if (summary != null && !summary.isEmpty()) {
            linkedinLink.append("&summary=").append(URLEncoder.encode(summary, StandardCharsets.UTF_8));
        }
        
        return linkedinLink.toString();
    }
    
    /**
     * Get popular Indian social media platforms
     */
    public Map<String, String> getIndianSocialPlatforms() {
        return Map.of(
            "whatsapp", "WhatsApp",
            "telegram", "Telegram", 
            "instagram", "Instagram",
            "twitter", "Twitter/X",
            "linkedin", "LinkedIn",
            "shareChat", "ShareChat",
            "moj", "Moj",
            "josh", "Josh"
        );
    }
    
    // Request DTOs
    public static class WhatsAppLinkRequest {
        private String phoneNumber;
        private String message;
        
        // Constructors, getters, setters
        public WhatsAppLinkRequest() {}
        
        public WhatsAppLinkRequest(String phoneNumber, String message) {
            this.phoneNumber = phoneNumber;
            this.message = message;
        }
        
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    public static class TelegramLinkRequest {
        private String username;
        private String channelId;
        private String botUsername;
        private String startParameter;
        private String message;
        
        // Constructors, getters, setters
        public TelegramLinkRequest() {}
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getChannelId() { return channelId; }
        public void setChannelId(String channelId) { this.channelId = channelId; }
        
        public String getBotUsername() { return botUsername; }
        public void setBotUsername(String botUsername) { this.botUsername = botUsername; }
        
        public String getStartParameter() { return startParameter; }
        public void setStartParameter(String startParameter) { this.startParameter = startParameter; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    public static class TwitterLinkRequest {
        private String username;
        private String tweetText;
        
        // Constructors, getters, setters
        public TwitterLinkRequest() {}
        
        public TwitterLinkRequest(String tweetText) {
            this.tweetText = tweetText;
        }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getTweetText() { return tweetText; }
        public void setTweetText(String tweetText) { this.tweetText = tweetText; }
    }
}