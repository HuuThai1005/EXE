-- Ảnh upload từ trang quản trị, lưu trong database để không mất khi redeploy (filesystem của server là tạm thời).
CREATE TABLE uploaded_images (
    id UUID PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    size_bytes INT NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (now() at time zone 'utc'),
    CONSTRAINT ck_uploaded_images_size CHECK (size_bytes > 0 AND size_bytes <= 5242880)
);
