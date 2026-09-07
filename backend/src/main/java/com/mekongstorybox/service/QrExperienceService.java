package com.mekongstorybox.service;

import com.mekongstorybox.entity.QrScan;
import com.mekongstorybox.repository.QrScanRepository;
import com.mekongstorybox.repository.QrTokenRepository;
import com.mekongstorybox.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QrExperienceService {
    private final QrTokenRepository tokens; private final QrScanRepository scans; private final UserRepository users; private final PassportService passports;
    public QrExperienceService(QrTokenRepository tokens, QrScanRepository scans, UserRepository users, PassportService passports) { this.tokens = tokens; this.scans = scans; this.users = users; this.passports = passports; }
    @Transactional public Result verify(String tokenValue, String email) {
        var token = tokens.findByToken(tokenValue).orElseThrow(() -> new IllegalArgumentException("Invalid QR token"));
        if (!"ACTIVE".equals(token.getStatus())) return new Result(false, false, "QR code không hợp lệ hoặc đã bị vô hiệu hóa.");
        var user = users.findByEmailIgnoreCase(email).orElseThrow();
        if (scans.existsByQrTokenIdAndUserId(token.getId(), user.getId())) return new Result(true, true, "Experience already unlocked");
        scans.save(new QrScan(token, user));
        passports.getOrCreate(user).addExploration(100);
        return new Result(true, true, "Experience unlocked");
    }
    public record Result(boolean valid, boolean counted, String message) {}
}
