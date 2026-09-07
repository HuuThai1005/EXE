package com.mekongstorybox.controller;

import com.mekongstorybox.dto.AuthDtos.*;
import com.mekongstorybox.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) { return success(authService.register(request), "Registration successful"); }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request) { return success(authService.login(request), "Login successful"); }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) { return success(authService.me(authentication.getName()), "Success"); }

    @PostMapping("/logout")
    public Map<String, Object> logout() { var response = new HashMap<String, Object>(); response.put("success", true); response.put("data", null); response.put("message", "Logout successful"); return response; }

    private Map<String, Object> success(Object data, String message) { return Map.of("success", true, "data", data, "message", message); }
}
