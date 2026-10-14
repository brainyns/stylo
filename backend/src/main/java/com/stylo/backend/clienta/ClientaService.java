package com.stylo.backend.clienta;

import com.stylo.backend.salon.SalonRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Todas las operaciones reciben el salonId del token y nunca tocan clientas de otro salón.
 */
@Service
public class ClientaService {

    private static final String RESTRICCION_TELEFONO_UNICO = "uk_clienta_salon_telefono";

    private final ClientaRepository clientaRepository;
    private final SalonRepository salonRepository;

    public ClientaService(ClientaRepository clientaRepository, SalonRepository salonRepository) {
        this.clientaRepository = clientaRepository;
        this.salonRepository = salonRepository;
    }

    @Transactional(readOnly = true)
    public List<ClientaResponse> listar(UUID salonId) {
        return clientaRepository.findAllBySalonIdOrderByNombreAsc(salonId).stream()
                .map(ClientaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientaResponse obtener(UUID salonId, UUID id) {
        return ClientaResponse.from(buscar(salonId, id));
    }

    @Transactional
    public ClientaResponse crear(UUID salonId, ClientaRequest request) {
        if (clientaRepository.existsBySalonIdAndTelefono(salonId, request.telefono())) {
            throw new TelefonoRepetidoException();
        }
        Clienta clienta = new Clienta();
        clienta.setSalon(salonRepository.getReferenceById(salonId));
        aplicar(clienta, request);
        return ClientaResponse.from(guardar(clienta));
    }

    @Transactional
    public ClientaResponse actualizar(UUID salonId, UUID id, ClientaRequest request) {
        Clienta clienta = buscar(salonId, id);
        boolean cambiaTelefono = !clienta.getTelefono().equals(request.telefono());
        if (cambiaTelefono && clientaRepository.existsBySalonIdAndTelefono(salonId, request.telefono())) {
            throw new TelefonoRepetidoException();
        }
        aplicar(clienta, request);
        return ClientaResponse.from(guardar(clienta));
    }

    @Transactional
    public void eliminar(UUID salonId, UUID id) {
        clientaRepository.delete(buscar(salonId, id));
    }

    private Clienta buscar(UUID salonId, UUID id) {
        return clientaRepository.findByIdAndSalonId(id, salonId)
                .orElseThrow(ClientaNoEncontradaException::new);
    }

    private static void aplicar(Clienta clienta, ClientaRequest request) {
        clienta.setNombre(request.nombre());
        clienta.setTelefono(request.telefono());
        clienta.setTono(request.tono());
        clienta.setFormula(request.formula());
        clienta.setFrecuenciaSemanas(request.frecuenciaSemanas());
        clienta.setNotas(request.notas());
    }

    private Clienta guardar(Clienta clienta) {
        try {
            return clientaRepository.saveAndFlush(clienta);
        } catch (DataIntegrityViolationException e) {
            // Dos solicitudes simultáneas con el mismo teléfono: lo frena el UNIQUE de la base
            String causa = String.valueOf(e.getMostSpecificCause().getMessage());
            if (causa.contains(RESTRICCION_TELEFONO_UNICO)) {
                throw new TelefonoRepetidoException();
            }
            throw e;
        }
    }
}
