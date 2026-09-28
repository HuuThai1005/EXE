package com.mekongstorybox.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_order_status_history")
public class CustomerOrderStatusHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "order_id", nullable = false) private CustomerOrder order;
    @Column(nullable = false, length = 30) private String status;
    @Column(length = 255) private String note;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;

    protected CustomerOrderStatusHistory() {}

    public CustomerOrderStatusHistory(CustomerOrder order, String status, String note) {
        this.order = order;
        this.status = status;
        this.note = note;
    }

    public Long getOrderId() { return order.getId(); }
    public String getStatus() { return status; }
    public String getNote() { return note; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}