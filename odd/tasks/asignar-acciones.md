# Asignar acciones a accionistas (fase 2)

Asignar 1 o varias acciones ya registradas a un accionista, con validación de
duplicado (si la acción ya está asignada a otro accionista, no se permite).
UI: detalle de accionista con tab "Acciones".

## Specs
S1. Se puede asignar **1 o varias** acciones ya registradas a un accionista en una sola operación. [user: "se le pudan agregar 1 o varias acciones de las que ya se encuentran registradas"].
S2. Validación de duplicado: si una acción **ya fue asignada a otro accionista** no se permite asignarla (error 409 que identifica el código de la acción). Si ya está asignada al MISMO accionista no es error: se ignora idempotently (no duplica). [user: "si la accion ya fue asignada a otro usuario no se permita agregar"].
S3. El detalle del accionista muestra un **tab llamado "Acciones"** con el detalle de cada acción asignada: por ahora el **código** de la acción (ej. `00001`). [user: "deberia aparecer en un tab que se llame acciones y salga el detalle de la accion, el cual es el codigo de la accion por el momento ejpm: 00001"].
S4. Se puede **quitar (desasignar)** una acción asignada, para reasignarla luego a otro accionista. [decision user: "Sí, quitar y volver a asignar"].
S5. Asignación y desasignación exigen **auth (Bearer) + rol admin**; lectura del tab exige Bearer. Mismo patrón de guards del módulo acciones. [decision user: "Auth + admin (recomendado)"].
S6. No rompe S4 del módulo acciones (PUT `/api/acciones/:id` sigue permitiendo editar solo `code`): la asignación vive en endpoints nuevos bajo `/api/accionistas/:id/acciones`. [consistency with acciones-module.md S4].
S7. Accionista inexistente en endpoints de asignación → 404 `{ error: "Accionista no encontrado" }`. [consistency with accionistas routes].

## API contract
- GET    `/api/accionistas/:id/acciones`           auth+admin -> 200 { data: [accion] } | 404
- POST   `/api/accionistas/:id/acciones`           auth+admin, body { accionIds: string[] } -> 200 { data: [accion asignada], skipped: string[] } | 400 (accionIds ausente/vacía) | 404 accionista | 404 `{ error: "Accion no encontrada" }` (algún id no existe) | 409 `{ error: "La acción <code> ya está asignada a otro accionista" }`
- DELETE `/api/accionistas/:id/acciones/:accionId` auth+admin -> 200 { message } | 404 accionista | 404 `{ error: "Accion no encontrada" }` | 409 `{ error: "La accion no pertenece a este accionista" }`

Semántica: asigna en lote; si CUALQUIER id no existe o está asignada a OTRO accionista, la operación se rechaza completa (404/409, nada cambia). Acciones ya asignadas al mismo accionista se listan en `skipped` y no duplican. `Accion.shareholderId` guarda el `_id` (ObjectId) del `Accionista`; la URL usa el campo numérico `id` del accionista.

## Tasks
T1. [backend] Tests-first: agregar cases a `backend/test/integration/acciones.endpoints.test.ts` (o nuevo `asignacion.endpoints.test.ts`): fixtures accionista + acciones; POST asigna 2 nuevas -> 200 data de 2, shareholderId guardado; re-POST mismo accionista -> 200 skipped; POST acción de otro accionista -> 409 con código y el otro accionista SIN cambios; POST id inexistente -> 404; POST body vacío -> 400; GET lista solo las asignadas al accionista; DELETE quita (shareholderId=null) y vuelve a poder asignarse a otro; DELETE de acción no suya -> 409; 404 accionista; 401 sin token; 403 no-admin. Verificar RED antes de implementar.
T2. [backend] Implementar: helpers en `models/accionista.js` (o nuevo módulo `acciones-assignacion`) + routes en `routes/accionistas.js` (`:id/acciones` GET/POST/DELETE) con `adminOnly`/auth; `Accion.shareholderId` = `_id` de Accionista; actualizar `AccionesManager` column "Accionista" a mostrar nombre via lookup simple opcional (no scope).
T3. [frontend] Detalle de accionista: en `AccionistasManager` agregar botón "Ver" -> vista de detalle con tabs **Datos | Acciones** (sin router). Tab Acciones: tabla con columna Código (ej. 00001), botón "Quitar"; botón "+ Asignar acciones" abre modal con checkbox list de acciones registradas SIN asignar (código) -> POST lote; muestra 409/404 del backend. Auth: reusar token `acciones_token` (mismo login que AccionesManager); si no hay token, pedir login antes de mostrar operaciones de escritura.
T4. [parent] Verify: backend suite completa + frontend suite/build; confirmar flujo accionistas y módulo acciones intactos; commit work unit en feature branch. DONE: backend 29/29, frontend 92/92, build OK. Commits 29c27ea (backend+tests+doc, 522 lines) y 1437508 (frontend+tests, 593 lines) en feature/acciones-module.

