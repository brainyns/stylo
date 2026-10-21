package com.stylo.backend.cliente;

import com.stylo.backend.cita.CitaRepository;
import com.stylo.backend.cita.ResumenVisitas;
import com.stylo.backend.salon.SalonRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Todas las operaciones reciben el salonId del token y nunca tocan clientes de otro salón.
 */
@Service
public class ClienteService {

    private static final String RESTRICCION_TELEFONO_UNICO = "uk_cliente_salon_telefono";

    private final ClienteRepository clienteRepository;
    private final SalonRepository salonRepository;
    private final CitaRepository citaRepository;

    public ClienteService(ClienteRepository clienteRepository, SalonRepository salonRepository,
            CitaRepository citaRepository) {
        this.clienteRepository = clienteRepository;
        this.salonRepository = salonRepository;
        this.citaRepository = citaRepository;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar(UUID salonId) {
        // Una sola consulta agregada para las visitas de todos los clientes, no una por cliente
        Map<UUID, ResumenVisitas> resumenes = citaRepository.resumenPorCliente(salonId, Instant.now()).stream()
                .collect(Collectors.toMap(ResumenVisitas::clienteId, Function.identity()));
        return clienteRepository.findAllBySalonIdOrderByNombreAsc(salonId).stream()
                .map(cliente -> ClienteResponse.from(cliente, resumenes.get(cliente.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse obtener(UUID salonId, UUID id) {
        return responder(salonId, buscar(salonId, id));
    }

    @Transactional
    public ClienteResponse crear(UUID salonId, ClienteRequest request) {
        if (clienteRepository.existsBySalonIdAndTelefono(salonId, request.telefono())) {
            throw new TelefonoRepetidoException();
        }
        Cliente cliente = new Cliente();
        cliente.setSalon(salonRepository.getReferenceById(salonId));
        aplicar(cliente, request);
        // Recién creado: todavía no tiene citas
        return ClienteResponse.from(guardar(cliente), null);
    }

    @Transactional
    public ClienteResponse actualizar(UUID salonId, UUID id, ClienteRequest request) {
        Cliente cliente = buscar(salonId, id);
        boolean cambiaTelefono = !cliente.getTelefono().equals(request.telefono());
        if (cambiaTelefono && clienteRepository.existsBySalonIdAndTelefono(salonId, request.telefono())) {
            throw new TelefonoRepetidoException();
        }
        aplicar(cliente, request);
        return responder(salonId, guardar(cliente));
    }

    @Transactional
    public void eliminar(UUID salonId, UUID id) {
        clienteRepository.delete(buscar(salonId, id));
    }

    private ClienteResponse responder(UUID salonId, Cliente cliente) {
        ResumenVisitas resumen = citaRepository.resumenDeCliente(salonId, cliente.getId(), Instant.now()).orElse(null);
        return ClienteResponse.from(cliente, resumen);
    }

    private Cliente buscar(UUID salonId, UUID id) {
        return clienteRepository.findByIdAndSalonId(id, salonId)
                .orElseThrow(ClienteNoEncontradoException::new);
    }

    private static void aplicar(Cliente cliente, ClienteRequest request) {
        cliente.setNombre(request.nombre());
        cliente.setTelefono(request.telefono());
        cliente.setTono(request.tono());
        cliente.setFormula(request.formula());
        cliente.setFrecuenciaSemanas(request.frecuenciaSemanas());
        cliente.setNotas(request.notas());
    }

    private Cliente guardar(Cliente cliente) {
        try {
            return clienteRepository.saveAndFlush(cliente);
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
