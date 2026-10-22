-- Ràng buộc nghiệp vụ ở cấp database (lớp bảo vệ cuối nếu code có lỗi).
-- NOT VALID: chỉ kiểm tra dữ liệu mới/được sửa, không làm migration thất bại vì dữ liệu cũ.
ALTER TABLE products ADD CONSTRAINT ck_products_price_non_negative CHECK (price >= 0) NOT VALID;
ALTER TABLE digital_passports ADD CONSTRAINT ck_passports_points_non_negative CHECK (total_points >= 0) NOT VALID;
ALTER TABLE customer_orders ADD CONSTRAINT ck_orders_total_non_negative CHECK (total_amount >= 0) NOT VALID;
ALTER TABLE customer_orders ADD CONSTRAINT ck_orders_points_spent_non_negative CHECK (passport_points_spent >= 0) NOT VALID;
ALTER TABLE customer_orders ADD CONSTRAINT ck_orders_status
    CHECK (status IN ('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')) NOT VALID;
ALTER TABLE customer_orders ADD CONSTRAINT ck_orders_type CHECK (order_type IN ('PURCHASE', 'REDEMPTION')) NOT VALID;
ALTER TABLE customer_orders ADD CONSTRAINT ck_orders_payment_method
    CHECK (payment_method IN ('COD', 'PREPAID_QR', 'REDEMPTION')) NOT VALID;
ALTER TABLE customer_orders ADD CONSTRAINT ck_orders_payment_status
    CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'NOT_REQUIRED')) NOT VALID;

-- PostgreSQL không tự tạo index cho khóa ngoại: thiếu index thì JOIN/lọc theo user/order quét toàn bảng khi dữ liệu lớn.
CREATE INDEX IF NOT EXISTS ix_customer_orders_user_id ON customer_orders(user_id);
CREATE INDEX IF NOT EXISTS ix_customer_orders_created_at ON customer_orders(created_at);
CREATE INDEX IF NOT EXISTS ix_customer_order_items_order_id ON customer_order_items(order_id);
CREATE INDEX IF NOT EXISTS ix_customer_order_items_product_id ON customer_order_items(product_id);
CREATE INDEX IF NOT EXISTS ix_order_status_history_order_id ON customer_order_status_history(order_id);
CREATE INDEX IF NOT EXISTS ix_qr_tokens_product_id ON qr_tokens(product_id);
CREATE INDEX IF NOT EXISTS ix_qr_scans_user_id ON qr_scans(user_id);
CREATE INDEX IF NOT EXISTS ix_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS ix_products_status ON products(status);

-- Đồng bộ lại bộ đếm id (identity) với MAX(id): nếu dữ liệu từng được import kèm id
-- (vd. chuyển từ SQL Server sang Neon), insert mới sẽ bị trùng khóa chính.
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('locations', 'id'), COALESCE((SELECT MAX(id) FROM locations), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('stories', 'id'), COALESCE((SELECT MAX(id) FROM stories), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('digital_passports', 'id'), COALESCE((SELECT MAX(id) FROM digital_passports), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('qr_tokens', 'id'), COALESCE((SELECT MAX(id) FROM qr_tokens), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('qr_scans', 'id'), COALESCE((SELECT MAX(id) FROM qr_scans), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('customer_orders', 'id'), COALESCE((SELECT MAX(id) FROM customer_orders), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('customer_order_items', 'id'), COALESCE((SELECT MAX(id) FROM customer_order_items), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('customer_order_status_history', 'id'), COALESCE((SELECT MAX(id) FROM customer_order_status_history), 0) + 1, false);
