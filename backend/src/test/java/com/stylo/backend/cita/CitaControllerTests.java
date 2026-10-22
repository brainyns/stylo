package com.stylo.backend.cita;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CitaControllerTests {

    @Autowired
    MockMvc mvc;

    String token;
    String clienteId;

    @BeforeEach
    void registrarNegocioConCliente() throws Exception {
        token = registrar("BARBERIA");
        clienteId = crearCliente(token, "Carlos Pérez", 2);
    }

    @Test
    void laCitaCompletadaCalculaCuandoLeTocaVolver() throws Exception {
        Instant haceUnaSemana = Instant.now().minus(7, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        String citaId = crearCita(token, clienteId, haceUnaSemana, "Corte y barba", 35000);
        Instant manana = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        crearCita(token, clienteId, manana, "Corte", 25000);

        mvc.perform(patch("/api/citas/" + citaId + "/estado").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"estado\":\"COMPLETADA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("COMPLETADA"));

        mvc.perform(get("/api/clientes/" + clienteId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ultimaVisita").value(haceUnaSemana.toString()))
                .andExpect(jsonPath("$.proximaCita").value(manana.toString()))
                // Frecuencia de 2 semanas
                .andExpect(jsonPath("$.leTocaVolver").value(haceUnaSemana.plus(14, ChronoUnit.DAYS).toString()))
                // Solo cuenta la cita atendida, no la programada para mañana
                .andExpect(jsonPath("$.visitas").value(1))
                .andExpect(jsonPath("$.totalGastado").value(35000));

        mvc.perform(get("/api/clientes").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].visitas").value(1))
                .andExpect(jsonPath("$[0].totalGastado").value(35000));

        mvc.perform(get("/api/citas").header("Authorization", "Bearer " + token)
                        .param("desde", haceUnaSemana.minus(1, ChronoUnit.DAYS).toString())
                        .param("hasta", manana.plus(1, ChronoUnit.DAYS).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].servicio").value("Corte y barba"))
                .andExpect(jsonPath("$[0].cliente.nombre").value("Carlos Pérez"));
    }

    @Test
    void sinCitasNoHayFechaParaVolver() throws Exception {
        mvc.perform(get("/api/clientes/" + clienteId).header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.ultimaVisita").value(nullValue()))
                .andExpect(jsonPath("$.leTocaVolver").value(nullValue()))
                .andExpect(jsonPath("$.visitas").value(0))
                .andExpect(jsonPath("$.totalGastado").value(0));
    }

    @Test
    void otroNegocioNoVeNiUsaLasCitasNiLosClientesAjenos() throws Exception {
        String citaId = crearCita(token, clienteId, Instant.now(), "Corte", 25000);
        String otroToken = registrar("PELUQUERIA");

        mvc.perform(get("/api/citas/" + citaId).header("Authorization", "Bearer " + otroToken))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/citas/" + citaId).header("Authorization", "Bearer " + otroToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/citas").header("Authorization", "Bearer " + otroToken).param("clienteId", clienteId))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/citas").header("Authorization", "Bearer " + otroToken)
                        .param("desde", Instant.now().minus(1, ChronoUnit.DAYS).toString())
                        .param("hasta", Instant.now().plus(1, ChronoUnit.DAYS).toString()))
                .andExpect(jsonPath("$", hasSize(0)));
        // No puede agendarle una cita a un cliente de otro negocio
        mvc.perform(post("/api/citas").header("Authorization", "Bearer " + otroToken)
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpoCita(clienteId, Instant.now(), "Corte", 1)))
                .andExpect(status().isNotFound());
    }

    @Test
    void validaLosDatosYElRango() throws Exception {
        mvc.perform(post("/api/citas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"precio\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.clienteId").value("Elige el cliente"))
                .andExpect(jsonPath("$.errores.servicio").value("Escribe el servicio"))
                .andExpect(jsonPath("$.errores.precio").value("El precio no puede ser negativo"));

        Instant ahora = Instant.now();
        mvc.perform(get("/api/citas").header("Authorization", "Bearer " + token)
                        .param("desde", ahora.toString()).param("hasta", ahora.plus(90, ChronoUnit.DAYS).toString()))
                .andExpect(status().isBadRequest());
    }

    private String registrar(String tipo) throws Exception {
        String email = "negocio-" + UUID.randomUUID() + "@stylo.test";
        String respuesta = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Negocio de prueba","email":"%s","password":"12345678","tipo":"%s"}
                                """.formatted(email, tipo)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.token");
    }

    private String crearCliente(String token, String nombre, int frecuenciaSemanas) throws Exception {
        String telefono = "3" + String.format("%09d", (long) (Math.random() * 1_000_000_000L));
        String respuesta = mvc.perform(post("/api/clientes").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"%s","telefono":"%s","frecuenciaSemanas":%d}
                                """.formatted(nombre, telefono, frecuenciaSemanas)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.id");
    }

    private String crearCita(String token, String clienteId, Instant inicio, String servicio, long precio)
            throws Exception {
        String respuesta = mvc.perform(post("/api/citas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpoCita(clienteId, inicio, servicio, precio)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.id");
    }

    private static String cuerpoCita(String clienteId, Instant inicio, String servicio, long precio) {
        return """
                {"clienteId":"%s","inicio":"%s","servicio":"%s","precio":%d}
                """.formatted(clienteId, inicio, servicio, precio);
    }
}
