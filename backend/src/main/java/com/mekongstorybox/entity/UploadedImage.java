package com.mekongstorybox.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "uploaded_images")
public class UploadedImage {
    @Id private UUID id;
    @Column(name = "content_type", nullable = false, length = 50) private String contentType;
    @Column(name = "size_bytes", nullable = false) private int sizeBytes;
    @Column(nullable = false) private byte[] data;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    protected UploadedImage() {}
    public UploadedImage(String contentType, byte[] data) { this.id = UUID.randomUUID(); this.contentType = contentType; this.data = data; this.sizeBytes = data.length; this.createdAt = LocalDateTime.now(); }
    public UUID getId() { return id; }
    public String getContentType() { return contentType; }
    public byte[] getData() { return data; }
}
