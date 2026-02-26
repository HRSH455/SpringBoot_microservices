package com.microservices.order_service.controller;
import com.microservices.order_service.dto.OrderRequest.OrderRequest;
import com.microservices.order_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/order")
@Slf4j
public class OrderController {
    private final OrderService orderService;

    /**
     * Place a new order with validation
     * @param orderRequest validated order request
     * @return success message with 201 Created status
     */
    @PostMapping
    public ResponseEntity<String> placeOrder(@Valid @RequestBody OrderRequest orderRequest){
        log.info("Placing order for SKU: {}, Quantity: {}", orderRequest.skuCode(), orderRequest.quantity());
        orderService.placeOrder(orderRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body("Order Placed Successfully");
    }

}
