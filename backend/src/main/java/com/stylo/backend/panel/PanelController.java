package com.stylo.backend.panel;

import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Métricas del negocio del token. El salonId sale siempre del token (subject).
 */
@RestController
@RequestMapping("/api/panel")
public class PanelController {

    private final PanelService panelService;

    public PanelController(PanelService panelService) {
        this.panelService = panelService;
    }

    @GetMapping
    public PanelResponse resumen(@AuthenticationPrincipal Jwt jwt) {
        return panelService.resumen(UUID.fromString(jwt.getSubject()));
    }
}
