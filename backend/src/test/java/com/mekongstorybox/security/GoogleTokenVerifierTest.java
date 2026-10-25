package com.mekongstorybox.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GoogleTokenVerifierTest {
    @Test
    void refusesWhenClientIdIsNotConfigured() {
        var exception = assertThrows(ResponseStatusException.class, () -> new GoogleTokenVerifier(" ").verify("anything"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
    }

    @Test
    void rejectsMalformedTokenAsUnauthorized() {
        var exception = assertThrows(ResponseStatusException.class, () -> new GoogleTokenVerifier("client-id.apps.googleusercontent.com").verify("not-a-jwt"));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
    }
}
