package com.mekongstorybox.service;

import com.mekongstorybox.entity.QrScan;
import com.mekongstorybox.entity.QrToken;
import com.mekongstorybox.entity.User;
import com.mekongstorybox.repository.QrScanRepository;
import com.mekongstorybox.repository.QrTokenRepository;
import com.mekongstorybox.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

class QrExperienceServiceTest {
    private final QrTokenRepository tokens = mock(QrTokenRepository.class);
    private final QrScanRepository scans = mock(QrScanRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final PassportService passports = mock(PassportService.class);
    private final QrExperienceService service = new QrExperienceService(tokens, scans, users, passports);
    private final User user = new User("Linh", "linh@example.com", "hash", "vi");

    private QrToken token(String status) {
        var qr = new QrToken();
        qr.setToken("abc");
        qr.setStatus(status);
        when(tokens.findByTokenForUpdate("abc")).thenReturn(Optional.of(qr));
        return qr;
    }

    @BeforeEach
    void signIn() {
        when(users.findByEmailIgnoreCase("linh@example.com")).thenReturn(Optional.of(user));
    }

    @Test
    void firstScanUsesTheCodeAndAwardsPoints() {
        var qr = token(QrToken.ACTIVE);

        var result = service.verify(" abc ", "linh@example.com");

        assertTrue(result.valid());
        assertTrue(result.counted());
        assertEquals(QrToken.USED, qr.getStatus());
        assertNotNull(qr.getUsedAt());
        verify(scans).save(any(QrScan.class));
        verify(passports).addExploration(user, 100);
    }

    @Test
    void usedCodeCannotBeReplayed() {
        var qr = token(QrToken.ACTIVE);
        service.verify("abc", "linh@example.com");
        assertEquals(QrToken.USED, qr.getStatus());

        var replay = service.verify("abc", "linh@example.com");

        assertFalse(replay.valid());
        assertFalse(replay.counted());
        verify(scans, times(1)).save(any(QrScan.class));
        verify(passports, times(1)).addExploration(any(), anyInt());
    }

    @Test
    void revokedAndUnknownCodesAreRejected() {
        token(QrToken.REVOKED);
        assertFalse(service.verify("abc", "linh@example.com").valid());
        assertFalse(service.verify("missing", "linh@example.com").valid());
        verify(scans, never()).save(any());
        verify(passports, never()).addExploration(any(), anyInt());
    }
}
