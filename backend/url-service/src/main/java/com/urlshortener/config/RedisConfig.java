package com.urlshortener.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.fasterxml.jackson.databind.type.MapType;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis")
public class RedisConfig {

    @Value("${app.cache.url-ttl:3600}")
    private long urlCacheTtl;

    @Value("${app.cache.analytics-ttl:300}")
    private long analyticsCacheTtl;

    @Value("${app.cache.geo-ttl:86400}")
    private long geoCacheTtl;

    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(urlCacheTtl))
                .disableCachingNullValues()
                .serializeKeysWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                        .fromSerializer(createJsonRedisSerializer()));

        // Configure different TTL for different cache types
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Analytics cache - 5 minutes
        cacheConfigurations.put("analytics", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(analyticsCacheTtl)));
        
        // User analytics cache - 5 minutes
        cacheConfigurations.put("userAnalytics", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(analyticsCacheTtl)));
        
        // URL analytics cache - 5 minutes
        cacheConfigurations.put("urlAnalytics", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(analyticsCacheTtl)));
        
        // Click counts cache - 5 minutes
        cacheConfigurations.put("clickCounts", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(analyticsCacheTtl)));
        
        // Geographic data cache - 24 hours
        cacheConfigurations.put("geoData", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(geoCacheTtl)));
        
        // Country stats cache - 1 hour
        cacheConfigurations.put("countryStats", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(3600)));
        
        // User URLs cache - 10 minutes
        cacheConfigurations.put("userUrls", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(600)));
        
        // User QR codes cache - 10 minutes
        cacheConfigurations.put("userQRCodes", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(600)));
        
        // User files cache - 10 minutes
        cacheConfigurations.put("userFiles", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(600)));
        
        // Dashboard overview cache - 5 minutes
        cacheConfigurations.put("dashboardOverview", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(300)));
        
        // Realtime analytics cache - 1 minute
        cacheConfigurations.put("realtimeAnalytics", defaultCacheConfig
                .entryTtl(Duration.ofSeconds(60)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultCacheConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Use String serializer for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Use JSON serializer for values
        Jackson2JsonRedisSerializer<Object> jsonSerializer = createJsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.setDefaultSerializer(jsonSerializer);
        template.afterPropertiesSet();

        return template;
    }

    private Jackson2JsonRedisSerializer<Object> createJsonRedisSerializer() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.activateDefaultTyping(objectMapper.getPolymorphicTypeValidator(), 
                ObjectMapper.DefaultTyping.NON_FINAL);
        objectMapper.registerModule(new JavaTimeModule());
        
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(objectMapper, Object.class);
        return serializer;
    }
}