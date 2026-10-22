package com.stylo.backend.panel;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PanelControllerTests {

    @Autowired
    MockMvc mvc;

    @Test
    void calculaIngresosServiciosYClientesDelNegocio() throws Exception {
        String token = registrar();
        LocalDate hoy = LocalDate.now(PanelService.ZONA);
        String andres = crearCliente(token, "Andrés");
        String bruno = crearCliente(token, "Bruno");
        String camilo = crearCliente(token, "Camilo");

        // Andrés ya había venido hace 40 días (siempre antes de este mes): hoy regresa
        crearCita(token, andres, a(hoy.minusDays(40), 10), "Corte", 30000, "COMPLETADA");
        crearCita(token, andres, a(hoy, 12), "Corte y barba", 35000, "COMPLETADA");
        // Bruno viene por primera vez; "corte " cuenta como "Corte"
        crearCita(token, bruno, a(hoy, 13), "corte ", 25000, "COMPLETADA");
        crearCita(token, bruno, a(hoy.plusDays(1), 9), "Barba", 15000, "PROGRAMADA");
        crearCita(token, camilo, a(hoy, 15), "Corte", 25000, "PROGRAMADA");

        mvc.perform(get("/api/panel").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hoy").value(hoy.toString()))
                .andExpect(jsonPath("$.ingresos.hoy.total").value(60000))
                .andExpect(jsonPath("$.ingresos.hoy.cobros").value(2))
                .andExpect(jsonPath("$.ingresos.mes.total").value(60000))
                .andExpect(jsonPath("$.ingresos.ticketPromedio").value(30000))
                .andExpect(jsonPath("$.ingresosPorDia", hasSize(30)))
                .andExpect(jsonPath("$.ingresosPorDia[29].total").value(60000))
                .andExpect(jsonPath("$.citasHoy", hasSize(3)))
                .andExpect(jsonPath("$.proximasCitas", hasSize(1)))
                .andExpect(jsonPath("$.proximasCitas[0].servicio").value("Barba"))
                .andExpect(jsonPath("$.serviciosTop[0].servicio").value("Corte"))
                .andExpect(jsonPath("$.serviciosTop[0].veces").value(2))
                .andExpect(jsonPath("$.serviciosTop[0].total").value(55000))
                .andExpect(jsonPath("$.clientesFrecuentes[0].nombre").value("Andrés"))
                .andExpect(jsonPath("$.clientesFrecuentes[0].visitas").value(2))
                .andExpect(jsonPath("$.clientesFrecuentes[0].gastado").value(65000))
                .andExpect(jsonPath("$.clientes.nuevosMes").value(1))
                .andExpect(jsonPath("$.clientes.recurrentesMes").value(1))
                .andExpect(jsonPath("$.clientes.visitasMes").value(2))
                .andExpect(jsonPath("$.clientes.porMes", hasSize(6)))
                .andExpect(jsonPath("$.clientes.porMes[5].mes").value(YearMonth.from(hoy).toString()));

        // Otro negocio no ve nada de lo anterior
        mvc.perform(get("/api/panel").header("Authorization", "Bearer " + registrar()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ingresos.mes.total").value(0))
                .andExpect(jsonPath("$.citasHoy", hasSize(0)))
                .andExpect(jsonPath("$.serviciosTop", hasSize(0)))
                .andExpect(jsonPath("$.clientesFrecuentes", hasSize(0)));
    }

    @Test
    void sinTokenNoHayPanel() throws Exception {
        mvc.perform(get("/api/panel")).andExpect(status().isUnauthorized());
    }

    private static Instant a(LocalDate dia, int hora) {
        return dia.atTime(LocalTime.of(hora, 0)).atZone(PanelService.ZONA).toInstant();
    }

    private String registrar() throws Exception {
        String respuesta = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Barber de prueba","email":"negocio-%s@stylo.test","password":"12345678","tipo":"BARBERIA"}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.token");
    }

    private String crearCliente(String token, String nombre) throws Exception {
        String telefono = "3" + String.format("%09d", (long) (Math.random() * 1_000_000_000L));
        String respuesta = mvc.perform(post("/api/clientes").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"%s\",\"telefono\":\"%s\"}".formatted(nombre, telefono)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.id");
    }

    private void crearCita(String token, String clienteId, Instant inicio, String servicio, long precio, String estado)
            throws Exception {
        mvc.perform(post("/api/citas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clienteId":"%s","inicio":"%s","servicio":"%s","precio":%d,"estado":"%s"}
                                """.formatted(clienteId, inicio, servicio, precio, estado)))
                .andExpect(status().isCreated());
    }
}
