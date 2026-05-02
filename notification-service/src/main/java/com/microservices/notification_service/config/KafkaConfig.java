package com.microservices.notification_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;
import org.springframework.mail.MailException;
import org.springframework.util.backoff.ExponentialBackOff;

@Configuration
public class KafkaConfig {

    @Bean
    public DefaultErrorHandler errorHandler() {
        ExponentialBackOff backOff = new ExponentialBackOffWithMaxRetries(2);
        backOff.setInitialInterval(1000L);
        backOff.setMultiplier(2.0);
        backOff.setMaxInterval(10000L);
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(backOff);
        // Add specific exceptions to not retry, e.g., IllegalArgumentException
        errorHandler.addNotRetryableExceptions(IllegalArgumentException.class, MailException.class);
        return errorHandler;
    }
}