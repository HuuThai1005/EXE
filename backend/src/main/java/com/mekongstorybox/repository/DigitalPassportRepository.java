package com.mekongstorybox.repository;

import com.mekongstorybox.entity.DigitalPassport;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface DigitalPassportRepository extends JpaRepository<DigitalPassport, Long> {
	Optional<DigitalPassport> findByUserId(Long userId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select passport from DigitalPassport passport where passport.user.id = :userId")
	Optional<DigitalPassport> findByUserIdForUpdate(@Param("userId") Long userId);
}
