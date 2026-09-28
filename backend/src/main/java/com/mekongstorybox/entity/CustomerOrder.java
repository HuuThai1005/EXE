package com.mekongstorybox.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "order_code", nullable = false, unique = true, length = 32) private String orderCode;
    @Column(name = "customer_name", nullable = false, length = 150) private String customerName;
    @Column(nullable = false, length = 50) private String phone;
    @Column(name = "shipping_address", nullable = false, length = 1000) private String shippingAddress;
    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2) private BigDecimal totalAmount;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomerOrderItem> items = new ArrayList<>();

    protected CustomerOrder() {}

    public CustomerOrder(User user, String orderCode, String customerName, String phone, String shippingAddress) {
        this.user = user;
        this.orderCode = orderCode;
        this.customerName = customerName;
        this.phone = phone;
        this.shippingAddress = shippingAddress;
        this.status = "PLACED";
    }

    public void addItem(Product product, int quantity) {
        items.add(new CustomerOrderItem(this, product, quantity));
    }

    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public void updateStatus(String status) { this.status = status; }
    public Long getId() { return id; }
    public String getOrderCode() { return orderCode; }
    public String getCustomerName() { return customerName; }
    public String getPhone() { return phone; }
    public String getShippingAddress() { return shippingAddress; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public User getUser() { return user; }
    public List<CustomerOrderItem> getItems() { return items; }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}