package com.mekongstorybox.service;

import com.mekongstorybox.dto.AuthDtos.*;
import com.mekongstorybox.entity.User;
import com.mekongstorybox.repository.RoleRepository;
import com.mekongstorybox.repository.UserRepository;
import com.mekongstorybox.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository users; private final RoleRepository roles; private final PasswordEncoder encoder; private final JwtService jwt; private final AuthenticationManager authenticationManager;
    public AuthService(UserRepository users, RoleRepository roles, PasswordEncoder encoder, JwtService jwt, AuthenticationManager authenticationManager) { this.users = users; this.roles = roles; this.encoder = encoder; this.jwt = jwt; this.authenticationManager = authenticationManager; }
    @Transactional public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được đăng ký.");
        var user = new User(request.fullName().trim(), email, encoder.encode(request.password()), request.language() == null ? "vi" : request.language());
        user.getRoles().add(roles.findByName("USER").orElseThrow(() -> new IllegalStateException("Role USER is missing")));
        users.save(user);
        return response(user);
    }
    public AuthResponse login(LoginRequest request) { String email = request.email().trim().toLowerCase(Locale.ROOT); authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password())); return response(users.findByEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng."))); }
    public UserResponse me(String email) { return toUser(users.findByEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại."))); }
    private AuthResponse response(User user) { return new AuthResponse(jwt.createToken(user), toUser(user)); }
    private UserResponse toUser(User user) { return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getLanguage(), user.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toSet())); }
}
