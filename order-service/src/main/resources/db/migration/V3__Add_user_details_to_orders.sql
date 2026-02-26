-- V3__Add_user_details_to_orders.sql
-- Store user information with orders

ALTER TABLE t_orders
ADD COLUMN email VARCHAR(255) NOT NULL,
ADD COLUMN first_name VARCHAR(100) NOT NULL,
ADD COLUMN last_name VARCHAR(100) NOT NULL;

-- Add index for email lookups
CREATE INDEX idx_email ON t_orders(email);

-- Add index on (email, created_at) for efficient queries
CREATE INDEX idx_email_created_at ON t_orders(email, created_at);
