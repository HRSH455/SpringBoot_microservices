package com.microservices.order_service.dto.OrderRequest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record OrderRequest(
    @NotNull(message = "ID cannot be null")
    Long id,
    
    @NotBlank(message = "Order number cannot be blank")
    @Size(min = 3, max = 50, message = "Order number must be between 3 and 50 characters")
    String orderNumber,
    
    @NotBlank(message = "SKU code cannot be blank")
    String skuCode,
    
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    BigDecimal price,
    
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 10000, message = "Quantity cannot exceed 10000")
    Integer quantity,
    
    @Valid
    @NotNull(message = "User details are required")
    UserDetails userDetail
) {
    public record UserDetails(
        @Email(message = "Email should be valid")
        @NotBlank(message = "Email cannot be blank")
        String email,
        
        @NotBlank(message = "First name cannot be blank")
        String firstName,
        
        @NotBlank(message = "Last name cannot be blank")
        String lastName
    ) {}
}
