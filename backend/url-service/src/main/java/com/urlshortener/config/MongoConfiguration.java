package com.urlshortener.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableMongoRepositories(basePackages = "com.urlshortener.repository")
public class MongoConfiguration {

    @Value("${spring.data.mongodb.uri:}")
    private String mongoUri;

    @Value("${spring.data.mongodb.database:pebly-database}")
    private String databaseName;

    @Bean
    @Primary
    @ConditionalOnProperty(name = "spring.data.mongodb.uri")
    public MongoClient mongoClient() {
        try {
            if (mongoUri == null || mongoUri.trim().isEmpty()) {
                System.err.println("MongoDB URI is not configured. Skipping MongoDB client creation.");
                return null;
            }

            System.out.println("Attempting to connect to MongoDB with URI: " + mongoUri.replaceAll("://[^@]+@", "://***:***@"));
            
            ConnectionString connectionString = new ConnectionString(mongoUri);
            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(connectionString)
                    .applyToConnectionPoolSettings(builder -> 
                        builder.maxSize(10)
                               .minSize(1)
                               .maxWaitTime(5000, TimeUnit.MILLISECONDS)
                               .maxConnectionIdleTime(30000, TimeUnit.MILLISECONDS))
                    .applyToSocketSettings(builder -> 
                        builder.connectTimeout(10000, TimeUnit.MILLISECONDS)
                               .readTimeout(10000, TimeUnit.MILLISECONDS))
                    .applyToServerSettings(builder -> 
                        builder.heartbeatFrequency(10000, TimeUnit.MILLISECONDS))
                    .build();
            
            MongoClient client = MongoClients.create(settings);
            
            // Test the connection
            client.getDatabase(databaseName).runCommand(new org.bson.Document("ping", 1));
            System.out.println("✅ MongoDB connection successful!");
            
            return client;
        } catch (Exception e) {
            System.err.println("❌ Failed to create MongoDB client: " + e.getMessage());
            System.err.println("Application will continue without MongoDB functionality");
            return null;
        }
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "spring.data.mongodb.uri")
    public MongoTemplate mongoTemplate() {
        try {
            MongoClient client = mongoClient();
            if (client == null) {
                System.err.println("MongoClient is null, cannot create MongoTemplate");
                return null;
            }
            return new MongoTemplate(client, databaseName);
        } catch (Exception e) {
            System.err.println("Failed to create MongoTemplate: " + e.getMessage());
            return null;
        }
    }
}