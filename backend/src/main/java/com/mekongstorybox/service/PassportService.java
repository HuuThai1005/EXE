package com.mekongstorybox.service;

import com.mekongstorybox.entity.DigitalPassport;
import com.mekongstorybox.entity.User;
import com.mekongstorybox.repository.DigitalPassportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PassportService {
    private final DigitalPassportRepository passports;
    public PassportService(DigitalPassportRepository passports) { this.passports = passports; }
    @Transactional public DigitalPassport getOrCreate(User user) { return passports.findByUserId(user.getId()).orElseGet(() -> passports.save(new DigitalPassport(user))); }

    @Transactional
    public DigitalPassport addExploration(User user, int points) {
        var passport = passports.findByUserIdForUpdate(user.getId())
                .orElseGet(() -> passports.save(new DigitalPassport(user)));
        passport.addExploration(points);
        return passport;
    }

    @Transactional
    public DigitalPassport spendForReward(User user, int points) {
        var passport = passports.findByUserIdForUpdate(user.getId())
                .orElseGet(() -> passports.save(new DigitalPassport(user)));
        if (passport.getTotalPoints() < points) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Bạn cần đủ " + points + " điểm để đổi quà.");
        }
        passport.spendPoints(points);
        return passport;
    }

    /** Thu hồi điểm đã cộng (vd. đơn đã thanh toán bị hủy); không để điểm âm. */
    @Transactional
    public DigitalPassport revokePoints(User user, int points) {
        var passport = passports.findByUserIdForUpdate(user.getId())
                .orElseGet(() -> passports.save(new DigitalPassport(user)));
        int revocable = Math.min(points, passport.getTotalPoints());
        if (revocable > 0) passport.spendPoints(revocable);
        return passport;
    }

    @Transactional
    public DigitalPassport refundPoints(User user, int points) {
        var passport = passports.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new IllegalStateException("Passport not found for redemption refund"));
        passport.refundPoints(points);
        return passport;
    }
}
