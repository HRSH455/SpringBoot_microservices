-- V2__Add_audit_columns_to_orders.sql
-- Add audit columns for tracking and soft deletes support

ALTER TABLE t_orders
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add indexes for better query performance
CREATE INDEX idx_order_number ON t_orders(order_number);
CREATE INDEX idx_sku_code ON t_orders(sku_code);
CREATE INDEX idx_created_at ON t_orders(created_at);
CREATE INDEX idx_is_deleted ON t_orders(is_deleted);

-- Add constraint to ensure positive quantity
ALTER TABLE t_orders
ADD CONSTRAINT chk_positive_quantity CHECK (quantity > 0);

-- Add constraint to ensure positive price
ALTER TABLE t_orders
ADD CONSTRAINT chk_positive_price CHECK (price > 0);
