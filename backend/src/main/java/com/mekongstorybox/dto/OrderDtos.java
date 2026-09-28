package com.mekongstorybox.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    public record CreateOrderRequest(
            @NotBlank @Size(max = 150) String customerName,
            @NotBlank @Size(max = 50) String phone,
            @NotBlank @Size(max = 1000) String shippingAddress,
            @NotBlank String paymentMethod,
            @NotEmpty @Valid List<OrderItemRequest> items) {}

    public record RedeemProductRequest(
            @NotNull @Positive Long productId,
            @NotBlank @Size(max = 150) String customerName,
            @NotBlank @Size(max = 50) String phone,
            @NotBlank @Size(max = 1000) String shippingAddress) {}

    public record OrderItemRequest(
            @NotNull @Positive Long productId,
            @NotNull @Min(1) @Max(100) Integer quantity) {}

        public record OrderResponse(Long id, String orderCode, BigDecimal totalAmount, int passportPointsAwarded,
                                                                String paymentMethod, String paymentStatus) {}
        public record PaymentResponse(Long orderId, String orderCode, String paymentMethod, String paymentStatus, int passportPointsAwarded) {}
        public record RedemptionResponse(String orderCode, int passportPointsSpent, String productName) {}

        public record OrderItemResponse(String productName, BigDecimal unitPrice, int quantity) {}
        public record OrderStatusEventResponse(String status, String note, LocalDateTime createdAt) {}
        public record OrderHistoryResponse(Long id, String orderCode, String orderType, int passportPointsSpent, String status,
                                                                           String paymentMethod, String paymentStatus,
                                                                           String shippingCarrier, String trackingNumber, BigDecimal totalAmount,
                                                                           LocalDateTime createdAt, List<OrderItemResponse> items,
                                                                           List<OrderStatusEventResponse> statusHistory) {}
        public record AdminOrderResponse(Long id, String orderCode, String orderType, String customerName, String customerEmail,
                                                                         String phone, String shippingAddress, String shippingCarrier,
                                                                         String trackingNumber, String paymentMethod, String paymentStatus, BigDecimal totalAmount,
                                                                         String status, LocalDateTime createdAt) {}
        public record UpdateOrderStatusRequest(@NotBlank String status,
                                               @Size(max = 100) String shippingCarrier,
                                               @Size(max = 100) String trackingNumber) {}
}