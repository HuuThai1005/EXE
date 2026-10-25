package com.mekongstorybox.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.Locale;
import java.util.Set;

/**
 * Xác minh ID token do Google Identity Services trả về cho frontend: đúng chữ ký Google (khóa công khai lấy từ JWKS),
 * đúng issuer, audience là Client ID của ứng dụng, còn hạn và email đã được Google xác thực.
 */
@Component
public class GoogleTokenVerifier {
    private static final String JWK_SET_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> ISSUERS = Set.of("https://accounts.google.com", "accounts.google.com");
    private static final int MAX_NAME_LENGTH = 150;

    public record GoogleProfile(String email, String fullName) {}

    private final String clientId;
    private final NimbusJwtDecoder decoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
        // Khóa JWKS được tải khi xác minh lần đầu và cache lại, nên backend vẫn khởi động được khi không có mạng
        this.decoder = NimbusJwtDecoder.withJwkSetUri(JWK_SET_URI).build();
        this.decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                new JwtClaimValidator<Object>(JwtClaimNames.ISS, issuer -> issuer != null && ISSUERS.contains(issuer.toString())),
                new JwtClaimValidator<Object>(JwtClaimNames.AUD, audience -> audience instanceof Collection<?> values && values.contains(this.clientId))));
    }

    public GoogleProfile verify(String idToken) {
        if (clientId.isEmpty()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Đăng nhập bằng Google chưa được cấu hình trên máy chủ.");
        try {
            var jwt = decoder.decode(idToken);
            var email = jwt.getClaimAsString("email");
            // email_verified có thể là boolean hoặc chuỗi "true" tùy phiên bản token
            if (email == null || email.isBlank() || !"true".equals(String.valueOf(jwt.getClaims().get("email_verified")))) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản Google chưa xác thực email.");
            }
            email = email.trim().toLowerCase(Locale.ROOT);
            var name = jwt.getClaimAsString("name");
            if (name == null || name.isBlank()) name = email.substring(0, email.indexOf('@'));
            name = name.trim();
            return new GoogleProfile(email, name.length() > MAX_NAME_LENGTH ? name.substring(0, MAX_NAME_LENGTH) : name);
        } catch (BadJwtException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
        } catch (JwtException exception) {
            // Lỗi không phải do token (vd. không tải được khóa công khai của Google)
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Không kết nối được tới Google. Vui lòng thử lại sau.");
        }
    }
}
