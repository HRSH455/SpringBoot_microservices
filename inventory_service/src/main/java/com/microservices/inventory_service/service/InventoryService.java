package com.microservices.inventory_service.service;


import com.microservices.inventory_service.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository inventoryRepository;

    public boolean isInStock(String skucode ,Integer quanitiy){
        return inventoryRepository.existsBySkuCodeAndQuantityIsGreaterThanEqual(skucode,quanitiy);
    }
}
