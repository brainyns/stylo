package com.stylo.backend.cita;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * El salonId sale siempre del token (subject), nunca del body ni de la URL.
 */
@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    /** Citas de la agenda entre desde (incluido) y hasta (excluido), en ISO-8601. */
    @GetMapping
    public List<CitaResponse> listar(@AuthenticationPrincipal Jwt jwt, @RequestParam Instant desde,
            @RequestParam Instant hasta) {
        return citaService.listar(salonId(jwt), desde, hasta);
    }

    /** Historial de un cliente, de la más reciente a la más antigua. */
    @GetMapping(params = "clienteId")
    public List<CitaResponse> listarDeCliente(@AuthenticationPrincipal Jwt jwt, @RequestParam UUID clienteId) {
        return citaService.listarDeCliente(salonId(jwt), clienteId);
    }

    @GetMapping("/{id}")
    public CitaResponse obtener(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return citaService.obtener(salonId(jwt), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CitaResponse crear(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CitaRequest request) {
        return citaService.crear(salonId(jwt), request);
    }

    @PutMapping("/{id}")
    public CitaResponse actualizar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @Valid @RequestBody CitaRequest request) {
        return citaService.actualizar(salonId(jwt), id, request);
    }

    /** Para marcar desde la agenda que el cliente vino, no vino o canceló. */
    @PatchMapping("/{id}/estado")
    public CitaResponse cambiarEstado(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @Valid @RequestBody CambioEstadoRequest request) {
        return citaService.cambiarEstado(salonId(jwt), id, request.estado());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        citaService.eliminar(salonId(jwt), id);
    }

    private static UUID salonId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
