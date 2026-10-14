package com.stylo.backend.clienta;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * El salonId sale siempre del token (subject), nunca del body ni de la URL.
 */
@RestController
@RequestMapping("/api/clientas")
@RequiredArgsConstructor
public class ClientaController {

    private final ClientaService clientaService;

    @GetMapping
    public List<ClientaResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return clientaService.listar(salonId(jwt));
    }

    @GetMapping("/{id}")
    public ClientaResponse obtener(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return clientaService.obtener(salonId(jwt), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientaResponse crear(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ClientaRequest request) {
        return clientaService.crear(salonId(jwt), request);
    }

    @PutMapping("/{id}")
    public ClientaResponse actualizar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @Valid @RequestBody ClientaRequest request) {
        return clientaService.actualizar(salonId(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        clientaService.eliminar(salonId(jwt), id);
    }

    private static UUID salonId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
