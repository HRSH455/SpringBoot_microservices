package com.microservices.order_service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event listener for order placed events
 * Uses @TransactionalEventListener to guarantee Kafka message is only sent
 * after the database transaction successfully commits
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventListener {

    private final KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate;

    /**
     * Listen for OrderPlacedEvent and send to Kafka topic
     * Only executed AFTER successful database commit (TransactionPhase.AFTER_COMMIT)
     * This ensures data consistency: if DB commit fails, Kafka message is NOT sent
     * 
     * @param event the order placed event published by OrderService
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderPlaced(OrderPlacedEvent event) {
        log.info("Order placed event received (after commit): OrderNumber={}", event.getOrderNumber());
        
        try {
            kafkaTemplate.send("order-placed", event)
                .whenComplete((sendResult, ex) -> {
                    if (ex == null) {
                        log.info("Order event sent to Kafka successfully: {}", event.getOrderNumber());
                    } else {
                        log.error("Failed to send order event to Kafka", ex);
                    }
                });
        } catch (Exception e) {
            log.error("Error sending order event to Kafka topic", e);
            throw e;
        }
    }
}
