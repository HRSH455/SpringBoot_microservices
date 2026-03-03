package com.product_service.product.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Product creation request with validation
 */
public record ProductRequest(
    
    @NotBlank(message = "Product name cannot be blank")
    @Size(min = 3, max = 100, message = "Product name must be between 3 and 100 characters")
    String name,
    
    @NotBlank(message = "Product description cannot be blank")
    @Size(min = 10, max = 500, message = "Product description must be between 10 and 500 characters")
    String description,
    
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @DecimalMax(value = "999999.99", message = "Price cannot exceed 999999.99")
    BigDecimal price
) {
}

