package com.mekongstorybox.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "qr_tokens")
public class QrToken {
    public static final String ACTIVE = "ACTIVE", USED = "USED", REVOKED = "REVOKED";
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String token;
    @Column(nullable = false) private String status;
    @Column(name = "used_at") private LocalDateTime usedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id") private Product product;
    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getStatus() { return status; }
    public LocalDateTime getUsedAt() { return usedAt; }
    public void setToken(String token) { this.token = token; }
    public void setStatus(String status) { this.status = status; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    /** Mã chỉ được quét một lần: sau khi USED thì mọi lượt quét lại đều bị từ chối. */
    public void markUsed() { this.status = USED; this.usedAt = LocalDateTime.now(); }
}
