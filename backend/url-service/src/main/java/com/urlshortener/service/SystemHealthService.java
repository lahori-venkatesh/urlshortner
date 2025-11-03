package com.urlshortener.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
public class SystemHealthService {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Value("${app.frontend.url:https://bitaurl.vercel.app}")
    private String frontendUrl;

    @Value("${app.backend.url:https://bitaurl-backend.onrender.com}")
    private String backendUrl;

    @Value("${sendgrid.api.key:}")
    private String sendgridApiKey;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public Map<String, Object> getCompleteSystemHealth() {
        Map<String, Object> healthData = new HashMap<>();
        
        // Get all service healths
        healthData.put("mongodb", getMongoDBHealth());
        healthData.put("razorpay", getRazorpayHealth());
        healthData.put("sendgrid", getSendGridHealth());
        healthData.put("vercel", getVercelHealth());
        healthData.put("render", getRenderHealth());
        
        return healthData;
    }

    public Map<String, Object> getMongoDBHealth() {
        Map<String, Object> mongoHealth = new HashMap<>();
        
        try {
            long startTime = System.currentTimeMillis();
            
            // Test connection and get basic stats
            long userCount = mongoTemplate.getCollection("users").countDocuments();
            long urlCount = mongoTemplate.getCollection("urls").countDocuments();
            long analyticsCount = mongoTemplate.getCollection("analytics").countDocuments();
            long teamCount = mongoTemplate.getCollection("teams").countDocuments();
            long ticketCount = mongoTemplate.getCollection("support_tickets").countDocuments();
            
            long responseTime = System.currentTimeMillis() - startTime;
            
            mongoHealth.put("status", "healthy");
            mongoHealth.put("responseTime", responseTime);
            mongoHealth.put("connections", getActiveConnections());
            
            Map<String, Long> collections = new HashMap<>();
            collections.put("users", userCount);
            collections.put("urls", urlCount);
            collections.put("analytics", analyticsCount);
            collections.put("teams", teamCount);
            collections.put("support_tickets", ticketCount);
            mongoHealth.put("collections", collections);
            
            Map<String, Integer> operations = new HashMap<>();
            operations.put("reads", getCurrentReadsPerSecond());
            operations.put("writes", getCurrentWritesPerSecond());
            mongoHealth.put("operations", operations);
            
        } catch (Exception e) {
            mongoHealth.put("status", "down");
            mongoHealth.put("error", e.getMessage());
            mongoHealth.put("responseTime", -1);
        }
        
        return mongoHealth;
    }

    public Map<String, Object> getRazorpayHealth() {
        Map<String, Object> razorpayHealth = new HashMap<>();
        
        try {
            long startTime = System.currentTimeMillis();
            
            // Test Razorpay API connectivity
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Basic " + java.util.Base64.getEncoder()
                            .encodeToString((razorpayKeyId + ":").getBytes()))
                    .GET()
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long responseTime = System.currentTimeMillis() - startTime;
            
            if (response.statusCode() == 200 || response.statusCode() == 401) { // 401 is expected without proper auth
                razorpayHealth.put("status", "healthy");
                razorpayHealth.put("responseTime", responseTime);
                razorpayHealth.put("apiVersion", "v1");
            } else {
                razorpayHealth.put("status", "degraded");
                razorpayHealth.put("responseTime", responseTime);
            }
            
        } catch (Exception e) {
            razorpayHealth.put("status", "down");
            razorpayHealth.put("error", e.getMessage());
            razorpayHealth.put("responseTime", -1);
        }
        
        return razorpayHealth;
    }

    public Map<String, Object> getSendGridHealth() {
        Map<String, Object> sendgridHealth = new HashMap<>();
        
        try {
            long startTime = System.currentTimeMillis();
            
            // Test SendGrid API connectivity
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.sendgrid.com/v3/user/profile"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + sendgridApiKey)
                    .GET()
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long responseTime = System.currentTimeMillis() - startTime;
            
            if (response.statusCode() == 200) {
                sendgridHealth.put("status", "healthy");
                sendgridHealth.put("responseTime", responseTime);
                sendgridHealth.put("emailsSent24h", getEmailsSent24h());
                sendgridHealth.put("deliveryRate", 98.5); // This would come from SendGrid stats API
            } else {
                sendgridHealth.put("status", "degraded");
                sendgridHealth.put("responseTime", responseTime);
            }
            
        } catch (Exception e) {
            sendgridHealth.put("status", "down");
            sendgridHealth.put("error", e.getMessage());
            sendgridHealth.put("responseTime", -1);
        }
        
        return sendgridHealth;
    }

    public Map<String, Object> getVercelHealth() {
        Map<String, Object> vercelHealth = new HashMap<>();
        
        try {
            long startTime = System.currentTimeMillis();
            
            // Test frontend accessibility
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(frontendUrl))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long responseTime = System.currentTimeMillis() - startTime;
            
            if (response.statusCode() == 200) {
                vercelHealth.put("status", "healthy");
                vercelHealth.put("responseTime", responseTime);
                vercelHealth.put("deploymentStatus", "Ready");
                vercelHealth.put("lastDeploy", "2 hours ago"); // This would come from Vercel API
            } else {
                vercelHealth.put("status", "degraded");
                vercelHealth.put("responseTime", responseTime);
            }
            
        } catch (Exception e) {
            vercelHealth.put("status", "down");
            vercelHealth.put("error", e.getMessage());
            vercelHealth.put("responseTime", -1);
        }
        
        return vercelHealth;
    }

    public Map<String, Object> getRenderHealth() {
        Map<String, Object> renderHealth = new HashMap<>();
        
        try {
            long startTime = System.currentTimeMillis();
            
            // Test backend health endpoint
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(backendUrl + "/api/v1/health"))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long responseTime = System.currentTimeMillis() - startTime;
            
            if (response.statusCode() == 200) {
                renderHealth.put("status", "healthy");
                renderHealth.put("responseTime", responseTime);
                renderHealth.put("cpuUsage", getCurrentCpuUsage());
                renderHealth.put("memoryUsage", getCurrentMemoryUsage());
                renderHealth.put("uptime", getUptime());
            } else {
                renderHealth.put("status", "degraded");
                renderHealth.put("responseTime", responseTime);
            }
            
        } catch (Exception e) {
            renderHealth.put("status", "down");
            renderHealth.put("error", e.getMessage());
            renderHealth.put("responseTime", -1);
        }
        
        return renderHealth;
    }

    public Map<String, Object> getExternalServicesHealth() {
        Map<String, Object> servicesHealth = new HashMap<>();
        servicesHealth.put("razorpay", getRazorpayHealth());
        servicesHealth.put("sendgrid", getSendGridHealth());
        servicesHealth.put("vercel", getVercelHealth());
        return servicesHealth;
    }

    // Helper methods
    private int getActiveConnections() {
        // This would typically come from MongoDB connection pool metrics
        return 5; // Placeholder
    }

    private int getCurrentReadsPerSecond() {
        // This would come from MongoDB metrics
        return 25; // Placeholder
    }

    private int getCurrentWritesPerSecond() {
        // This would come from MongoDB metrics
        return 8; // Placeholder
    }

    private int getEmailsSent24h() {
        // This would come from your email tracking or SendGrid stats
        return 156; // Placeholder
    }

    private int getCurrentCpuUsage() {
        // This would come from system metrics
        return 45; // Placeholder
    }

    private int getCurrentMemoryUsage() {
        // This would come from system metrics
        return 68; // Placeholder
    }

    private String getUptime() {
        // This would come from system metrics
        return "5d 12h 30m"; // Placeholder
    }
}