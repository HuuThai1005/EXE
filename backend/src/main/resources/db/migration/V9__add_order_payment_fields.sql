ALTER TABLE customer_orders ADD payment_method NVARCHAR(20) NOT NULL
    CONSTRAINT df_customer_orders_payment_method DEFAULT 'COD';

ALTER TABLE customer_orders ADD payment_status NVARCHAR(20) NOT NULL
    CONSTRAINT df_customer_orders_payment_status DEFAULT 'UNPAID';