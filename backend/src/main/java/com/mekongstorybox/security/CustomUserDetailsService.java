package com.mekongstorybox.security;

import com.mekongstorybox.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository users;
    public CustomUserDetailsService(UserRepository users) { this.users = users; }
    @Override public UserDetails loadUserByUsername(String email) { var user = users.findByEmailIgnoreCase(email).orElseThrow(() -> new UsernameNotFoundException("User not found")); return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPasswordHash(), user.getRoles().stream().map(role -> new SimpleGrantedAuthority(role.getName())).toList()); }
}
