package com.stylo.backend.panel;

import com.stylo.backend.cita.CitaRepository;
import com.stylo.backend.cita.CitaResponse;
import com.stylo.backend.cita.EstadoCita;
import com.stylo.backend.panel.PanelResponse.ClienteFrecuente;
import com.stylo.backend.panel.PanelResponse.Clientes;
import com.stylo.backend.panel.PanelResponse.ClientesDelMes;
import com.stylo.backend.panel.PanelResponse.IngresoDelDia;
import com.stylo.backend.panel.PanelResponse.Ingresos;
import com.stylo.backend.panel.PanelResponse.Periodo;
import com.stylo.backend.panel.PanelResponse.ServicioPedido;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Calcula el panel con dos consultas de citas atendidas y agrega en memoria: un negocio pequeño
 * tiene pocos cientos de citas al mes, y así cada métrica queda en Java fácil de leer y probar.
 */
@Service
public class PanelService {

    /** Los negocios están en Colombia (sin horario de verano): ahí se cortan los días, semanas y meses. */
    static final ZoneId ZONA = ZoneId.of("America/Bogota");

    private static final int DIAS_GRAFICA = 30;
    private static final int DIAS_RANKING = 90;
    private static final int MESES_CLIENTES = 6;
    private static final int TOP = 5;
    private static final int PROXIMAS = 6;
    private static final int DIAS_PROXIMAS = 14;

    private final PanelRepository panelRepository;
    private final CitaRepository citaRepository;
    private final Clock clock;

    @Autowired
    public PanelService(PanelRepository panelRepository, CitaRepository citaRepository) {
        this(panelRepository, citaRepository, Clock.system(ZONA));
    }

