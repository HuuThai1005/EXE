package com.mekongstorybox.security;

import com.mekongstorybox.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class JwtService {
    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final int MIN_SECRET_LENGTH = 32;
    private static final Set<String> PLACEHOLDER_SECRETS = Set.of("change-me-in-env", "change-this-to-a-long-random-secret");

    private final SecretKey key;
    private final long expiration;

    public JwtService(@Value("${jwt.secret:}") String secret, @Value("${jwt.expiration}") long expiration) {
        this.key = signingKey(secret);
        this.expiration = expiration;
    }

    private static SecretKey signingKey(String secret) {
        if (secret == null || secret.isBlank() || secret.length() < MIN_SECRET_LENGTH || PLACEHOLDER_SECRETS.contains(secret)) {
            // Secret yếu/mặc định cho phép giả mạo token ADMIN, nên dùng khóa ngẫu nhiên thay thế.
            // Hệ quả: token cũ mất hiệu lực mỗi lần restart. Hãy đặt JWT_SECRET (>= 32 ký tự) trong môi trường.
            log.warn("JWT_SECRET is missing or weak (< {} chars). Using a random signing key; all tokens will be invalidated on restart.", MIN_SECRET_LENGTH);
            var random = new byte[64];
            new SecureRandom().nextBytes(random);
            return Keys.hmacShaKeyFor(random);
        }
        try {
            return Keys.hmacShaKeyFor(MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to initialize JWT signing key", exception);
        }
    }

    public String createToken(User user) { return Jwts.builder().claims(Map.of("userId", user.getId(), "roles", user.getRoles().stream().map(role -> role.getName()).toList())).subject(user.getEmail()).issuedAt(new Date()).expiration(new Date(System.currentTimeMillis() + expiration)).signWith(key).compact(); }

    /** Trả về email trong token nếu token hợp lệ (đúng chữ ký, chưa hết hạn). */
    public Optional<String> validEmail(String token) {
        try {
            return Optional.ofNullable(claims(token).getSubject());
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    private Claims claims(String token) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); }
}
