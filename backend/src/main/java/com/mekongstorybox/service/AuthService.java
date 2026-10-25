package com.mekongstorybox.service;

import com.mekongstorybox.dto.AuthDtos.*;
import com.mekongstorybox.entity.Role;
import com.mekongstorybox.entity.User;
import com.mekongstorybox.repository.RoleRepository;
import com.mekongstorybox.repository.UserRepository;
import com.mekongstorybox.security.GoogleTokenVerifier;
import com.mekongstorybox.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository users; private final RoleRepository roles; private final PasswordEncoder encoder; private final JwtService jwt; private final AuthenticationManager authenticationManager; private final GoogleTokenVerifier google;
    public AuthService(UserRepository users, RoleRepository roles, PasswordEncoder encoder, JwtService jwt, AuthenticationManager authenticationManager, GoogleTokenVerifier google) { this.users = users; this.roles = roles; this.encoder = encoder; this.jwt = jwt; this.authenticationManager = authenticationManager; this.google = google; }
    @Transactional public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được đăng ký.");
        var user = new User(request.fullName().trim(), email, encoder.encode(request.password()), request.language() == null ? "vi" : request.language());
        user.getRoles().add(userRole());
        users.save(user);
        return response(user);
    }
    /** Đăng nhập bằng Google: email đã có tài khoản thì đăng nhập vào tài khoản đó, chưa có thì tự tạo tài khoản USER mới. */
    @Transactional public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        var profile = google.verify(request.credential());
        var user = users.findByEmailIgnoreCase(profile.email()).orElseGet(() -> {
            // Tài khoản tạo qua Google không có mật khẩu: lưu hash của chuỗi ngẫu nhiên để đăng nhập bằng mật khẩu luôn thất bại
            var created = new User(profile.fullName(), profile.email(), encoder.encode(UUID.randomUUID().toString()), "vi");
            created.getRoles().add(userRole());
            return users.save(created);
        });
        return response(user);
    }
    public AuthResponse login(LoginRequest request) { String email = request.email().trim().toLowerCase(Locale.ROOT); authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password())); return response(users.findByEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng."))); }
    public UserResponse me(String email) { return toUser(users.findByEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại."))); }
    private Role userRole() { return roles.findByName("USER").orElseThrow(() -> new IllegalStateException("Role USER is missing")); }
    private AuthResponse response(User user) { return new AuthResponse(jwt.createToken(user), toUser(user)); }
    private UserResponse toUser(User user) { return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getLanguage(), user.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toSet())); }
}
