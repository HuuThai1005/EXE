package com.mekongstorybox.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "qr_tokens")
public class QrToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String token;
    @Column(nullable = false) private String status;
    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getStatus() { return status; }
}
