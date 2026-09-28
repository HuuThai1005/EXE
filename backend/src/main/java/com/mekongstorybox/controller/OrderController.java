package com.mekongstorybox.controller;

import com.mekongstorybox.dto.OrderDtos.CreateOrderRequest;
import com.mekongstorybox.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orders;

    public OrderController(OrderService orders) { this.orders = orders; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@Valid @RequestBody CreateOrderRequest request, Authentication authentication) {
        var result = orders.placeOrder(authentication.getName(), request);
        return Map.of("success", true, "data", result, "message", "Order placed");
    }

    @GetMapping
    public Map<String, Object> list(Authentication authentication) {
        return Map.of("success", true, "data", orders.listMyOrders(authentication.getName()), "message", "Success");
    }

    @PostMapping("/{id}/confirm-received")
    public Map<String, Object> confirmReceived(@PathVariable Long id, Authentication authentication) {
        return Map.of("success", true, "data", orders.confirmReceived(authentication.getName(), id), "message", "Receipt confirmed");
    }
}