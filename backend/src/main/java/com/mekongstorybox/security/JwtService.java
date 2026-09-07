package com.mekongstorybox.security;

import com.mekongstorybox.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expiration;
    public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration}") long expiration) { try { this.key = Keys.hmacShaKeyFor(MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8))); } catch (Exception exception) { throw new IllegalStateException("Unable to initialize JWT signing key", exception); } this.expiration = expiration; }
    public String createToken(User user) { return Jwts.builder().claims(Map.of("userId", user.getId(), "roles", user.getRoles().stream().map(role -> role.getName()).toList())).subject(user.getEmail()).issuedAt(new Date()).expiration(new Date(System.currentTimeMillis() + expiration)).signWith(key).compact(); }
    public String email(String token) { return claims(token).getSubject(); }
    public boolean isValid(String token) { try { claims(token); return true; } catch (RuntimeException exception) { return false; } }
    private Claims claims(String token) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); }
}
