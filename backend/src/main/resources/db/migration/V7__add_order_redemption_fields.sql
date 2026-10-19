ALTER TABLE customer_orders ADD COLUMN order_type VARCHAR(20) NOT NULL DEFAULT 'PURCHASE';

ALTER TABLE customer_orders ADD COLUMN passport_points_spent INT NOT NULL DEFAULT 0;
