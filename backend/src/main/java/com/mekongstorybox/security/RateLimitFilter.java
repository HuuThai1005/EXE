package com.mekongstorybox.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Giới hạn số request theo IP (fixed window 1 phút) để chống brute-force đăng nhập,
 * dò mã QR và spam request làm cạn CPU (BCrypt) / kết nối database.
 * Lưu trong bộ nhớ nên chỉ có hiệu lực trên từng instance backend.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_MILLIS = 60_000;
    private static final int MAX_TRACKED_KEYS = 100_000;

    private record Rule(String name, String method, String pathPrefix, int limitPerMinute) {
        boolean matches(HttpServletRequest request) {
            return (method == null || method.equals(request.getMethod())) && request.getRequestURI().startsWith(pathPrefix);
        }
    }

    private static final List<Rule> RULES = List.of(
            new Rule("login", "POST", "/api/auth/login", 10),
            new Rule("register", "POST", "/api/auth/register", 5),
            new Rule("google", "POST", "/api/auth/google", 10),
            new Rule("qr", "POST", "/api/qr/verify", 20),
            new Rule("order", "POST", "/api/orders", 20),
            new Rule("redeem", "POST", "/api/passport/redemptions", 10),
            new Rule("upload", "POST", "/api/admin/images", 30),
            new Rule("api", null, "/api/", 300)
    );

    private static final class Window {
        final long startedAt;
        final AtomicInteger count = new AtomicInteger();
        Window(long startedAt) { this.startedAt = startedAt; }
    }

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final boolean enabled;

    public RateLimitFilter(@Value("${app.rate-limit.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        if (!enabled || "OPTIONS".equals(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        var rule = RULES.stream().filter(candidate -> candidate.matches(request)).findFirst().orElse(null);
        if (rule == null) {
            chain.doFilter(request, response);
            return;
        }
        long now = System.currentTimeMillis();
        if (windows.size() > MAX_TRACKED_KEYS) windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt >= WINDOW_MILLIS);
        // getRemoteAddr() đã được thay bằng IP thật khi chạy sau proxy nội bộ (server.forward-headers-strategy)
        var key = rule.name() + "|" + request.getRemoteAddr();
        var window = windows.compute(key, (ignored, current) -> current == null || now - current.startedAt >= WINDOW_MILLIS ? new Window(now) : current);
        if (window.count.incrementAndGet() > rule.limitPerMinute()) {
            long retryAfterSeconds = Math.max(1, (window.startedAt + WINDOW_MILLIS - now) / 1000);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"data\":null,\"status\":429,\"message\":\"Bạn thao tác quá nhanh. Vui lòng thử lại sau " + retryAfterSeconds + " giây.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