    PanelService(PanelRepository panelRepository, CitaRepository citaRepository, Clock clock) {
        this.panelRepository = panelRepository;
        this.citaRepository = citaRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PanelResponse resumen(UUID salonId) {
        LocalDate hoy = LocalDate.now(clock.withZone(ZONA));
        LocalDate manana = hoy.plusDays(1);
        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate inicioMesAnterior = inicioMes.minusMonths(1);
        LocalDate inicioGrafica = hoy.minusDays(DIAS_GRAFICA - 1);
        LocalDate inicioRanking = hoy.minusDays(DIAS_RANKING - 1);
        LocalDate inicioClientes = inicioMes.minusMonths(MESES_CLIENTES - 1);
        LocalDate desde = Stream.of(inicioMesAnterior, inicioGrafica, inicioRanking, inicioClientes)
                .min(Comparator.naturalOrder()).orElseThrow();

        List<CitaAtendida> atendidas = panelRepository.atendidasEntre(salonId, instante(desde), instante(manana));

        return new PanelResponse(
                hoy,
                ingresos(atendidas, hoy, inicioMes, inicioMesAnterior),
                ingresosPorDia(atendidas, inicioGrafica, hoy),
                citasHoy(salonId, hoy),
                proximasCitas(salonId, manana),
                serviciosTop(desde(atendidas, inicioRanking)),
                clientesFrecuentes(desde(atendidas, inicioRanking)),
                clientes(salonId, atendidas, inicioMes));
    }

    private static Ingresos ingresos(List<CitaAtendida> atendidas, LocalDate hoy, LocalDate inicioMes,
            LocalDate inicioMesAnterior) {
        LocalDate lunes = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        // Del 1 al mismo día del mes pasado (o hasta su último día si era más corto)
        LocalDate finCorteAnterior = inicioMesAnterior.plusDays(hoy.getDayOfMonth());
        if (finCorteAnterior.isAfter(inicioMes)) {
            finCorteAnterior = inicioMes;
        }
        Periodo delDia = sumar(atendidas, entre(hoy, hoy.plusDays(1)));
        Periodo semana = sumar(atendidas, entre(lunes, hoy.plusDays(1)));
        Periodo mes = sumar(atendidas, entre(inicioMes, hoy.plusDays(1)));
        Periodo mesAnterior = sumar(atendidas, entre(inicioMesAnterior, finCorteAnterior));
        Long ticket = mes.cobros() > 0 ? Math.round((double) mes.total() / mes.cobros()) : null;
        double porDia = Math.round(10.0 * mes.cobros() / hoy.getDayOfMonth()) / 10.0;
        return new Ingresos(delDia, semana, mes, mesAnterior, ticket, porDia);
    }

    private static List<IngresoDelDia> ingresosPorDia(List<CitaAtendida> atendidas, LocalDate inicio, LocalDate hoy) {
        Map<LocalDate, Periodo> porDia = new LinkedHashMap<>();
        for (LocalDate dia = inicio; !dia.isAfter(hoy); dia = dia.plusDays(1)) {
            porDia.put(dia, Periodo.VACIO);
        }
        for (CitaAtendida cita : atendidas) {
            porDia.computeIfPresent(fecha(cita), (dia, periodo) -> periodo.sumar(cita.precio()));
        }
        return porDia.entrySet().stream()
                .map(e -> new IngresoDelDia(e.getKey(), e.getValue().total(), e.getValue().cobros()))
                .toList();
    }

    private List<CitaResponse> citasHoy(UUID salonId, LocalDate hoy) {
        return citaRepository.findAllBySalonIdAndInicioGreaterThanEqualAndInicioLessThanOrderByInicioAsc(
                        salonId, instante(hoy), instante(hoy.plusDays(1))).stream()
                .filter(cita -> cita.getEstado() != EstadoCita.CANCELADA)
                .map(CitaResponse::from)
                .toList();
    }

    private List<CitaResponse> proximasCitas(UUID salonId, LocalDate manana) {
        return citaRepository.findAllBySalonIdAndInicioGreaterThanEqualAndInicioLessThanOrderByInicioAsc(
                        salonId, instante(manana), instante(manana.plusDays(DIAS_PROXIMAS))).stream()
                .filter(cita -> cita.getEstado() == EstadoCita.PROGRAMADA)
                .limit(PROXIMAS)
                .map(CitaResponse::from)
                .toList();
    }

    /** Agrupa sin importar mayúsculas ni espacios ("corte " y "Corte" son lo mismo) y muestra la primera escritura. */
    private static List<ServicioPedido> serviciosTop(List<CitaAtendida> atendidas) {
        Map<String, String> nombres = new LinkedHashMap<>();
        Map<String, long[]> conteo = new LinkedHashMap<>();
        for (CitaAtendida cita : atendidas) {
            String nombre = cita.servicio().trim();
            String clave = nombre.toLowerCase(Locale.ROOT);
            nombres.putIfAbsent(clave, nombre);
            long[] vecesYTotal = conteo.computeIfAbsent(clave, k -> new long[2]);
            vecesYTotal[0]++;
            vecesYTotal[1] += cita.precio() != null ? cita.precio() : 0;
        }
        return conteo.entrySet().stream()
                .map(e -> new ServicioPedido(nombres.get(e.getKey()), e.getValue()[0], e.getValue()[1]))
                .sorted(Comparator.comparingLong(ServicioPedido::veces).reversed()
                        .thenComparing(Comparator.comparingLong(ServicioPedido::total).reversed()))
                .limit(TOP)
                .toList();
    }

    private static List<ClienteFrecuente> clientesFrecuentes(List<CitaAtendida> atendidas) {
        return atendidas.stream()
                .collect(Collectors.groupingBy(CitaAtendida::clienteId, LinkedHashMap::new, Collectors.toList()))
                .values().stream()
                .map(citas -> new ClienteFrecuente(
                        citas.getFirst().clienteId(),
                        citas.getFirst().clienteNombre(),
                        citas.size(),
                        citas.stream().mapToLong(c -> c.precio() != null ? c.precio() : 0).sum()))
                .sorted(Comparator.comparingLong(ClienteFrecuente::visitas).reversed()
                        .thenComparing(Comparator.comparingLong(ClienteFrecuente::gastado).reversed()))
                .limit(TOP)
                .toList();
    }

    /** Por mes: nuevo si su primera visita fue ese mes; recurrente si ya había venido antes. */
    private Clientes clientes(UUID salonId, List<CitaAtendida> atendidas, LocalDate inicioMes) {
        Map<UUID, YearMonth> mesPrimeraVisita = panelRepository.primerasVisitas(salonId).stream()
                .collect(Collectors.toMap(PrimeraVisita::clienteId, p -> YearMonth.from(p.primera().atZone(ZONA))));

        YearMonth actual = YearMonth.from(inicioMes);
        Map<YearMonth, Set<UUID>> atendidosPorMes = new LinkedHashMap<>();
        for (int i = MESES_CLIENTES - 1; i >= 0; i--) {
            atendidosPorMes.put(actual.minusMonths(i), new HashSet<>());
        }
        long visitasMes = 0;
        for (CitaAtendida cita : atendidas) {
            YearMonth mes = YearMonth.from(fecha(cita));
            Set<UUID> atendidos = atendidosPorMes.get(mes);
            if (atendidos != null) {
                atendidos.add(cita.clienteId());
            }
            if (mes.equals(actual)) {
                visitasMes++;
            }
        }

        List<ClientesDelMes> porMes = new ArrayList<>();
        atendidosPorMes.forEach((mes, atendidos) -> {
            long nuevos = atendidos.stream().filter(id -> mes.equals(mesPrimeraVisita.get(id))).count();
            porMes.add(new ClientesDelMes(mes, nuevos, atendidos.size() - nuevos));
        });
        ClientesDelMes delMes = porMes.getLast();
        long atendidosMes = delMes.nuevos() + delMes.recurrentes();
        return new Clientes(delMes.nuevos(), delMes.recurrentes(), visitasMes, atendidosMes, porMes);
    }

    private static Periodo sumar(List<CitaAtendida> atendidas, Predicate<CitaAtendida> filtro) {
        Periodo periodo = Periodo.VACIO;
        for (CitaAtendida cita : atendidas) {
            if (filtro.test(cita)) {
                periodo = periodo.sumar(cita.precio());
            }
        }
        return periodo;
    }

    private static List<CitaAtendida> desde(List<CitaAtendida> atendidas, LocalDate inicio) {
        return atendidas.stream().filter(entre(inicio, LocalDate.MAX)).toList();
    }

    /** Entre desde (incluido) y hasta (excluido), en días de Colombia. */
    private static Predicate<CitaAtendida> entre(LocalDate desde, LocalDate hasta) {
        return cita -> {
            LocalDate dia = fecha(cita);
            return !dia.isBefore(desde) && dia.isBefore(hasta);
        };
    }

    private static LocalDate fecha(CitaAtendida cita) {
        return cita.inicio().atZone(ZONA).toLocalDate();
    }

    private static Instant instante(LocalDate dia) {
        return dia.atStartOfDay(ZONA).toInstant();
    }
}
