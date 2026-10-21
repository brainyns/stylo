package com.stylo.backend.cita;

import com.stylo.backend.cliente.Cliente;
import com.stylo.backend.cliente.ClienteNoEncontradoException;
import com.stylo.backend.cliente.ClienteRepository;
import com.stylo.backend.salon.SalonRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Todas las operaciones reciben el salonId del token y nunca tocan citas ni clientes de otro salón.
 */
@Service
public class CitaService {

    static final int DIAS_MAXIMOS_RANGO = 62;

    private final CitaRepository citaRepository;
    private final ClienteRepository clienteRepository;
    private final SalonRepository salonRepository;

    public CitaService(CitaRepository citaRepository, ClienteRepository clienteRepository,
            SalonRepository salonRepository) {
        this.citaRepository = citaRepository;
        this.clienteRepository = clienteRepository;
        this.salonRepository = salonRepository;
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listar(UUID salonId, Instant desde, Instant hasta) {
        if (!hasta.isAfter(desde) || Duration.between(desde, hasta).toDays() > DIAS_MAXIMOS_RANGO) {
            throw new RangoFechasInvalidoException();
        }
        return citaRepository
                .findAllBySalonIdAndInicioGreaterThanEqualAndInicioLessThanOrderByInicioAsc(salonId, desde, hasta)
                .stream()
                .map(CitaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarDeCliente(UUID salonId, UUID clienteId) {
        return citaRepository.findAllBySalonIdAndClienteIdOrderByInicioDesc(salonId, clienteId).stream()
                .map(CitaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CitaResponse obtener(UUID salonId, UUID id) {
        return CitaResponse.from(buscar(salonId, id));
    }

    @Transactional
    public CitaResponse crear(UUID salonId, CitaRequest request) {
        Cita cita = new Cita();
        cita.setSalon(salonRepository.getReferenceById(salonId));
        aplicar(cita, request, buscarCliente(salonId, request.clienteId()));
        return CitaResponse.from(citaRepository.saveAndFlush(cita));
    }

    @Transactional
    public CitaResponse actualizar(UUID salonId, UUID id, CitaRequest request) {
        Cita cita = buscar(salonId, id);
        aplicar(cita, request, buscarCliente(salonId, request.clienteId()));
        return CitaResponse.from(citaRepository.saveAndFlush(cita));
    }

    @Transactional
    public CitaResponse cambiarEstado(UUID salonId, UUID id, EstadoCita estado) {
        Cita cita = buscar(salonId, id);
        cita.setEstado(estado);
        return CitaResponse.from(citaRepository.saveAndFlush(cita));
    }

    @Transactional
    public void eliminar(UUID salonId, UUID id) {
        citaRepository.delete(buscar(salonId, id));
    }

    private Cita buscar(UUID salonId, UUID id) {
        return citaRepository.findByIdAndSalonId(id, salonId).orElseThrow(CitaNoEncontradaException::new);
    }

    private Cliente buscarCliente(UUID salonId, UUID clienteId) {
        return clienteRepository.findByIdAndSalonId(clienteId, salonId).orElseThrow(ClienteNoEncontradoException::new);
    }

    private static void aplicar(Cita cita, CitaRequest request, Cliente cliente) {
        cita.setCliente(cliente);
        cita.setInicio(request.inicio());
        cita.setDuracionMinutos(request.duracionMinutos());
        cita.setServicio(request.servicio());
        cita.setPrecio(request.precio());
        cita.setEstado(request.estado());
        cita.setNotas(request.notas());
    }
}
