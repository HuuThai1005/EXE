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
}
