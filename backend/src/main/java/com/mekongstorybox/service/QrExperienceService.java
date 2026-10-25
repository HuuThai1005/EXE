package com.mekongstorybox.service;

import com.mekongstorybox.entity.QrScan;
import com.mekongstorybox.entity.QrToken;
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
        var user = users.findByEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại."));
        var token = tokens.findByTokenForUpdate(tokenValue.trim()).orElse(null);
        if (token == null) return new Result(false, false, "QR code không hợp lệ.");
        if (QrToken.USED.equals(token.getStatus())) {
            var message = scans.existsByQrTokenIdAndUserId(token.getId(), user.getId())
                    ? "Bạn đã quét mã QR này rồi. Mỗi mã chỉ được dùng một lần."
                    : "Mã QR này đã được sử dụng.";
            return new Result(false, false, message);
        }
        if (!QrToken.ACTIVE.equals(token.getStatus())) return new Result(false, false, "Mã QR này đã bị thu hồi.");
        token.markUsed();
        scans.save(new QrScan(token, user));
        passports.addExploration(user, 100);
        return new Result(true, true, "Experience unlocked");
    }
    public record Result(boolean valid, boolean counted, String message) {}
}
