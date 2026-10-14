# Stylo

Micro app para peluquerías: la peluquera registra sus clientas, la fórmula de color de cada una, cada cuánto retocan, servicios y pagos, y les envía recordatorios por WhatsApp. Se venderá por suscripción mensual a salones en Colombia.

## Estructura

- `backend/`: Spring Boot 4.1.1, Java 21, Maven. Paquete base `com.stylo.backend`.
- `frontend/`: React + Vite + TypeScript (aún no creado).
- `docs/`: planificación y decisiones.

## Stack backend

Spring Web, Spring Data JPA, PostgreSQL, Spring Security con JWT, Validation, Flyway, Lombok.

## Comandos

- Base de datos: docker compose up -d
  - PostgreSQL de Docker usa el puerto 5433 porque el 5432 lo ocupa el PostgreSQL local de Windows.
- Backend: `cd backend && ./mvnw spring-boot:run` (en Windows: `cd backend; .\mvnw.cmd spring-boot:run`)
  - El backend lee el `.env` de la raíz (`spring.config.import=optional:file:../.env[.properties]`), por eso hay que arrancarlo desde `backend/`. Si no encuentra el `.env`, usa los valores por defecto de desarrollo.
- Tests backend: `cd backend && ./mvnw test`

## Reglas del proyecto

- Multi-salón: toda consulta de datos se filtra por el salón del usuario autenticado. Nunca devolver datos de otro salón.
- El esquema de base de datos se cambia solo con migraciones de Flyway en `backend/src/main/resources/db/migration` (`V1__...sql`, `V2__...sql`). No usar `ddl-auto=update`.
- El saldo de una clienta se calcula (servicios menos pagos), no se guarda a mano.
- Secretos (contraseña de BD, clave JWT) en variables de entorno, nunca en el código. Documentarlas en `.env.example`.
- Conceptos del negocio en español (`Clienta`, `Servicio`, `Pago`); términos técnicos en inglés (`Controller`, `Repository`, `Service`).
- Textos visibles al usuario en español de Colombia; montos en COP.

## Git

- Commits cortos en español, en imperativo: "Agrega CRUD de clientas".
- No agregar líneas de coautoría de Claude en los commits (sin "Co-Authored-By: Claude" ni "Generated with Claude Code").

## Sprint actual: Sprint 1

Registro e inicio de sesión con JWT, y CRUD de clientas filtrado por salón. Fuera de alcance por ahora: servicios, pagos, WhatsApp y cobros con Wompi.

- Backend: terminado.
  - `POST /api/auth/register` y `POST /api/auth/login` (públicos, devuelven `token` y `expiraEn`).
  - `GET /api/me`.
  - `GET/POST /api/clientas`, `GET/PUT/DELETE /api/clientas/{id}` (con token; el salón sale del token).
- Frontend: pendiente (React + Vite + TypeScript en `frontend/`, corre en `http://localhost:5173`, el único origen permitido por CORS).
