package com.mekongstorybox.repository;

import com.mekongstorybox.entity.DigitalPassport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DigitalPassportRepository extends JpaRepository<DigitalPassport, Long> { Optional<DigitalPassport> findByUserId(Long userId); }
