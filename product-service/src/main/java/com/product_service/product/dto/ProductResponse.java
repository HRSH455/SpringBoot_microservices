package com.product_service.product.dto;

import java.math.BigDecimal;

public record ProductResponse( String id, String name, String description, BigDecimal price) {
}
