-- V3__Add_audit_columns_to_inventory.sql
-- Add audit columns for tracking inventory changes

ALTER TABLE t_inventory
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN reserved_quantity INT DEFAULT 0;

-- Add unique constraint on sku_code
ALTER TABLE t_inventory
ADD CONSTRAINT uq_sku_code UNIQUE (skuCode);

-- Add indexes for better query performance
CREATE INDEX idx_sku_code ON t_inventory(skuCode);
CREATE INDEX idx_quantity ON t_inventory(quantity);

-- Add constraint to ensure non-negative quantities
ALTER TABLE t_inventory
ADD CONSTRAINT chk_non_negative_quantity CHECK (quantity >= 0),
ADD CONSTRAINT chk_non_negative_reserved CHECK (reserved_quantity >= 0);
