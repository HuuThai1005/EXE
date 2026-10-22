package com.mekongstorybox.repository;

import com.mekongstorybox.entity.QrScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QrScanRepository extends JpaRepository<QrScan, Long> {
    boolean existsByQrTokenIdAndUserId(Long qrTokenId, Long userId);

    @Modifying
    @Query("delete from QrScan scan where scan.qrToken.id = :qrTokenId")
    int deleteAllByQrTokenId(@Param("qrTokenId") Long qrTokenId);
}
