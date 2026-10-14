package com.stylo.backend.auth;

import com.stylo.backend.salon.SalonRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MeController {

    private final SalonRepository salonRepository;

    @GetMapping("/api/me")
    public SalonResponse me(@AuthenticationPrincipal Jwt jwt) {
        UUID salonId = UUID.fromString(jwt.getSubject());
        return salonRepository.findById(salonId)
                .map(SalonResponse::from)
                // Token válido pero el salón ya no existe
                .orElseThrow(() -> new InvalidBearerTokenException("El salón del token no existe"));
    }
}
