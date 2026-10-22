package com.mekongstorybox.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

public final class AuthDtos {
    private AuthDtos() {}
    // BCrypt chỉ dùng 72 byte đầu của mật khẩu, nên giới hạn 72 ký tự để không bị cắt ngầm
    public record RegisterRequest(@NotBlank @Size(max = 150) String fullName, @NotBlank @Email @Size(max = 255) String email, @NotBlank @Size(min = 8, max = 72) String password, @Pattern(regexp = "vi|en") String language) {}
    public record LoginRequest(@NotBlank @Email @Size(max = 255) String email, @NotBlank @Size(max = 100) String password) {}
    public record UserResponse(Long id, String fullName, String email, String language, Set<String> roles) {}
    public record AuthResponse(String accessToken, UserResponse user) {}
}
