ALTER TABLE customer_orders ADD updated_at DATETIME2 NOT NULL
    CONSTRAINT df_customer_orders_updated_at DEFAULT SYSUTCDATETIME();

CREATE TABLE customer_order_status_history (
    id BIGINT IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL,
    status NVARCHAR(30) NOT NULL,
    note NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_customer_order_status_history_order FOREIGN KEY (order_id) REFERENCES customer_orders(id)
);