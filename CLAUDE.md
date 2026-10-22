# Stylo

Micro app unificada para peluquerías y barberías: el negocio registra a sus clientes, la fórmula de color o las notas del corte de cada uno, cada cuánto vuelven, servicios y pagos, y les envía recordatorios por WhatsApp. Se venderá por suscripción mensual a peluquerías y barberías en Colombia.

Al registrarse, el negocio elige su tipo (`PELUQUERIA`, `BARBERIA` o `MIXTO`); internamente todos son un `Salon`.

## Estructura

- `backend/`: Spring Boot 4.1.1, Java 21, Maven. Paquete base `com.stylo.backend`.
- `frontend/`: React + Vite + TypeScript, Tailwind CSS y React Router. Cliente de API en `src/api/`, pantallas en `src/pages/`.
- `docs/`: planificación y decisiones.

## Stack backend

Spring Web, Spring Data JPA, PostgreSQL, Spring Security con JWT, Validation, Flyway, Lombok.

## Comandos

- Base de datos: docker compose up -d
  - PostgreSQL de Docker usa el puerto 5433 porque el 5432 lo ocupa el PostgreSQL local de Windows.
- Backend: `cd backend && ./mvnw spring-boot:run` (en Windows: `cd backend; .\mvnw.cmd spring-boot:run`)
  - El backend lee el `.env` de la raíz (`spring.config.import=optional:file:../.env[.properties]`), por eso hay que arrancarlo desde `backend/`. Si no encuentra el `.env`, usa los valores por defecto de desarrollo.
  - Si el backend falla con errores de compilación raros, usar .\mvnw.cmd clean spring-boot:run
    - Pasa cuando la extensión de Java de VS Code compila en `backend/target/classes` y Maven reutiliza esas clases. `.vscode/settings.json` desactiva esa compilación automática.
- Tests backend: `cd backend && ./mvnw test`
- Frontend: cd frontend && npm run dev
  - Corre en `http://localhost:5173`, el único origen permitido por CORS. La URL del backend sale de `VITE_API_URL` (ver `frontend/.env.example`), por defecto `http://localhost:8080`.

## Reglas del proyecto

- Multi-negocio: toda consulta de datos se filtra por el salón del usuario autenticado. Nunca devolver datos de otro salón.
- El esquema de base de datos se cambia solo con migraciones de Flyway en `backend/src/main/resources/db/migration` (`V1__...sql`, `V2__...sql`). No usar `ddl-auto=update`.
- El saldo de un cliente se calcula (servicios menos pagos), no se guarda a mano.
- Secretos (contraseña de BD, clave JWT) en variables de entorno, nunca en el código. Documentarlas en `.env.example`.
- Conceptos del negocio en español (`Cliente`, `Salon`, `Servicio`, `Pago`). Textos neutros que sirvan a peluquerías y barberías ("cliente", "negocio"), no "clienta" ni "salón"; términos técnicos en inglés (`Controller`, `Repository`, `Service`).
- Textos visibles al usuario en español de Colombia; montos en COP.
- En pantalla el tipo `BARBERIA` se llama "Barber" (plural "barbers"), no "Barbería". El valor interno del enum no cambia.
- Estilo visual: carbón (escala `stone`) y cobre (`marca-*` en `index.css`); títulos en Fraunces y texto en Manrope.

## Git

- Commits cortos en español, en imperativo: "Agrega CRUD de clientas".
- No agregar líneas de coautoría de Claude en los commits (sin "Co-Authored-By: Claude" ni "Generated with Claude Code").

## Sprint 1 (terminado)

Registro e inicio de sesión con JWT, y CRUD de clientes filtrado por salón.

- `POST /api/auth/register` (con `tipo` del negocio) y `POST /api/auth/login` (públicos, devuelven `token` y `expiraEn`).
- `GET /api/me` (incluye el `tipo` del negocio).
- `GET/POST /api/clientes`, `GET/PUT/DELETE /api/clientes/{id}` (con token; el salón sale del token).
- Frontend: `/registro`, `/login`, `/clientes` (lista con buscador), `/clientes/nuevo` y `/clientes/{id}` (editar y eliminar).
- El token se guarda en `localStorage` (TODO: revisarlo antes de producción). Si el backend responde 401 con token, se cierra la sesión y se manda al login.

## Sprint actual: Sprint 2 (en curso)

Agenda de citas y cálculo de cuándo le toca volver a cada cliente.

- Hecho:
  - `GET /api/citas?desde=&hasta=` (máx. 62 días), `GET /api/citas?clienteId=`, `GET/POST /api/citas`, `PUT/DELETE /api/citas/{id}`, `PATCH /api/citas/{id}/estado`.
  - Estados: `PROGRAMADA`, `COMPLETADA` (cuenta como visita), `NO_ASISTIO`, `CANCELADA`. Precio en COP sin decimales.
  - `ClienteResponse` trae `ultimaVisita`, `proximaCita` y `leTocaVolver` (última visita + frecuencia), calculados desde las citas.
  - La FK `(cliente_id, salon_id)` de `cita` garantiza en la base que el cliente es del mismo salón.
  - Frontend con pestañas: `/agenda` (semana, día, marcar atendida), `/clientes`, `/por-volver` (atrasados y los de esta semana sin cita). Citas en `/agenda/nueva` y `/agenda/{id}`.
  - WhatsApp con enlace `wa.me` y mensaje ya escrito (recordatorio de cita e invitación a volver); no usa la API de WhatsApp.
- Pendiente: pagos y saldo, envío automático por WhatsApp y cobros con Wompi.
