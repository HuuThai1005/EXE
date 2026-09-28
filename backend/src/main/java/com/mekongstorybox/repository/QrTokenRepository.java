package com.mekongstorybox.repository;

import com.mekongstorybox.entity.QrToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.List;

public interface QrTokenRepository extends JpaRepository<QrToken, Long> {
	Optional<QrToken> findByToken(String token);

	@Query("select qr from QrToken qr left join fetch qr.product order by qr.id desc")
	List<QrToken> findAllWithProducts();
}
