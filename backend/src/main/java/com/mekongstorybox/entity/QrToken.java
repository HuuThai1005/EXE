package com.mekongstorybox.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "qr_tokens")
public class QrToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String token;
    @Column(nullable = false) private String status;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id") private Product product;
    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getStatus() { return status; }
    public void setToken(String token) { this.token = token; }
    public void setStatus(String status) { this.status = status; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
}
