package com.stylo.backend.error;

import com.stylo.backend.auth.CredencialesInvalidasException;
import com.stylo.backend.auth.EmailYaRegistradoException;
import com.stylo.backend.cita.CitaNoEncontradaException;
import com.stylo.backend.cita.RangoFechasInvalidoException;
import com.stylo.backend.cliente.ClienteNoEncontradoException;
import com.stylo.backend.cliente.TelefonoRepetidoException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Hereda de ResponseEntityExceptionHandler para que todos los errores de Spring MVC salgan como ProblemDetail
 * y para poder dar en español los mensajes de los que más ve el cliente (datos inválidos, JSON ilegible).
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errores.putIfAbsent(error.getField(), error.getDefaultMessage()));

        ProblemDetail problema = problema(HttpStatus.BAD_REQUEST, "Datos inválidos", "Revisa los datos enviados");
        problema.setProperty("errores", errores);
        return handleExceptionInternal(ex, problema, headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problema = problema(HttpStatus.BAD_REQUEST, "Datos inválidos",
                "El cuerpo de la solicitud no es un JSON válido");
        return handleExceptionInternal(ex, problema, headers, status, request);
    }

    // Por ejemplo, un {id} en la URL que no es un UUID
    @Override
    protected ResponseEntity<Object> handleTypeMismatch(TypeMismatchException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        ProblemDetail problema = problema(HttpStatus.BAD_REQUEST, "Datos inválidos",
                "El valor de '" + ex.getPropertyName() + "' no es válido");
        return handleExceptionInternal(ex, problema, headers, status, request);
    }

    @ExceptionHandler(ClienteNoEncontradoException.class)
    ProblemDetail clienteNoEncontrado(ClienteNoEncontradoException ex) {
        return problema(HttpStatus.NOT_FOUND, "No encontrado", ex.getMessage());
    }

    @Override
    protected ResponseEntity<Object> handleMissingServletRequestParameter(MissingServletRequestParameterException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problema = problema(HttpStatus.BAD_REQUEST, "Datos inválidos",
                "Falta el parámetro '" + ex.getParameterName() + "'");
        return handleExceptionInternal(ex, problema, headers, status, request);
    }

    @ExceptionHandler(CitaNoEncontradaException.class)
    ProblemDetail citaNoEncontrada(CitaNoEncontradaException ex) {
        return problema(HttpStatus.NOT_FOUND, "No encontrada", ex.getMessage());
    }

    @ExceptionHandler(RangoFechasInvalidoException.class)
    ProblemDetail rangoFechasInvalido(RangoFechasInvalidoException ex) {
        return problema(HttpStatus.BAD_REQUEST, "Datos inválidos", ex.getMessage());
    }

    @ExceptionHandler(TelefonoRepetidoException.class)
    ProblemDetail telefonoRepetido(TelefonoRepetidoException ex) {
        return problema(HttpStatus.CONFLICT, "Teléfono repetido", ex.getMessage());
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    ProblemDetail credencialesInvalidas(CredencialesInvalidasException ex) {
        return problema(HttpStatus.UNAUTHORIZED, "No autorizado", ex.getMessage());
    }

    // Token ausente, inválido o vencido (llega desde el AuthenticationEntryPoint de SecurityConfig)
    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail noAutenticado(AuthenticationException ex) {
        return problema(HttpStatus.UNAUTHORIZED, "No autorizado", "Debes iniciar sesión para continuar");
    }

    @ExceptionHandler(EmailYaRegistradoException.class)
    ProblemDetail emailYaRegistrado(EmailYaRegistradoException ex) {
        return problema(HttpStatus.CONFLICT, "Correo ya registrado", ex.getMessage());
    }

    private static ProblemDetail problema(HttpStatus status, String titulo, String detalle) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(status, detalle);
        problema.setTitle(titulo);
        return problema;
    }
}
