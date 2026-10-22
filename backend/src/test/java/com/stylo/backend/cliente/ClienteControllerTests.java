package com.stylo.backend.cliente;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
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
class ClienteControllerTests {

    @Autowired
    MockMvc mvc;

    String token;

    @BeforeEach
    void registrarNegocio() throws Exception {
        String respuesta = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Barber de prueba","email":"negocio-%s@stylo.test","password":"12345678","tipo":"BARBERIA"}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        token = JsonPath.read(respuesta, "$.token");
    }

    @Test
    void bastaConNombreYTelefono() throws Exception {
        mvc.perform(post("/api/clientes").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\" Andrés Gómez \",\"telefono\":\"+57 300 123 4567\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Andrés Gómez"))
                .andExpect(jsonPath("$.telefono").value("3001234567"))
                .andExpect(jsonPath("$.email").value(nullValue()))
                .andExpect(jsonPath("$.frecuenciaSemanas").value(5));
    }

    @Test
    void guardaElCorreoEnMinusculasYLoPuedeCambiar() throws Exception {
        String respuesta = mvc.perform(post("/api/clientes").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Juan\",\"telefono\":\"3011112233\",\"email\":\" Juan@Correo.COM \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("juan@correo.com"))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(respuesta, "$.id");

        // Un correo vacío lo borra
        mvc.perform(put("/api/clientes/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Juan\",\"telefono\":\"3011112233\",\"email\":\"  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(nullValue()));
        mvc.perform(get("/api/clientes/" + id).header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.email").value(nullValue()));
    }

    @Test
    void rechazaUnCorreoMalEscrito() throws Exception {
        mvc.perform(post("/api/clientes").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Juan\",\"telefono\":\"3011112233\",\"email\":\"juan-correo.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.email")
                        .value("Revisa el correo, parece incompleto (ej. nombre@correo.com)"));
    }
}