## Log
L1. [user, verbatim] "En el accionista vamos a agregar la funcionabilidad que se le pudan agregar 1 o varias acciones de las que ya se encuentran registradas. Deb haber una validacion que si la accion ya fue asignada a otro usuario no se permita agregar. Esta nueva funcionalidad deberia aparecer en un tab que se llame acciones y salga el detalle de la accion, el cual es el codigo de la accion por el momento ejpm: 00001"
L2. [decisions] Detalle al abrir un accionista (tabs Datos|Acciones); quitar/reasignar sí; auth+admin para asignar/quitar.
L3. [finding] `Accion.shareholderId` es ObjectId ref "Shareholder" pero el modelo vivo es `Accionista` (JS, id numérico, `_id` ObjectId): se guarda `Accionista._id` y se resuelve la URL por el campo numérico `id`. `Shareholder` (TS) es modelo fantasma sin consumer.
L4. [impl] Backend: `acciones-asignacion.routes.ts` (GET/POST/DELETE `/api/accionistas/:id/acciones` + `/:accionId`), montado en `app.ts` vía regex `use()` (Express 4 no captura `:id` en `use` string path; el id se pasa por `req.accionistaId` porque el sub-router resetea `req.params`). Lote atómico: 400/404/409 sin mutar nada; idempotente con `skipped`. `GET /api/acciones/disponibles` en acciones.routes.ts antes de `/:id`.
L5. [slice] Commits 29c27ea (522 líneas) y 1437508 (593 líneas) exceden la guía de 400 porque cada uno es una unidad lógica indivisible (rutas+tests del mismo comportamiento); tests junto al comportamiento. Suite backend 29/29, frontend 92/92, build OK.
L6. [risk] Risk: item 2 (nuevos endpoints de escritura bajo auth+admin; guards cubiertos por tests 401/403) — verificado con gentle-ai-verify: PASS.
L7. [user, verbatim] "cuanto se esta realizando la asignacion de las acciones al accionista esta saliendo este error validalo y corrigelo  JSON.parse: unexpected character at line 1 column 1 of the JSON data"
L8. [bugfix] Raíz: `server.js` arranca `require("./app")` → resuelve **app.js** (CommonJS), no app.ts; los tests importan app.ts por eso pasaban. El servidor real no tenía el mount de asignación ni /disponibles → Express respondía HTML "Cannot POST" y el frontend `res.json()` explotaba. Fix: mismo mount (regex + authMiddleware + adminOnly + req.accionistaId) en `app.js` siguiendo el patrón `await import` existente. Tests de regresión `test/appjs-asignacion.test.ts` (3) corriendo contra app.js real: JSON 200 en POST, /disponibles 200, 401 sin token. Suite backend 32/32. Commit en feature/acciones-module.
- L9 (2026-07-14): Native review `review-bd99127c7af82dcd` (tier medium, lenses risk/resilience/reliability + refuter): **approved y consumido** (revision `sha256:9fe9ac6203ea2360a2a3e9b7cf152c212c`). Findings no bloqueantes: R1-01 (app.js, informativo), R3-MODEL-DIVERGENCE (app.js vs app.ts, WARNING — mantener en sync al tocar las dos; ver L6), R3-DELETE-RACE (SUGGESTION), R4-assign-race (WARNING — S5), R3-RACE-POST (CRITICAL, refutado por el refuter). Delivery sigue política normal del repo (push/PR decisión del usuario).
