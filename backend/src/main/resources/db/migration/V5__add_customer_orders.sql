CREATE TABLE customer_orders (
    id BIGINT IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_code NVARCHAR(32) NOT NULL,
    customer_name NVARCHAR(150) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    shipping_address NVARCHAR(1000) NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'PLACED',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_customer_orders_code UNIQUE (order_code),
    CONSTRAINT fk_customer_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE customer_order_items (
    id BIGINT IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NULL,
    product_name NVARCHAR(255) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT ck_customer_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT fk_customer_order_items_order FOREIGN KEY (order_id) REFERENCES customer_orders(id),
    CONSTRAINT fk_customer_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);