package com.urlshortener.repository;

import com.urlshortener.model.ClickAnalytics;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClickAnalyticsRepository extends MongoRepository<ClickAnalytics, String> {
    
    // Find analytics by short code
    List<ClickAnalytics> findByShortCode(String shortCode);
    
    // Find analytics by user
    List<ClickAnalytics> findByUserId(String userId);
    
    // Find analytics by short code and date range
    List<ClickAnalytics> findByShortCodeAndClickedAtBetween(String shortCode, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find analytics by user and date range
    List<ClickAnalytics> findByUserIdAndClickedAtBetween(String userId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find unique clicks
    List<ClickAnalytics> findByIsUniqueClickTrue();
    
    // Find clicks by country
    List<ClickAnalytics> findByCountry(String country);
    
    // Find clicks by device type
    List<ClickAnalytics> findByDeviceType(String deviceType);
    
    // Find clicks by browser
    List<ClickAnalytics> findByBrowser(String browser);
    
    // Find mobile clicks
    List<ClickAnalytics> findByIsMobileTrue();
    
    // Find bot clicks
    List<ClickAnalytics> findByIsBotTrue();
    
    // Count clicks by short code
    long countByShortCode(String shortCode);
    
    // Count unique clicks by short code
    long countByShortCodeAndIsUniqueClickTrue(String shortCode);
    
    // Count clicks by user
    long countByUserId(String userId);
    
    // Count clicks today for short code
    @Query(value = "{'shortCode': ?0, 'clickedAt': {$gte: ?1}}", count = true)
    long countTodayClicksByShortCode(String shortCode, LocalDateTime startOfDay);
    
    // Count clicks this week for short code
    @Query(value = "{'shortCode': ?0, 'clickedAt': {$gte: ?1}}", count = true)
    long countThisWeekClicksByShortCode(String shortCode, LocalDateTime startOfWeek);
    
    // Count clicks this month for short code
    @Query(value = "{'shortCode': ?0, 'clickedAt': {$gte: ?1}}", count = true)
    long countThisMonthClicksByShortCode(String shortCode, LocalDateTime startOfMonth);
    
    // Find recent clicks
    @Query("{'clickedAt': {$gte: ?0}}")
    List<ClickAnalytics> findRecentClicks(LocalDateTime since);
    
    // Get clicks by hour for a short code
    @Query("{'shortCode': ?0}")
    List<ClickAnalytics> findClicksForHourlyAnalysis(String shortCode);
    
    // Get top countries for a short code
    @Aggregation(pipeline = {
        "{ $match: { 'shortCode': ?0 } }",
        "{ $group: { '_id': '$country', 'count': { $sum: 1 } } }",
        "{ $sort: { 'count': -1 } }",
        "{ $limit: 10 }"
    })
    List<Object> getTopCountriesByShortCode(String shortCode);
    
    // Get top devices for a short code
    @Aggregation(pipeline = {
        "{ $match: { 'shortCode': ?0 } }",
        "{ $group: { '_id': '$deviceType', 'count': { $sum: 1 } } }",
        "{ $sort: { 'count': -1 } }"
    })
    List<Object> getTopDevicesByShortCode(String shortCode);
    
    // Get top browsers for a short code
    @Aggregation(pipeline = {
        "{ $match: { 'shortCode': ?0 } }",
        "{ $group: { '_id': '$browser', 'count': { $sum: 1 } } }",
        "{ $sort: { 'count': -1 } }"
    })
    List<Object> getTopBrowsersByShortCode(String shortCode);
    
    // Get clicks by day for the last 30 days
    @Aggregation(pipeline = {
        "{ $match: { 'shortCode': ?0, 'clickedAt': { $gte: ?1 } } }",
        "{ $group: { '_id': { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } }, 'count': { $sum: 1 } } }",
        "{ $sort: { '_id': 1 } }"
    })
    List<Object> getDailyClicksForLast30Days(String shortCode, LocalDateTime thirtyDaysAgo);
}