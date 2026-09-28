ALTER TABLE customer_orders ADD order_type NVARCHAR(20) NOT NULL
    CONSTRAINT df_customer_orders_order_type DEFAULT 'PURCHASE';

ALTER TABLE customer_orders ADD passport_points_spent INT NOT NULL
    CONSTRAINT df_customer_orders_passport_points_spent DEFAULT 0;