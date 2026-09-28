INSERT INTO qr_tokens(token, product_id, status)
SELECT 'mekong-market-002', 1, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM qr_tokens WHERE token = 'mekong-market-002');

INSERT INTO qr_tokens(token, product_id, status)
SELECT 'mekong-garden-003', 1, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM qr_tokens WHERE token = 'mekong-garden-003');

INSERT INTO qr_tokens(token, product_id, status)
SELECT 'southern-music-004', 1, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM qr_tokens WHERE token = 'southern-music-004');
