package com.microservices.inventory_service.exception;

/**
 * Exception thrown when inventory for a product is not found
 */
public class InventoryNotFoundException extends RuntimeException {
    public InventoryNotFoundException(String message) {
        super(message);
    }
    
    public InventoryNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
