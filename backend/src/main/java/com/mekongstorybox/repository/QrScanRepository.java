package com.mekongstorybox.repository;

import com.mekongstorybox.entity.QrScan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QrScanRepository extends JpaRepository<QrScan, Long> { boolean existsByQrTokenIdAndUserId(Long qrTokenId, Long userId); }
