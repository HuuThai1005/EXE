package com.mekongstorybox.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "qr_scans", uniqueConstraints = @UniqueConstraint(name = "uq_qr_scan_user_token", columnNames = {"qr_token_id", "user_id"}))
public class QrScan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "qr_token_id", nullable = false) private QrToken qrToken;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "scanned_at") private LocalDateTime scannedAt;
    protected QrScan() {}
    public QrScan(QrToken qrToken, User user) { this.qrToken = qrToken; this.user = user; this.scannedAt = LocalDateTime.now(); }
}
