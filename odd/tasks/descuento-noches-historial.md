# Descuento de noches e historial

Feature branch: `feature/descuento-noches-historial`.
Backend: endpoints de descuento e historial + filtro por año en curso. Frontend: popup de descuento e historial en la card del accionista.

## Specs

- S1: "se debe mostrar un popup para que se digite el numero de noches que se desean descontar" — desde la card del accionista (botón "Descontar noches", hoy deshabilitado), un modal permite digitar la cantidad de noches.
- S2: "la fecha del dia de descuento se va almacenar y se debe seleccionar, por defecto se selecciona el dia de hoy" — el popup incluye un selector de fecha (default: hoy) y esa fecha se persiste en el movimiento.
- S3: "tambien se pueda habilitar la funcionalidad del historia, mostrando la fecha y las noches que se han tomado" — botón "Ver historial" habilitado que muestra los movimientos con fecha y cantidad de noches.
- S4: "al realizar este descuento se debe deben adaptar las consultas o datos que tengan pendiente este historial cuando se visualicen las noches pendientes para disfrute por parte del accionista" — tras descontar, las noches disponibles de la consulta se actualizan restando el descuento.
- S5: "las noches de beneficio vuelven a su estado normal para todos los accionista el primero de enero del año en curso" — solo los movimientos cuya **fecha de descuento seleccionada** pertenece al año en curso restan del saldo. Movimientos de años anteriores no restan (noches disponibles completas). Decisión del usuario: el año lo define la fecha seleccionada en el popup, no `createdAt`.
- S6: "Cualquier usuario autenticado" puede descontar y ver historial (decisión del usuario; mismo alcance que la consulta).
- S7: La cantidad a descontar debe ser un entero >= 1 y no puede superar las noches disponibles del año en curso; si no hay disponibilidad suficiente, el backend rechaza con 400 y no persiste nada.
- S8: "si. ejecuta el edurecimiento" — respecto del riesgo de concurrencia presentado: dos descuentos simultáneos para el mismo accionista deben ejecutarse secuencialmente, de modo que solo uno pueda descontar cuando el saldo no alcanza para ambos.

## Tasks

- T1 (S2,S5,S7): Backend — agregar campo `fechaDescuento` (Date, opcional para conservar registros históricos; obligatorio en los nuevos descuentos del endpoint) al modelo `MovimientoNoches`. Ruta: inline. Commit: `66e72b6` — `feat(backend): add discount date to night movements`.
- T2 (S5): Backend — `consultarPorDni` filtra movimientos por `fechaDescuento` dentro del año en curso (1 ene 00:00:00.000 UTC <= fecha < 1 ene del año siguiente). Compatibilidad: movimientos sin `fechaDescuento` usan `createdAt`. Ruta: inline. Commit: `bca6fcd` — `feat(backend): reset night balance every January`.
- T3 (S1,S2,S4,S6,S7): Backend — `POST /api/consulta/accionista/dni/:dni/descuento` con body `{ cantidad, fecha }`: valida entero >= 1, fecha válida, disponibilidad suficiente del año de esa fecha; persiste movimiento `descuento` con `fechaDescuento`, `usuario` del token, `saldoAnterior`/`saldoNuevo`; devuelve el resultado actualizado de la consulta. Tests de integración. Ruta: inline. Commit: `1f9ff88` — `feat(backend): add night discount endpoint`.
- T4 (S3,S6): Backend — `GET /api/consulta/accionista/dni/:dni/historial`: devuelve movimientos del accionista ordenados por `fechaDescuento` descendente con fecha, tipo, cantidad, motivo, usuario. Tests de integración. Ruta: inline. Commit: `e0b5eda` — `feat(backend): add night movements history endpoint`.
- T5 (S1,S2,S4): Frontend — modal de descuento (cantidad + fecha default hoy) desde "Descontar noches"; al confirmar llama al endpoint y refresca la card con las noches actualizadas. Tests. Ruta: inline. Commit: `0419385` — `feat(frontend): add night discount popup`.
- T6 (S3): Frontend — vista de historial (fecha y noches tomadas, con devoluciones) desde "Ver historial". Tests. Ruta: inline. Commit: `ad18c3c` — `feat(frontend): show night movements history`.
- T7 (S8): Backend — serializar descuentos concurrentes por accionista con una cola en el proceso Node (deploy actual de una instancia); validar con dos POST simultáneos que solo uno persista cuando el saldo no alcanza para ambos. Ruta: inline. Commit pendiente.

## Log

- L1: "en una nueva branch vamos a implementar la funcionalidad para descontar una noche. Los requerimientos de descuesto es que se debe mostrar un popup para que se digite el numero de noches que se desean descontar, la fecha del dia de descuento se va almacenar y se debe seleccionar, por defecto se selecciona el dia de hoy. Quiero que analises todo para que tambien se pueda habilitar la funcionalidad del historia, mostrando la fecha y las noches que se han tomado. Es muy importante que se tenga muy encuenta que al realizar este descuento se debe deben adaptar las consultas o datos que tengan pendiente este historial cuando se visualicen las noches pendientes para disfrute por pare del accionista, teniendo en cuenta que las noches de beneficio vuelven a su estado nomral para todos los accionista el primero de enero del año en curso."
- L2: Decisiones del usuario: (1) el año de un descuento lo define la fecha seleccionada en el popup; (2) descuentos de años anteriores no restan (noches disponibles completas); (3) cualquier usuario autenticado puede descontar.
- L3: Corte de slice: backend completo hasta `e0b5eda` (395 líneas acumuladas); frontend inicia en `0419385`. No se crean PRs ni se publica sin decisión del usuario.
- L4: Verificación: suites focalizadas de consulta backend 17/17 y frontend nueva 2/2. Suite backend completa: 64 passed, 28 skipped; `accionistas.endpoints.test.ts` y `auth.users.endpoints.test.ts` fallaron en `beforeAll` por timeout de 10s al crear MongoMemoryServer, sin fallos de aserción. Verificador independiente `mw8cxhtp-1-73c3` expiró antes de comenzar y no entregó output; no se relanzó.
- L5: Suite frontend completa: 136 passed, 4 failed por timeouts de 10s en Landing (1), AccionistasManager (2) y UsersManager (1); ConsultaAccionista 2/2 pasó. Build de producción exitoso. Lint excedió 30s sin entregar resultado. Riesgo abierto: el descuento usa validación e inserción no atómicas; dos pedidos simultáneos pueden leer el mismo saldo. Falta decisión del usuario sobre endurecer concurrencia y sobre aceptar el cierre con checks completos no concluyentes.
- L6: "si. ejecuta el edurecimiento". El usuario autorizó el hardening de concurrencia. Alcance técnico: cola por accionista dentro del proceso Node actual; no resuelve coordinación entre múltiples instancias del backend.
