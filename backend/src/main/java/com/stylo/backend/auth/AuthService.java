package com.stylo.backend.auth;

import com.stylo.backend.config.JwtConfig;
import com.stylo.backend.salon.Salon;
import com.stylo.backend.salon.SalonRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private static final Duration DURACION_TOKEN = Duration.ofDays(7);

    private final SalonRepository salonRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    // Se compara contra este hash cuando el correo no existe, para que el login tarde lo mismo
    // en ambos casos y no se pueda averiguar qué correos están registrados.
    private final String hashFicticio;

    public AuthService(SalonRepository salonRepository, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder) {
        this.salonRepository = salonRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.hashFicticio = passwordEncoder.encode("contraseña-ficticia");
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String email = normalizarEmail(request.email());
        if (salonRepository.existsByEmail(email)) {
            throw new EmailYaRegistradoException();
        }

        Salon salon = new Salon();
        salon.setNombre(request.nombre().trim());
        salon.setEmail(email);
        salon.setPasswordHash(passwordEncoder.encode(request.password()));
        salon.setTelefono(StringUtils.hasText(request.telefono()) ? request.telefono().trim() : null);

        try {
            salon = salonRepository.saveAndFlush(salon);
        } catch (DataIntegrityViolationException e) {
            // Dos registros simultáneos con el mismo correo: lo frena el UNIQUE de la base
            throw new EmailYaRegistradoException();
        }
        return emitirToken(salon);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        Salon salon = salonRepository.findByEmail(normalizarEmail(request.email())).orElse(null);
        if (salon == null) {
            passwordEncoder.matches(request.password(), hashFicticio);
            throw new CredencialesInvalidasException();
        }
        if (!passwordEncoder.matches(request.password(), salon.getPasswordHash())) {
            throw new CredencialesInvalidasException();
        }
        return emitirToken(salon);
    }

    private TokenResponse emitirToken(Salon salon) {
        Instant ahora = Instant.now();
        Instant expiraEn = ahora.plus(DURACION_TOKEN);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(JwtConfig.ISSUER)
                .subject(salon.getId().toString())
                .issuedAt(ahora)
                .expiresAt(expiraEn)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new TokenResponse(token, expiraEn);
    }

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
