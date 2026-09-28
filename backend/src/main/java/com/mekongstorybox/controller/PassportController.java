package com.mekongstorybox.controller;

import com.mekongstorybox.repository.UserRepository;
import com.mekongstorybox.dto.OrderDtos.RedeemProductRequest;
import com.mekongstorybox.service.OrderService;
import com.mekongstorybox.service.PassportService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/passport")
public class PassportController {
    private final UserRepository users; private final PassportService passports; private final OrderService orders;
    public PassportController(UserRepository users, PassportService passports, OrderService orders) { this.users = users; this.passports = passports; this.orders = orders; }
    @GetMapping public Map<String, Object> get(Authentication authentication) { var user = users.findByEmailIgnoreCase(authentication.getName()).orElseThrow(); var passport = passports.getOrCreate(user); return Map.of("success", true, "data", Map.of("totalPoints", passport.getTotalPoints(), "level", passport.getLevel(), "explorationCount", passport.getExplorationCount()), "message", "Success"); }

    @PostMapping("/redemptions")
    public Map<String, Object> redeem(@Valid @RequestBody RedeemProductRequest request, Authentication authentication) {
        return Map.of("success", true, "data", orders.redeemProduct(authentication.getName(), request), "message", "Reward redeemed");
    }
}
