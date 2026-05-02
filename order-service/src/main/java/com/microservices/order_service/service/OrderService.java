package com.microservices.order_service.service;

import com.microservices.order_service.client.InventoryClient;
import com.microservices.order_service.dto.OrderRequest.OrderRequest;
import com.microservices.order_service.event.OrderPlacedEvent;
import com.microservices.order_service.model.Order;
import com.microservices.order_service.repository.OrderRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

/**
 * Service for managing orders with transactional consistency
 * Uses transactional event publishing to ensure Kafka events are only sent after DB commit
 * 
 * Pattern: Domain-Driven Design with transactional outbox pattern support
 * - Order is saved to database first (guarantees consistency)
 * - Domain event published on AFTER_COMMIT (guarantees it fires after DB flush)
 * - This prevents orphaned events if Kafka fails after DB succeeds
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Place order with inventory validation and transactional event publishing
     * 
     * Flow:
     * 1. Validates inventory availability
     * 2. Saves order to database
     * 3. Publishes domain event (after transaction commit, not before)
     * 4. Order service event listener publishes to Kafka
     * 
     * @param orderRequest the order request with SKU, quantity, and user details
     * @throws RuntimeException if product is not in stock
     */
    @Transactional
    public void placeOrder(OrderRequest orderRequest) {
        log.info("Attempting to place order for SKU: {}, Quantity: {}", 
            orderRequest.skuCode(), orderRequest.quantity());
        
        // Check inventory first
        boolean isProductInStock = checkInventory(orderRequest.skuCode(), orderRequest.quantity());

        if (!isProductInStock) {
            String errorMsg = "Product with SkuCode " + orderRequest.skuCode() + " is not in stock";
            log.warn(errorMsg);
            throw new RuntimeException(errorMsg);
        }

        // Create and populate order entity with all details
        Order order = new Order();
        order.setOrderNumber(UUID.randomUUID().toString());
        order.setPrice(orderRequest.price());
        order.setSkuCode(orderRequest.skuCode());
        order.setQuantity(orderRequest.quantity());
        
        // Store user details for order tracking
        order.setEmail(orderRequest.userDetail().email());
        order.setFirstName(orderRequest.userDetail().firstName());
        order.setLastName(orderRequest.userDetail().lastName());
        
        // Save to database - this must succeed before event is published
        Order savedOrder = orderRepository.save(order);
        log.info("Order saved successfully: OrderNumber={}, Id={}, Email={}", 
            savedOrder.getOrderNumber(), savedOrder.getId(), savedOrder.getEmail());

        // Create domain event with all order information
        OrderPlacedEvent orderPlacedEvent = new OrderPlacedEvent();
        orderPlacedEvent.setOrderNumber(savedOrder.getOrderNumber());
        orderPlacedEvent.setEmail(savedOrder.getEmail());
        orderPlacedEvent.setFirstName(savedOrder.getFirstName());
        orderPlacedEvent.setLastName(savedOrder.getLastName());
        orderPlacedEvent.setOrderId(savedOrder.getId());
        orderPlacedEvent.setSkuCode(savedOrder.getSkuCode());
        orderPlacedEvent.setQuantity(savedOrder.getQuantity());
        
        log.debug("Publishing order placed domain event: OrderNumber={}, Email={}", 
            orderPlacedEvent.getOrderNumber(), orderPlacedEvent.getEmail());
        
        // Publish event - Spring will only fire this AFTER the transaction commits
        // This ensures order is persisted before any downstream services see the event
        eventPublisher.publishEvent(orderPlacedEvent);
    }

    @CircuitBreaker(name = "inventory", fallbackMethod = "fallbackMethod")
    @Retry(name = "inventory")
    private boolean checkInventory(String skuCode, Integer quantity) {
        return inventoryClient.isInStock(skuCode, quantity);
    }

    private boolean fallbackMethod(String skuCode, Integer quantity, Throwable throwable) {
        log.info("Cannot get Inventory for skucode {}, failure reason: {}", skuCode, throwable.getMessage());
        return false;
    }
}


