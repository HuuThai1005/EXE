package com.mekongstorybox.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.mekongstorybox.service.QrExperienceService;
import java.util.Map;

@RestController
@RequestMapping("/api/qr")
public class QrController {
    private final QrExperienceService qrExperienceService;
    public QrController(QrExperienceService qrExperienceService) { this.qrExperienceService = qrExperienceService; }
    @PostMapping("/verify")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> verify(@Valid @RequestBody VerifyRequest request, Authentication authentication) {
        var result = qrExperienceService.verify(request.token(), authentication.getName());
        return Map.of("success", result.valid(), "data", Map.of("valid", result.valid(), "counted", result.counted()), "message", result.message());
    }

    public record VerifyRequest(@NotBlank String token) {}
}
