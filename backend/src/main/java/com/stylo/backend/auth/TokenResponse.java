package com.stylo.backend.auth;

import java.time.Instant;

public record TokenResponse(String token, Instant expiraEn) {
}
