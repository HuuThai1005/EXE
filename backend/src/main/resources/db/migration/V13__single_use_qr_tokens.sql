-- Mã QR dùng một lần: ACTIVE (chưa quét) -> USED (đã có người quét) hoặc REVOKED (admin thu hồi).
-- Mã đã được quét theo cơ chế cũ (mỗi user quét một lần) coi như đã dùng, ghi nhận thời điểm quét đầu tiên.
UPDATE qr_tokens qr
SET status = 'USED', used_at = first_scan.scanned_at
FROM (SELECT qr_token_id, MIN(scanned_at) AS scanned_at FROM qr_scans GROUP BY qr_token_id) first_scan
WHERE first_scan.qr_token_id = qr.id AND qr.status = 'ACTIVE';

ALTER TABLE qr_tokens ADD CONSTRAINT ck_qr_tokens_status CHECK (status IN ('ACTIVE', 'USED', 'REVOKED')) NOT VALID;
ALTER TABLE qr_tokens ADD CONSTRAINT ck_qr_tokens_used_at CHECK (status <> 'USED' OR used_at IS NOT NULL) NOT VALID;
CREATE INDEX IF NOT EXISTS ix_qr_tokens_status ON qr_tokens(status);
