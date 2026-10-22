package com.mekongstorybox.service;

import com.mekongstorybox.entity.QrScan;
import com.mekongstorybox.repository.QrScanRepository;
import com.mekongstorybox.repository.QrTokenRepository;
import com.mekongstorybox.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QrExperienceService {
    private final QrTokenRepository tokens; private final QrScanRepository scans; private final UserRepository users; private final PassportService passports;
    public QrExperienceService(QrTokenRepository tokens, QrScanRepository scans, UserRepository users, PassportService passports) { this.tokens = tokens; this.scans = scans; this.users = users; this.passports = passports; }
    @Transactional public Result verify(String tokenValue, String email) {
        var token = tokens.findByToken(tokenValue.trim()).orElse(null);
        if (token == null || !"ACTIVE".equals(token.getStatus())) return new Result(false, false, "QR code không hợp lệ hoặc đã bị vô hiệu hóa.");
        var user = users.findByEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại."));
        if (scans.existsByQrTokenIdAndUserId(token.getId(), user.getId())) return new Result(true, true, "Experience already unlocked");
        scans.save(new QrScan(token, user));
        passports.addExploration(user, 100);
        return new Result(true, true, "Experience unlocked");
    }
    public record Result(boolean valid, boolean counted, String message) {}
}
