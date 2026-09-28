package com.mekongstorybox.controller;

import com.mekongstorybox.dto.OrderDtos.UpdateOrderStatusRequest;
import com.mekongstorybox.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {
    private final OrderService orders;

    public AdminOrderController(OrderService orders) { this.orders = orders; }

    @GetMapping
    public Map<String, Object> list() {
        return Map.of("success", true, "data", orders.listAllOrders(), "message", "Success");
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        return Map.of("success", true, "data", orders.updateStatus(id, request.status(), request.shippingCarrier(), request.trackingNumber()), "message", "Order status updated");
    }
}