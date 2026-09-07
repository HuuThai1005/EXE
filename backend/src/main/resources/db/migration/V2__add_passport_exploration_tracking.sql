ALTER TABLE digital_passports ADD exploration_count INT NOT NULL CONSTRAINT df_passport_exploration_count DEFAULT 0;
CREATE TABLE qr_scans (
    id BIGINT IDENTITY PRIMARY KEY,
    qr_token_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    scanned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_qr_scan_user_token UNIQUE (qr_token_id, user_id),
    CONSTRAINT fk_qr_scan_token FOREIGN KEY(qr_token_id) REFERENCES qr_tokens(id),
    CONSTRAINT fk_qr_scan_user FOREIGN KEY(user_id) REFERENCES users(id)
);
