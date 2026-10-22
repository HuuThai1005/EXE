package com.mekongstorybox.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final int MAX_TOKEN_LENGTH = 4096;

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) { this.jwtService = jwtService; this.userDetailsService = userDetailsService; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && header.length() <= MAX_TOKEN_LENGTH && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwtService.validEmail(header.substring(7)).ifPresent(email -> {
                try {
                    var details = userDetailsService.loadUserByUsername(email);
                    var authentication = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (UsernameNotFoundException ignored) {
                    // Token hợp lệ nhưng tài khoản đã bị xóa: coi như chưa đăng nhập
                }
            });
        }
        chain.doFilter(request, response);
    }
}
