UPDATE customer_orders
SET payment_method = 'REDEMPTION', payment_status = 'NOT_REQUIRED'
WHERE order_type = 'REDEMPTION';

UPDATE customer_orders
SET payment_status = 'PAID'
WHERE order_type = 'PURCHASE' AND status = 'DELIVERED';