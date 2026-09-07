package com.mekongstorybox.controller;

import com.mekongstorybox.repository.UserRepository;
import com.mekongstorybox.service.PassportService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/passport")
public class PassportController {
    private final UserRepository users; private final PassportService passports;
    public PassportController(UserRepository users, PassportService passports) { this.users = users; this.passports = passports; }
    @GetMapping public Map<String, Object> get(Authentication authentication) { var user = users.findByEmailIgnoreCase(authentication.getName()).orElseThrow(); var passport = passports.getOrCreate(user); return Map.of("success", true, "data", Map.of("totalPoints", passport.getTotalPoints(), "level", passport.getLevel(), "explorationCount", passport.getExplorationCount()), "message", "Success"); }
}
