package com.mekongstorybox.repository;

import com.mekongstorybox.entity.QrToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface QrTokenRepository extends JpaRepository<QrToken, Long> {
	Optional<QrToken> findByToken(String token);

	/** SELECT ... FOR UPDATE: hai lượt quét đồng thời cùng một mã phải xếp hàng, lượt sau sẽ thấy mã đã USED. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select qr from QrToken qr where qr.token = :token")
	Optional<QrToken> findByTokenForUpdate(@Param("token") String token);

	long countByStatus(String status);

	long countByProduct_Id(Long productId);

	@Query("select qr from QrToken qr left join fetch qr.product order by qr.id desc")
	List<QrToken> findAllWithProducts();

	/** Chỉ thu hồi mã chưa quét; điều kiện status nằm trong câu UPDATE nên không ghi đè mã vừa được quét. */
	@Modifying
	@Query("update QrToken qr set qr.status = 'REVOKED' where qr.id = :id and qr.status = 'ACTIVE'")
	int revokeIfActive(@Param("id") Long id);
}
