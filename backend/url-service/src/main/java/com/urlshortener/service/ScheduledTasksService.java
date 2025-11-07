package com.urlshortener.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ScheduledTasksService {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduledTasksService.class);
    
    @Autowired
    private BillingService billingService;
    
    /**
     * Check and send trial expiry reminders daily at 9 AM
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void checkTrialExpiryReminders() {
        logger.info("Running scheduled task: Check trial expiry reminders");
        try {
            billingService.checkAndSendTrialExpiryReminders();
            logger.info("Trial expiry reminders check completed");
        } catch (Exception e) {
            logger.error("Error in trial expiry reminders task: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Alternative: Check every 6 hours for more frequent reminders
     */
    @Scheduled(fixedRate = 21600000) // 6 hours in milliseconds
    public void checkTrialExpiryRemindersFrequent() {
        logger.info("Running frequent trial expiry check");
        try {
            billingService.checkAndSendTrialExpiryReminders();
        } catch (Exception e) {
            logger.error("Error in frequent trial expiry check: {}", e.getMessage(), e);
        }
    }
}
